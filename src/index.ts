import { consola } from 'consola'
import BrowserAutomation from '@lib/automation'
import config from '@config'

/**
 * Automation Template Main Entry Point
 *
 * This template provides a complete structure for browser automation projects
 * using playwright-extra with stealth capabilities.
 *
 * Features:
 * - Browser automation with launch() and launchPersistentContext()
 * - Page Object Model pattern
 * - Comprehensive helper functions
 * - Data models and storage
 * - Configuration management
 * - Example implementations
 */

async function main() {
  consola.info('🤖 Automation Template Started')
  consola.info('==============================')

  // Display configuration
  consola.info('📋 Current Configuration:')
  consola.info(`  Environment: ${process.env.NODE_ENV || 'development'}`)
  consola.info(`  Browser: ${config.browser.type}`)
  consola.info(`  Headless: ${config.browser.headless}`)
  consola.info(`  Slow Motion: ${config.browser.slowMo}ms`)
  consola.info(`  Viewport: ${config.browser.viewport.width}x${config.browser.viewport.height}`)
  consola.info(`  Stealth: ${config.automation.stealth.enabled}`)

  // Quick demonstration
  const automation = new BrowserAutomation()

  try {
    consola.info('\n🚀 Running quick automation demo...')

    // Launch browser
    await automation.launch({
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
    })

    // Create page and navigate
    const page = await automation.newPage()
    await page.goto('https://example.com')

    // Get page info
    const title = await page.title()
    const url = page.url()

    consola.success(`✅ Successfully navigated to: ${title}`)
    consola.info(`🔗 URL: ${url}`)

    // Take screenshot
    await page.screenshot({
      path: './screenshots/demo.png',
      fullPage: true,
    })
    consola.info('📸 Screenshot saved: ./screenshots/demo.png')

    consola.info('\n📚 To explore more features, run:')
    consola.info('  npm run examples        # All examples')
    consola.info('  npm run examples:basic  # Basic automation')
    consola.info('  npm run examples:persistent # Persistent context')
  } catch (error) {
    consola.error('❌ Demo failed:', error)
  } finally {
    await automation.close()
    consola.info('🧹 Browser closed')
  }

  consola.success('🎉 Automation template ready for use!')
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    consola.error('💥 Application failed:', error)
    process.exit(1)
  })
}

export default main
