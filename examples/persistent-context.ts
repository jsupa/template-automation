import BrowserAutomation from '@lib/automation'
import { ProductListPage } from '@pages'
import { BrowserHelper, PerformanceHelper, ElementHelper, ScrollHelper } from '@helper/automation'
import config from '@config'
import { consola } from 'consola'
import path from 'path'

/**
 * Example 1: Persistent Context with Extension
 *
 * This example demonstrates:
 * - launchPersistentContext usage
 * - Loading browser extensions
 * - Session persistence
 * - User data management
 */
async function persistentContextExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('🔄 Starting persistent context automation example...')

    // Define extension path (optional)
    const extensionPath = path.join(process.cwd(), 'extensions', 'my-extension')

    // Launch with persistent context (automatically creates temp directory with unique ID)
    const context = await automation.launchPersistentContext(
      extensionPath, // Optional - comment out if no extension
      {
        headless: false,
        slowMo: 75,
        viewport: {
          width: 1920,
          height: 1080,
        },
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--no-first-run',
          '--no-default-browser-check',
          // Extension-specific args are automatically added if extensionPath is provided
        ],
      },
    )

    // Create new page in the persistent context
    const page = await automation.newPage()

    // Set up monitoring
    BrowserHelper.setupConsoleLogging(page)
    BrowserHelper.setupErrorHandling(page)

    // Set cookies for the session
    await BrowserHelper.setCookies(context, [
      {
        name: 'session_id',
        value: 'automation_session_' + Date.now(),
        domain: '.example.com',
        path: '/',
        secure: false,
        httpOnly: true,
      },
    ])

    // Navigate to a site
    await page.goto('https://example.com')

    // Take screenshot to verify extension/session state
    await BrowserHelper.takeScreenshot(page, 'persistent-context-start.png')

    // Perform some actions that would benefit from session persistence
    consola.info('🍪 Setting up session data...')

    // Set localStorage data
    await page.evaluate(() => {
      localStorage.setItem('automation_test', 'persistent_data')
      localStorage.setItem('user_preference', 'automation_mode')
    })

    // Add session storage
    await page.evaluate(() => {
      sessionStorage.setItem('current_session', 'automation_active')
    })

    // Navigate to another page to test persistence
    await page.goto('https://httpbin.org/cookies')

    // Check if our cookies are present
    const cookiesPage = await page.textContent('body')
    consola.info('🍪 Cookies data:', cookiesPage)

    consola.success('✅ Persistent context setup complete!')

    // The browser will stay open with the persistent context
    // Data will be saved to userDataDir and persist between runs
  } catch (error) {
    consola.error('💥 Persistent context automation failed:', error)
  } finally {
    // Note: In persistent context, you might want to keep the browser open
    // for continued use, or close it to save the session state
    await automation.close()
    consola.info('🧹 Persistent context closed and saved')
  }
}

/**
 * Example 2: E-commerce Automation with Persistent Session
 *
 * This example demonstrates:
 * - Shopping automation
 * - Cart management
 * - Session state maintenance
 * - Complex page interactions
 */
async function ecommerceAutomationExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('🛒 Starting e-commerce automation example...')

    // Launch persistent context for shopping session (uses temporary directory)
    await automation.launchPersistentContext(undefined, {
      headless: false,
      slowMo: 100,
      viewport: { width: 1366, height: 768 },
    })

    const page = await automation.newPage()

    // Navigate to an e-commerce demo site
    const productPage = new ProductListPage(page, 'https://demo.opencart.com')
    await productPage.goto()

    // Search for products
    consola.info('🔍 Searching for products...')
    await productPage.searchProducts('laptop')

    // Get all products
    const products = await productPage.getProducts()
    consola.info(`📦 Found ${products.length} products:`)
    products.forEach((product, index) => {
      consola.info(`  ${index + 1}. ${product.title} - ${product.price}`)
    })

    // Add first few products to cart
    if (products.length > 0) {
      consola.info('🛍️ Adding products to cart...')
      await productPage.addMultipleToCart([0, 1]) // Add first 2 products

      await page.waitForTimeout(2000) // Wait for cart updates
    }

    // Take screenshot of cart state
    await BrowserHelper.takeScreenshot(page, 'shopping-cart.png')

    // Navigate between pages to test session persistence
    await page.goto('https://demo.opencart.com/index.php?route=checkout/cart')

    // Check cart contents
    const cartItems = await page.locator('.table-responsive tr').count()
    consola.info(`🛒 Cart contains ${cartItems} items`)

    consola.success('✅ E-commerce automation completed!')
  } catch (error) {
    consola.error('💥 E-commerce automation failed:', error)
  } finally {
    await automation.close()
  }
}

/**
 * Example 3: Multi-tab Automation
 *
 * This example demonstrates:
 * - Multiple tab management
 * - Tab switching
 * - Cross-tab data sharing
 * - Parallel processing
 */
async function multiTabExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('📑 Starting multi-tab automation example...')

    const context = await automation.launchPersistentContext(undefined, {
      headless: false,
      slowMo: 50,
    })

    // Create multiple pages
    const pages = await Promise.all([automation.newPage(), automation.newPage(), automation.newPage()])

    const [page1, page2, page3] = pages

    // Navigate each tab to different sites
    consola.info('🚀 Opening multiple tabs...')

    const navigationPromises = [
      page1.goto('https://httpbin.org/json'),
      page2.goto('https://httpbin.org/html'),
      page3.goto('https://httpbin.org/xml'),
    ]

    await Promise.all(navigationPromises)

    // Extract data from each tab
    consola.info('📊 Extracting data from each tab...')

    const dataPromises = [
      // Tab 1: JSON data
      page1.evaluate(() => {
        const pre = document.querySelector('pre')
        try {
          return { type: 'json', data: JSON.parse(pre?.textContent || '{}') }
        } catch {
          return { type: 'json', data: null }
        }
      }),

      // Tab 2: HTML content
      page2.evaluate(() => {
        const title = document.querySelector('h1')?.textContent
        const links = Array.from(document.querySelectorAll('a')).map((a) => a.href)
        return { type: 'html', data: { title, links } }
      }),

      // Tab 3: XML content
      page3.evaluate(() => {
        const pre = document.querySelector('pre')
        return { type: 'xml', data: pre?.textContent }
      }),
    ]

    const results = await Promise.all(dataPromises)

    results.forEach((result, index) => {
      consola.info(`📄 Tab ${index + 1} (${result.type}):`, result.data)
    })

    // Demonstrate tab switching
    consola.info('🔄 Switching between tabs...')

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      if (page) {
        await page.bringToFront()
        await BrowserHelper.takeScreenshot(page, `tab-${i + 1}.png`)
        await page.waitForTimeout(1000)
      }
    }

    // Close extra tabs, keep main one
    await BrowserHelper.closeExtraTabs(context)

    consola.success('✅ Multi-tab automation completed!')
  } catch (error) {
    consola.error('💥 Multi-tab automation failed:', error)
  } finally {
    await automation.close()
  }
}

/**
 * Example 4: Performance Monitoring
 *
 * This example demonstrates:
 * - Performance measurement
 * - Network monitoring
 * - Resource optimization
 * - Metrics collection
 */
async function performanceMonitoringExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('⚡ Starting performance monitoring example...')

    await automation.launchPersistentContext(undefined, {
      headless: false,
      slowMo: 0, // No slow mo for accurate performance measurement
    })

    const page = await automation.newPage()

    // Set up network monitoring
    const networkMonitor = PerformanceHelper.setupNetworkMonitoring(page)

    // Block resources to improve performance
    await BrowserHelper.blockResources(page, ['image', 'stylesheet', 'font'])

    // Navigate and measure performance
    const startTime = Date.now()
    await page.goto('https://example.com', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime

    // Get performance metrics
    const performanceMetrics = await PerformanceHelper.measurePageLoad(page)
    const memoryUsage = await PerformanceHelper.getMemoryUsage(page)

    // Get network statistics
    const requests = networkMonitor.getRequests()
    const failedRequests = networkMonitor.getFailedRequests()

    // Log performance data
    consola.info('📊 Performance Metrics:')
    consola.info(`  ⏱️ Total Load Time: ${loadTime}ms`)
    consola.info(`  🏗️ DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`)
    consola.info(`  🎨 First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`)
    consola.info(`  🌐 Total Requests: ${requests.length}`)
    consola.info(`  ❌ Failed Requests: ${failedRequests.length}`)
    consola.info(`  🧠 Memory Usage: ${(memoryUsage.usedJSMemorySize / 1024 / 1024).toFixed(2)} MB`)

    // Test with different configurations
    await page.goto('https://httpbin.org/delay/2')

    const performanceData = {
      url: page.url(),
      loadTime,
      metrics: performanceMetrics,
      memory: memoryUsage,
      network: {
        totalRequests: requests.length,
        failedRequests: failedRequests.length,
      },
      timestamp: new Date().toISOString(),
    }

    consola.success('✅ Performance monitoring completed!')
    consola.info('📈 Performance data collected:', performanceData)
  } catch (error) {
    consola.error('💥 Performance monitoring failed:', error)
  } finally {
    await automation.close()
  }
}

// Export examples
export { persistentContextExample, ecommerceAutomationExample, multiTabExample, performanceMonitoringExample }

// Main runner
async function runPersistentExamples() {
  consola.info('🎬 Running persistent context examples...')

  const examples = [
    { name: 'Persistent Context', fn: persistentContextExample },
    { name: 'E-commerce Automation', fn: ecommerceAutomationExample },
    { name: 'Multi-tab Management', fn: multiTabExample },
    { name: 'Performance Monitoring', fn: performanceMonitoringExample },
  ]

  for (const example of examples) {
    consola.info(`\n🎯 Running ${example.name} example...`)
    await example.fn()
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait between examples
  }

  consola.success('🎉 All persistent context examples completed!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPersistentExamples().catch(console.error)
}

export { runPersistentExamples }
