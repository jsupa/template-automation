import type { Page, BrowserContext } from 'playwright'
import { consola } from 'consola'

/**
 * Browser Helper Functions
 * Utilities for browser and context management
 */
export class BrowserHelper {
  /**
   * Set browser viewport size
   */
  static async setViewport(page: Page, width: number, height: number): Promise<void> {
    await page.setViewportSize({ width, height })
    consola.info(`Viewport set to ${width}x${height}`)
  }

  /**
   * Set user agent
   */
  static async setUserAgent(page: Page, userAgent: string): Promise<void> {
    await page.setExtraHTTPHeaders({
      'User-Agent': userAgent,
    })
  }

  /**
   * Set geolocation
   */
  static async setGeolocation(context: BrowserContext, latitude: number, longitude: number): Promise<void> {
    await context.setGeolocation({ latitude, longitude })
    await context.grantPermissions(['geolocation'])
  }

  /**
   * Set timezone
   */
  static async setTimezone(context: BrowserContext, timezone: string): Promise<void> {
    await context.addInitScript(`
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: class extends Intl.DateTimeFormat {
          constructor(...args) {
            return super(...args)
          }
          resolvedOptions() {
            const options = super.resolvedOptions()
            options.timeZone = '${timezone}'
            return options
          }
        }
      })
    `)
  }

  /**
   * Block specific resources (images, stylesheets, etc.)
   */
  static async blockResources(page: Page, resourceTypes: string[] = ['image', 'stylesheet', 'font']): Promise<void> {
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType()
      if (resourceTypes.includes(resourceType)) {
        route.abort()
      } else {
        route.continue()
      }
    })
    consola.info(`Blocked resources: ${resourceTypes.join(', ')}`)
  }

  /**
   * Intercept and modify requests
   */
  static async interceptRequests(
    page: Page,
    urlPattern: string | RegExp,
    modifier: (
      url: string,
      headers: Record<string, string>,
    ) => {
      url?: string
      headers?: Record<string, string>
      body?: string
    },
  ): Promise<void> {
    await page.route(urlPattern, (route) => {
      const request = route.request()
      const modifications = modifier(request.url(), request.headers())

      route.continue({
        url: modifications.url,
        headers: modifications.headers,
        postData: modifications.body,
      })
    })
  }

  /**
   * Mock API responses
   */
  static async mockApiResponse(
    page: Page,
    urlPattern: string | RegExp,
    responseData: any,
    status: number = 200,
  ): Promise<void> {
    await page.route(urlPattern, (route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      })
    })
    consola.info(`API response mocked for pattern: ${urlPattern}`)
  }

  /**
   * Take full page screenshot with timestamp
   */
  static async takeScreenshot(
    page: Page | undefined,
    filename?: string,
    options?: {
      fullPage?: boolean
      quality?: number
      type?: 'png' | 'jpeg'
    },
  ): Promise<string> {
    if (!page) throw new Error('Page is undefined, cannot take screenshot')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotName = filename || `screenshot-${timestamp}.png`
    const path = `./screenshots/${screenshotName}`

    await page.screenshot({
      path,
      fullPage: options?.fullPage ?? true,
      quality: options?.quality,
      type: options?.type ?? 'png',
    })

    consola.success(`Screenshot saved: ${path}`)
    return path
  }

  /**
   * Get browser console logs
   */
  static setupConsoleLogging(page: Page): void {
    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()

      switch (type) {
        case 'error':
          consola.error(`Browser Console Error: ${text}`)
          break
        case 'warning':
          consola.warn(`Browser Console Warning: ${text}`)
          break
        case 'log':
        case 'info':
          consola.info(`Browser Console: ${text}`)
          break
        default:
          consola.debug(`Browser Console [${type}]: ${text}`)
      }
    })
  }

  /**
   * Handle page errors
   */
  static setupErrorHandling(page: Page): void {
    page.on('pageerror', (error) => {
      consola.error('Page Error:', error.message)
    })

    page.on('requestfailed', (request) => {
      consola.warn(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`)
    })
  }

  /**
   * Clear browser data
   */
  static async clearBrowserData(context: BrowserContext): Promise<void> {
    await context.clearCookies()
    await context.clearPermissions()
    consola.info('Browser data cleared')
  }

  /**
   * Set cookies from array
   */
  static async setCookies(
    context: BrowserContext,
    cookies: Array<{
      name: string
      value: string
      domain?: string
      path?: string
      expires?: number
      httpOnly?: boolean
      secure?: boolean
      sameSite?: 'Strict' | 'Lax' | 'None'
    }>,
  ): Promise<void> {
    await context.addCookies(cookies)
    consola.info(`Set ${cookies.length} cookies`)
  }

  /**
   * Get all cookies
   */
  static async getCookies(context: BrowserContext): Promise<any[]> {
    const cookies = await context.cookies()
    consola.info(`Retrieved ${cookies.length} cookies`)
    return cookies
  }

  /**
   * Wait for and handle new tabs/windows
   */
  static async handleNewTab(page: Page, triggerAction: () => Promise<void>): Promise<Page> {
    const [newPage] = await Promise.all([page.context().waitForEvent('page'), triggerAction()])

    await newPage.waitForLoadState()
    consola.info(`New tab opened: ${newPage.url()}`)
    return newPage
  }

  /**
   * Close all tabs except the main one
   */
  static async closeExtraTabs(context: BrowserContext): Promise<Page> {
    const pages = context.pages()
    const mainPage = pages[0]

    if (!mainPage) throw new Error('No main page found')

    for (let i = 1; i < pages.length; i++) {
      const page = pages[i]
      if (page) {
        await page.close()
      }
    }

    consola.info(`Closed ${pages.length - 1} extra tabs`)
    return mainPage
  }

  /**
   * Switch to tab by URL pattern
   */
  static async switchToTab(context: BrowserContext, urlPattern: string | RegExp): Promise<Page | null> {
    const pages = context.pages()

    for (const page of pages) {
      const url = page.url()
      const matches = typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)

      if (matches) {
        await page.bringToFront()
        consola.info(`Switched to tab: ${url}`)
        return page
      }
    }

    consola.warn(`No tab found matching pattern: ${urlPattern}`)
    return null
  }
}

/**
 * Performance Helper Functions
 */
export class PerformanceHelper {
  /**
   * Measure page load performance
   */
  static async measurePageLoad(page: Page): Promise<{
    domContentLoaded: number
    load: number
    firstContentfulPaint: number
    largestContentfulPaint: number
  }> {
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0, // Would need additional setup for LCP
      }
    })

    consola.info('Page Performance:', performanceData)
    return performanceData
  }

  /**
   * Monitor network requests
   */
  static setupNetworkMonitoring(page: Page): {
    getRequests: () => any[]
    getFailedRequests: () => any[]
  } {
    const requests: any[] = []
    const failedRequests: any[] = []

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now(),
      })
    })

    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText,
        timestamp: Date.now(),
      })
    })

    return {
      getRequests: () => requests,
      getFailedRequests: () => failedRequests,
    }
  }

  /**
   * Get memory usage
   */
  static async getMemoryUsage(page: Page): Promise<any> {
    return await page.evaluate(() => {
      return {
        usedJSMemorySize: (performance as any).memory?.usedJSMemorySize,
        totalJSMemorySize: (performance as any).memory?.totalJSMemorySize,
        jsMemoryLimit: (performance as any).memory?.jsMemoryLimit,
      }
    })
  }
}
