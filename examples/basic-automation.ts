import BrowserAutomation from '@lib/automation'
import { LoginPage } from '@pages'
import { WaitHelper, BrowserHelper } from '@helper/automation'
import config from '@config'
import { consola } from 'consola'

/**
 * Example 1: Basic Login Automation using launch()
 *
 * This example demonstrates:
 * - Basic browser launch
 * - Page object model usage
 * - Form automation
 * - Error handling
 * - Screenshot capture
 */
async function basicLoginExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('🚀 Starting basic login automation example...')

    // Launch browser with custom options
    await automation.launch({
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      args: [...config.browser.args, '--window-size=1280,720'],
    })

    // Create a new page
    const page = await automation.newPage()

    // Set up browser helpers
    BrowserHelper.setupConsoleLogging(page)
    BrowserHelper.setupErrorHandling(page)

    // Navigate to login page
    const loginPage = new LoginPage(page, 'https://example.com/login')
    await loginPage.goto()

    // Wait for page to be ready
    await WaitHelper.waitForNetworkIdle(page)

    // Take screenshot before interaction
    await loginPage.takeScreenshot('before-login.png')

    // Perform login
    consola.info('🔐 Attempting login...')
    await loginPage.login('user@example.com', 'password123', true)

    // Check if login was successful
    const isSuccess = await loginPage.isLoginSuccessful()

    if (isSuccess) {
      consola.success('✅ Login successful!')
      await BrowserHelper.takeScreenshot(page, 'login-success.png')
    } else {
      const errorMessage = await loginPage.getErrorMessage()
      consola.error('❌ Login failed:', errorMessage)
      await BrowserHelper.takeScreenshot(page, 'login-failed.png')
    }

    // Wait a bit to see the result
    await page.waitForTimeout(3000)
  } catch (error) {
    consola.error('💥 Automation failed:', error)

    // Take error screenshot if we have a page
    const pages = automation.getPages()
    if (pages.length > 0) {
      await BrowserHelper.takeScreenshot(pages[0], 'error-screenshot.png')
    }
  } finally {
    // Clean up
    await automation.close()
    consola.info('🧹 Browser closed')
  }
}

/**
 * Example 2: Multi-step Form Automation
 *
 * This example demonstrates:
 * - Complex form interactions
 * - Multi-step workflows
 * - Conditional logic
 * - Data validation
 */
async function formAutomationExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('📝 Starting form automation example...')

    await automation.launch({
      headless: false,
      slowMo: 100,
    })

    const page = await automation.newPage()

    // Navigate to form page
    await page.goto('https://httpbin.org/forms/post')

    // Fill form fields with different techniques
    await page.fill('input[name="custname"]', 'John Doe')
    await page.fill('input[name="custtel"]', '+1-555-123-4567')
    await page.fill('input[name="custemail"]', 'john@example.com')

    // Select from dropdown
    await page.selectOption('select[name="size"]', 'large')

    // Check multiple checkboxes
    await page.check('input[name="topping"][value="bacon"]')
    await page.check('input[name="topping"][value="cheese"]')

    // Fill textarea
    await page.fill('textarea[name="comments"]', 'This is a test automation comment.')

    // Take screenshot before submission
    await BrowserHelper.takeScreenshot(page, 'form-filled.png')

    // Submit form
    await page.click('input[type="submit"]')

    // Wait for response
    await WaitHelper.waitForNetworkIdle(page, 1000)

    // Verify submission
    const responseText = await page.textContent('body')
    if (responseText?.includes('John Doe')) {
      consola.success('✅ Form submitted successfully!')
    } else {
      consola.error('❌ Form submission failed')
    }
  } catch (error) {
    consola.error('💥 Form automation failed:', error)
  } finally {
    await automation.close()
  }
}

/**
 * Example 3: Data Extraction
 *
 * This example demonstrates:
 * - Web scraping
 * - Data extraction
 * - Element interaction
 * - Result processing
 */
async function dataExtractionExample() {
  const automation = new BrowserAutomation()

  try {
    consola.info('🔍 Starting data extraction example...')

    await automation.launch({
      headless: true, // Run in background for scraping
      slowMo: 0,
    })

    const page = await automation.newPage()

    // Navigate to a page with data
    await page.goto('https://httpbin.org/json')

    // Extract JSON data
    const jsonData = await page.evaluate(() => {
      const preElement = document.querySelector('pre')
      if (preElement) {
        try {
          return JSON.parse(preElement.textContent || '{}')
        } catch {
          return null
        }
      }
      return null
    })

    consola.info('📊 Extracted data:', jsonData)

    // Navigate to another page for more extraction
    await page.goto('https://httpbin.org/html')

    // Extract all links
    const links = await page.evaluate(() => {
      const linkElements = Array.from(document.querySelectorAll('a'))
      return linkElements.map((link) => ({
        text: link.textContent?.trim(),
        href: link.href,
        target: link.target,
      }))
    })

    consola.info('🔗 Found links:', links)

    // Extract page title and meta info
    const pageInfo = {
      title: await page.title(),
      url: page.url(),
      timestamp: new Date().toISOString(),
    }

    consola.info('📄 Page info:', pageInfo)
  } catch (error) {
    consola.error('💥 Data extraction failed:', error)
  } finally {
    await automation.close()
  }
}

// Run examples
async function runExamples() {
  consola.info('🎬 Running automation examples...')

  // Run each example
  await basicLoginExample()
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait between examples

  await formAutomationExample()
  await new Promise((resolve) => setTimeout(resolve, 2000))

  await dataExtractionExample()

  consola.success('🎉 All examples completed!')
}

// Export examples for individual use
export { basicLoginExample, formAutomationExample, dataExtractionExample, runExamples }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error)
}
