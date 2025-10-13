import type { Page, Locator } from 'playwright'
import { consola } from 'consola'

/**
 * Element Helper Functions
 * Utilities for interacting with DOM elements
 */
export class ElementHelper {
  /**
   * Smart click that handles various click scenarios
   */
  static async smartClick(
    page: Page,
    selector: string | Locator,
    options?: {
      force?: boolean
      timeout?: number
      retries?: number
      scrollIntoView?: boolean
    },
  ): Promise<void> {
    const { force = false, timeout = 30000, retries = 3, scrollIntoView = true } = options || {}

    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (scrollIntoView) {
          await locator.scrollIntoViewIfNeeded()
        }

        await locator.waitFor({ state: 'visible', timeout })
        await locator.click({ force, timeout })
        return
      } catch (error) {
        if (attempt === retries) {
          consola.error(`Failed to click element after ${retries} attempts:`, error)
          throw error
        }

        consola.warn(`Click attempt ${attempt} failed, retrying...`)
        await page.waitForTimeout(1000)
      }
    }
  }

  /**
   * Smart text input with validation
   */
  static async smartType(
    page: Page,
    selector: string | Locator,
    text: string,
    options?: {
      clear?: boolean
      delay?: number
      timeout?: number
      validate?: boolean
    },
  ): Promise<void> {
    const { clear = true, delay = 50, timeout = 30000, validate = true } = options || {}

    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    await locator.waitFor({ state: 'visible', timeout })

    if (clear) {
      await locator.clear()
    }

    await locator.fill(text, { timeout })

    if (validate) {
      const actualValue = await locator.inputValue()
      if (actualValue !== text) {
        throw new Error(`Text validation failed. Expected: "${text}", Actual: "${actualValue}"`)
      }
    }
  }

  /**
   * Get element text with fallbacks
   */
  static async getTextContent(page: Page, selector: string | Locator, fallbackSelectors?: string[]): Promise<string> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    try {
      const text = await locator.textContent()
      if (text?.trim()) {
        return text.trim()
      }
    } catch {
      // Try fallback selectors if main selector fails
    }

    if (fallbackSelectors) {
      for (const fallbackSelector of fallbackSelectors) {
        try {
          const fallbackText = await page.locator(fallbackSelector).textContent()
          if (fallbackText?.trim()) {
            return fallbackText.trim()
          }
        } catch {
          continue
        }
      }
    }

    return ''
  }

  /**
   * Check if element exists (without waiting)
   */
  static async exists(page: Page, selector: string | Locator, timeout: number = 1000): Promise<boolean> {
    try {
      const locator = typeof selector === 'string' ? page.locator(selector) : selector
      await locator.waitFor({ state: 'attached', timeout })
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if element is visible (without waiting)
   */
  static async isVisible(page: Page, selector: string | Locator, timeout: number = 1000): Promise<boolean> {
    try {
      const locator = typeof selector === 'string' ? page.locator(selector) : selector
      await locator.waitFor({ state: 'visible', timeout })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get element attribute with fallback
   */
  static async getAttribute(
    page: Page,
    selector: string | Locator,
    attribute: string,
    fallback: string = '',
  ): Promise<string> {
    try {
      const locator = typeof selector === 'string' ? page.locator(selector) : selector
      const value = await locator.getAttribute(attribute)
      return value || fallback
    } catch {
      return fallback
    }
  }

  /**
   * Wait for element to have specific attribute value
   */
  static async waitForAttribute(
    page: Page,
    selector: string | Locator,
    attribute: string,
    expectedValue: string,
    timeout: number = 30000,
  ): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    await page.waitForFunction(
      ({ selector, attribute, expectedValue }) => {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector
        return element?.getAttribute(attribute) === expectedValue
      },
      { selector, attribute, expectedValue },
      { timeout },
    )
  }

  /**
   * Get all elements matching selector
   */
  static async getAllElements(
    page: Page,
    selector: string,
  ): Promise<
    Array<{
      text: string
      value: string
      href?: string
      src?: string
      id?: string
      className?: string
    }>
  > {
    return await page.evaluate((selector) => {
      const elements = Array.from(document.querySelectorAll(selector))
      return elements.map((el) => ({
        text: el.textContent?.trim() || '',
        value: (el as HTMLInputElement).value || '',
        href: (el as HTMLAnchorElement).href,
        src: (el as HTMLImageElement).src,
        id: el.id,
        className: el.className,
      }))
    }, selector)
  }

  /**
   * Hover over element with retry logic
   */
  static async hover(page: Page, selector: string | Locator, retries: number = 3): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await locator.scrollIntoViewIfNeeded()
        await locator.hover()
        return
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        await page.waitForTimeout(1000)
      }
    }
  }

  /**
   * Double click element
   */
  static async doubleClick(page: Page, selector: string | Locator, timeout: number = 30000): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout })
    await locator.dblclick()
  }

  /**
   * Right click (context menu)
   */
  static async rightClick(page: Page, selector: string | Locator, timeout: number = 30000): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout })
    await locator.click({ button: 'right' })
  }

  /**
   * Get element bounding box
   */
  static async getBoundingBox(
    page: Page,
    selector: string | Locator,
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    return await locator.boundingBox()
  }

  /**
   * Check if element is in viewport
   */
  static async isInViewport(page: Page, selector: string | Locator): Promise<boolean> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    return await page.evaluate(
      (element) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
      },
      await locator.elementHandle(),
    )
  }

  /**
   * Focus on element
   */
  static async focus(page: Page, selector: string | Locator, timeout: number = 30000): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout })
    await locator.focus()
  }

  /**
   * Press key on element
   */
  static async pressKey(page: Page, selector: string | Locator, key: string, timeout: number = 30000): Promise<void> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector
    await locator.waitFor({ state: 'visible', timeout })
    await locator.press(key)
  }

  /**
   * Get CSS property value
   */
  static async getCSSProperty(page: Page, selector: string | Locator, property: string): Promise<string> {
    const locator = typeof selector === 'string' ? page.locator(selector) : selector

    return await page.evaluate(
      ({ element, property }) => {
        if (!element) return ''
        return window.getComputedStyle(element).getPropertyValue(property)
      },
      { element: await locator.elementHandle(), property },
    )
  }
}

/**
 * Table Helper Functions
 */
export class TableHelper {
  /**
   * Get all table data
   */
  static async getTableData(page: Page, tableSelector: string = 'table'): Promise<string[][]> {
    return await page.evaluate((selector) => {
      const table = document.querySelector(selector)
      if (!table) return []

      const rows = Array.from(table.querySelectorAll('tr'))
      return rows.map((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'))
        return cells.map((cell) => cell.textContent?.trim() || '')
      })
    }, tableSelector)
  }

  /**
   * Get table headers
   */
  static async getTableHeaders(page: Page, tableSelector: string = 'table'): Promise<string[]> {
    return await page.evaluate((selector) => {
      const table = document.querySelector(selector)
      if (!table) return []

      const headerRow = table.querySelector('thead tr, tr:first-child')
      if (!headerRow) return []

      const headers = Array.from(headerRow.querySelectorAll('th, td'))
      return headers.map((header) => header.textContent?.trim() || '')
    }, tableSelector)
  }

  /**
   * Get specific table cell
   */
  static async getTableCell(page: Page, tableSelector: string, row: number, column: number): Promise<string> {
    return await page.evaluate(
      ({ selector, row, column }) => {
        const table = document.querySelector(selector)
        if (!table) return ''

        const targetRow = table.querySelectorAll('tr')[row]
        if (!targetRow) return ''

        const targetCell = targetRow.querySelectorAll('td, th')[column]
        return targetCell?.textContent?.trim() || ''
      },
      { selector: tableSelector, row, column },
    )
  }

  /**
   * Click table cell
   */
  static async clickTableCell(page: Page, tableSelector: string, row: number, column: number): Promise<void> {
    const cellSelector = `${tableSelector} tr:nth-child(${row + 1}) td:nth-child(${column + 1}), ${tableSelector} tr:nth-child(${row + 1}) th:nth-child(${column + 1})`
    await ElementHelper.smartClick(page, cellSelector)
  }
}
