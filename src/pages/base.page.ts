import type { Page, Locator } from 'playwright'
import { consola } from 'consola'

/**
 * Base Page Class
 * Provides common functionality for all page objects
 * Implements the Page Object Model (POM) pattern
 */
export abstract class BasePage {
  protected page: Page
  protected url: string

  constructor(page: Page, url: string = '') {
    this.page = page
    this.url = url
  }

  /**
   * Navigate to the page URL
   * @param waitUntil - When to consider navigation complete
   */
  async goto(waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
    if (!this.url) {
      throw new Error('Page URL not defined')
    }

    consola.info(`Navigating to: ${this.url}`)
    await this.page.goto(this.url, { waitUntil })
    await this.waitForPageLoad()
    consola.success(`Successfully navigated to: ${this.url}`)
  }

  /**
   * Wait for page to be fully loaded
   * Override in child classes for page-specific loading conditions
   */
  protected async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Take a screenshot of the current page
   * @param filename - Optional filename for the screenshot
   */
  async takeScreenshot(filename?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotName = filename || `screenshot-${timestamp}.png`
    const path = `./screenshots/${screenshotName}`

    await this.page.screenshot({ path, fullPage: true })
    consola.info(`Screenshot saved: ${path}`)
    return path
  }

  /**
   * Wait for an element to be visible
   * @param selector - CSS selector or locator
   * @param timeout - Maximum wait time in milliseconds
   */
  async waitForElement(selector: string | Locator, timeout: number = 30000): Promise<Locator> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout })
    return locator
  }

  /**
   * Safe click that waits for element to be clickable
   * @param selector - CSS selector or locator
   * @param timeout - Maximum wait time in milliseconds
   */
  async safeClick(selector: string | Locator, timeout: number = 30000): Promise<void> {
    const locator = await this.waitForElement(selector, timeout)
    await locator.click()
    consola.info(`Clicked element: ${selector}`)
  }

  /**
   * Safe text input that clears field first
   * @param selector - CSS selector or locator
   * @param text - Text to input
   * @param timeout - Maximum wait time in milliseconds
   */
  async safeType(selector: string | Locator, text: string, timeout: number = 30000): Promise<void> {
    const locator = await this.waitForElement(selector, timeout)
    await locator.clear()
    await locator.fill(text)
    consola.info(`Typed text into element: ${selector}`)
  }

  /**
   * Get text content from an element
   * @param selector - CSS selector or locator
   * @param timeout - Maximum wait time in milliseconds
   */
  async getText(selector: string | Locator, timeout: number = 30000): Promise<string> {
    const locator = await this.waitForElement(selector, timeout)
    const text = await locator.textContent()
    return text || ''
  }

  /**
   * Check if element exists and is visible
   * @param selector - CSS selector or locator
   * @param timeout - Maximum wait time in milliseconds
   */
  async isVisible(selector: string | Locator, timeout: number = 5000): Promise<boolean> {
    try {
      const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
      await locator.waitFor({ state: 'visible', timeout })
      return true
    } catch {
      return false
    }
  }

  /**
   * Wait for navigation to complete
   * Useful after clicking links or submitting forms
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Scroll element into view
   * @param selector - CSS selector or locator
   */
  async scrollIntoView(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector
    await locator.scrollIntoViewIfNeeded()
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url()
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title()
  }

  /**
   * Execute JavaScript in the page context
   * @param script - JavaScript function to execute
   * @param args - Arguments to pass to the script
   */
  async executeScript<T = any>(script: (...args: any[]) => T, ...args: any[]): Promise<T> {
    return await this.page.evaluate(script, ...args)
  }

  /**
   * Wait for a specific condition to be true
   * @param condition - Function that returns a boolean
   * @param timeout - Maximum wait time in milliseconds
   */
  async waitForCondition(condition: () => Promise<boolean> | boolean, timeout: number = 30000): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return
      }
      await this.page.waitForTimeout(1000)
    }

    throw new Error(`Condition not met within ${timeout}ms`)
  }
}
