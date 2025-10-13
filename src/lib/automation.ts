import { chromium } from 'playwright-extra'
import type { Browser, BrowserContext, Page, LaunchOptions } from 'playwright'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { consola } from 'consola'
import path from 'path'
import { promises as fs } from 'fs'
import { randomUUID } from 'crypto'

class BrowserAutomation {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private pages: Page[] = []
  private tempUserDataDir: string | null = null

  constructor() {
    this.setupPlugins()
  }

  private setupPlugins(): void {
    chromium.use(StealthPlugin())
  }

  async launch(options?: LaunchOptions): Promise<Browser> {
    try {
      consola.info('Launching browser...')

      const defaultOptions: LaunchOptions = {
        headless: false,
        slowMo: 75,
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--no-first-run',
          '--no-default-browser-check',
        ],
        ...options,
      }

      this.browser = await chromium.launch(defaultOptions)
      consola.success('Browser launched successfully')
      return this.browser
    } catch (error) {
      consola.error('Failed to launch browser:', error)
      throw error
    }
  }

  async launchPersistentContext(
    pathToExtension?: string,
    options?: Parameters<typeof chromium.launchPersistentContext>[1],
  ): Promise<BrowserContext> {
    try {
      consola.info('Launching persistent browser context with temporary directory...')

      // Create temporary directory with unique ID
      const uniqueId = randomUUID()
      const tempDir = path.join(process.cwd(), 'temp', `browser-${uniqueId}`)
      this.tempUserDataDir = tempDir

      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true })
      consola.info(`Created temporary browser data directory: ${tempDir}`)

      const args = [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
      ]

      // Add extension arguments if extension path is provided
      if (pathToExtension) {
        const extensionPath = path.resolve(pathToExtension)
        args.push(`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`)
        consola.info(`Loading extension from: ${extensionPath}`)
      }

      const defaultOptions = {
        headless: false,
        slowMo: 75,
        args,
        viewport: { width: 1920, height: 1080 },
        ignoreDefaultArgs: ['--enable-automation'],
        ...options,
      }

      this.context = await chromium.launchPersistentContext(tempDir, defaultOptions)
      consola.success('Persistent browser context launched successfully')
      return this.context
    } catch (error) {
      consola.error('Failed to launch persistent context:', error)
      // Clean up temp directory if context creation failed
      if (this.tempUserDataDir) {
        await this.cleanupTempDirectory()
      }
      throw error
    }
  }

  /**
   * Create a new page in the current browser/context
   * @returns New page instance
   */
  async newPage(): Promise<Page> {
    try {
      let page: Page

      if (this.context) {
        // Use persistent context
        page = await this.context.newPage()
      } else if (this.browser) {
        // Use regular browser
        const context = await this.browser.newContext()
        page = await context.newPage()
      } else {
        throw new Error('No browser or context available. Launch browser first.')
      }

      this.pages.push(page)
      consola.success(`New page created. Total pages: ${this.pages.length}`)
      return page
    } catch (error) {
      consola.error('Failed to create new page:', error)
      throw error
    }
  }

  private async cleanupTempDirectory(): Promise<void> {
    if (!this.tempUserDataDir) return

    try {
      // Check if directory exists before attempting to remove
      await fs.access(this.tempUserDataDir)
      await fs.rm(this.tempUserDataDir, { recursive: true, force: true })
      consola.success(`Cleaned up temporary directory: ${this.tempUserDataDir}`)
    } catch (error) {
      consola.warn(`Failed to cleanup temporary directory ${this.tempUserDataDir}:`, error)
    } finally {
      this.tempUserDataDir = null
    }
  }

  /**
   * Close browser/context and cleanup
   */
  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close()
        this.context = null
        consola.info('Browser context closed')
      }

      if (this.browser) {
        await this.browser.close()
        this.browser = null
        consola.info('Browser closed')
      }

      await this.cleanupTempDirectory()
    } catch (error) {
      consola.error('Failed to close browser:', error)
      throw error
    }
  }

  /**
   * Get all active pages
   */
  getPages(): Page[] {
    return [...this.pages]
  }

  /**
   * Check if browser is active
   */
  isActive(): boolean {
    return this.browser !== null || this.context !== null
  }
}

const exampleLaunch = async () => {
  const automation = new BrowserAutomation()

  try {
    // Launch browser
    await automation.launch({
      headless: false,
      slowMo: 100,
    })

    // Create new page
    const page = await automation.newPage()

    // Navigate to a website
    await page.goto('https://example.com')
    await page.waitForLoadState('networkidle')

    // Perform automation tasks here...
  } catch (error) {
    consola.error('Automation failed:', error)
  } finally {
    await automation.close()
  }
}

/**
 * Example usage function for persistent context launch
 */
const examplePersistentLaunch = async () => {
  const automation = new BrowserAutomation()

  try {
    // Launch with persistent context (uses temporary directory with unique ID)
    const extensionPath = './extensions/my-extension' // Optional

    await automation.launchPersistentContext(extensionPath, {
      headless: false,
      slowMo: 75,
    })

    // Create new page
    const page = await automation.newPage()

    // Navigate to a website
    await page.goto('https://example.com')
    await page.waitForLoadState('networkidle')

    // Perform automation tasks here...
  } catch (error) {
    consola.error('Automation failed:', error)
  } finally {
    // Temporary directory will be automatically cleaned up
    await automation.close()
  }
}

export default BrowserAutomation
export { exampleLaunch, examplePersistentLaunch }
