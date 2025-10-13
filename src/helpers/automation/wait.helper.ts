import type { Page, Locator, ElementHandle } from 'playwright'
import { consola } from 'consola'

/**
 * Wait Helper Functions
 * Common waiting utilities for automation
 */
export class WaitHelper {
  /**
   * Wait for element to be present and visible
   */
  static async waitForVisible(page: Page, selector: string | Locator, timeout: number = 30000): Promise<Locator> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout })
    return locator
  }

  /**
   * Wait for element to be hidden
   */
  static async waitForHidden(page: Page, selector: string | Locator, timeout: number = 30000): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.waitFor({ state: 'hidden', timeout })
  }

  /**
   * Wait for page to reach a specific URL or URL pattern
   */
  static async waitForUrl(page: Page, urlOrPattern: string | RegExp, timeout: number = 30000): Promise<void> {
    await page.waitForURL(urlOrPattern, { timeout })
  }

  /**
   * Wait for network to be idle (no requests for specified time)
   */
  static async waitForNetworkIdle(page: Page, idleTime: number = 500, timeout: number = 30000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout })
  }

  /**
   * Wait for element to contain specific text
   */
  static async waitForText(
    page: Page,
    selector: string | Locator,
    text: string,
    timeout: number = 30000,
  ): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.filter({ hasText: text }).waitFor({ timeout })
  }

  /**
   * Wait for element count to reach expected number
   */
  static async waitForCount(
    page: Page,
    selector: string | Locator,
    count: number,
    timeout: number = 30000,
  ): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await expect(locator).toHaveCount(count, { timeout })
  }

  /**
   * Wait for custom condition to be true
   */
  static async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    timeout: number = 30000,
    interval: number = 1000,
  ): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    throw new Error(`Condition not met within ${timeout}ms`)
  }

  /**
   * Wait for file download to complete
   */
  static async waitForDownload(
    page: Page,
    triggerAction: () => Promise<void>,
    timeout: number = 30000,
  ): Promise<string> {
    const downloadPromise = page.waitForEvent('download', { timeout })
    await triggerAction()
    const download = await downloadPromise
    const path = await download.path()
    consola.success(`Download completed: ${path}`)
    return path || ''
  }
}

/**
 * Scroll Helper Functions
 */
export class ScrollHelper {
  /**
   * Scroll to top of page
   */
  static async scrollToTop(page: Page): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)
  }

  /**
   * Scroll to bottom of page
   */
  static async scrollToBottom(page: Page): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
  }

  /**
   * Scroll element into view
   */
  static async scrollIntoView(
    page: Page,
    selector: string | Locator,
    behavior: 'auto' | 'smooth' = 'auto',
  ): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  }

  /**
   * Scroll by specific amount
   */
  static async scrollBy(page: Page, x: number, y: number): Promise<void> {
    await page.evaluate(({ x, y }) => window.scrollBy(x, y), { x, y })
    await page.waitForTimeout(300)
  }

  /**
   * Infinite scroll until condition is met or max iterations reached
   */
  static async infiniteScroll(
    page: Page,
    condition: () => Promise<boolean>,
    maxScrolls: number = 10,
    scrollDelay: number = 1000,
  ): Promise<void> {
    let scrollCount = 0

    while (scrollCount < maxScrolls && !(await condition())) {
      await this.scrollToBottom(page)
      await page.waitForTimeout(scrollDelay)
      scrollCount++
    }

    consola.info(`Infinite scroll completed after ${scrollCount} scrolls`)
  }

  /**
   * Scroll to element with offset
   */
  static async scrollToElementWithOffset(page: Page, selector: string | Locator, offsetY: number = 0): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    const element = await locator.first()
    const box = await element.boundingBox()

    if (box) {
      await page.evaluate(
        ({ top, offset }) => {
          window.scrollTo(0, top + offset)
        },
        { top: box.y, offset: offsetY },
      )
      await page.waitForTimeout(300)
    }
  }
}

/**
 * Form Helper Functions
 */
export class FormHelper {
  /**
   * Fill form field with retry logic
   */
  static async fillField(page: Page, selector: string | Locator, value: string, retries: number = 3): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    for (let i = 0; i < retries; i++) {
      try {
        await locator.clear()
        await locator.fill(value)

        // Verify the value was set correctly
        const actualValue = await locator.inputValue()
        if (actualValue === value) {
          return
        }
      } catch (error) {
        if (i === retries - 1) throw error
        await page.waitForTimeout(1000)
      }
    }
  }

  /**
   * Select dropdown option by text or value
   */
  static async selectOption(page: Page, selector: string | Locator, option: string): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    // Try selecting by value first, then by text
    try {
      await locator.selectOption({ value: option })
    } catch {
      await locator.selectOption({ label: option })
    }
  }

  /**
   * Handle file upload
   */
  static async uploadFile(page: Page, selector: string | Locator, filePath: string | string[]): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.setInputFiles(filePath)
  }

  /**
   * Check/uncheck checkbox
   */
  static async setCheckbox(page: Page, selector: string | Locator, checked: boolean): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    const isChecked = await locator.isChecked()

    if (isChecked !== checked) {
      await locator.click()
    }
  }

  /**
   * Select radio button by value or text
   */
  static async selectRadio(page: Page, name: string, value: string): Promise<void> {
    const radio = page.locator(
      `input[name="${name}"][value="${value}"], input[name="${name}"] + label:has-text("${value}")`,
    )
    await radio.click()
  }

  /**
   * Fill form with data object
   */
  static async fillFormData(page: Page, formData: Record<string, any>, selectorPrefix: string = ''): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      if (value === undefined || value === null) continue

      const selector = selectorPrefix ? `${selectorPrefix} [name="${field}"]` : `[name="${field}"]`
      const element = page.locator(selector)

      if (!(await element.isVisible())) continue

      const tagName = await element.evaluate((el) => el.tagName.toLowerCase())
      const inputType = await element.getAttribute('type')

      switch (tagName) {
        case 'input':
          if (inputType === 'checkbox') {
            await this.setCheckbox(page, element, Boolean(value))
          } else if (inputType === 'radio') {
            await this.selectRadio(page, field, String(value))
          } else if (inputType === 'file') {
            await this.uploadFile(page, element, value)
          } else {
            await this.fillField(page, element, String(value))
          }
          break
        case 'select':
          await this.selectOption(page, element, String(value))
          break
        case 'textarea':
          await this.fillField(page, element, String(value))
          break
      }
    }
  }
}

// Re-export expect for convenience (assuming it's available)
let expect: any
try {
  expect = require('@playwright/test').expect
} catch {
  // Fallback if @playwright/test is not available
  expect = {
    toHaveCount: () => ({ timeout: (t: number) => Promise.resolve() }),
  }
}

export { expect }
