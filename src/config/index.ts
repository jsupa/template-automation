import path from 'path'

/**
 * Browser Configuration
 */
interface BrowserConfig {
  // Browser type (currently only chromium supported with playwright-extra)
  type: 'chromium'

  // Display settings
  headless: boolean
  slowMo: number

  // Viewport settings
  viewport: {
    width: number
    height: number
  }

  // Browser arguments
  args: string[]

  // Extensions
  extensions: {
    enabled: boolean
    paths: string[]
  }

  // User data directory for persistent sessions
  userDataDir: string

  // User agent override
  userAgent?: string

  // Timezone override
  timezone?: string

  // Geolocation
  geolocation?: {
    latitude: number
    longitude: number
  }
}

/**
 * Automation Configuration
 */
interface AutomationConfig {
  // General settings
  maxRetries: number
  defaultTimeout: number
  pageLoadTimeout: number

  // Screenshot settings
  screenshots: {
    enabled: boolean
    onError: boolean
    directory: string
    format: 'png' | 'jpeg'
    quality?: number
  }

  // Storage settings
  storage: {
    type: 'memory' | 'file'
    directory: string
    autoSave: boolean
  }

  // Network settings
  network: {
    blockImages: boolean
    blockCSS: boolean
    blockFonts: boolean
    blockAds: boolean
    userAgent?: string
  }

  // Security/Stealth settings
  stealth: {
    enabled: boolean
    plugins: string[]
  }

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    console: boolean
    file: boolean
    directory: string
  }
}

/**
 * Default configuration values
 */
const defaultConfig = {
  webPort: parseInt(process.env.WEB_PORT || '1337'),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/dev-001',
  sessionSecret: process.env.SESSION_SECRET || 'oreo',

  // Browser configuration
  browser: {
    type: 'chromium' as const,
    headless: process.env.BROWSER_HEADLESS === 'true' || false,
    slowMo: parseInt(process.env.BROWSER_SLOW_MO || '75'),
    viewport: {
      width: parseInt(process.env.BROWSER_WIDTH || '1920'),
      height: parseInt(process.env.BROWSER_HEIGHT || '1080'),
    },
    args: [
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
    extensions: {
      enabled: process.env.EXTENSIONS_ENABLED === 'true' || false,
      paths: process.env.EXTENSION_PATHS?.split(',') || [],
    },
    userDataDir: process.env.USER_DATA_DIR || path.join(process.cwd(), 'browser-data'),
    userAgent: process.env.USER_AGENT,
    timezone: process.env.TIMEZONE || 'America/New_York',
    geolocation:
      process.env.LATITUDE && process.env.LONGITUDE
        ? {
            latitude: parseFloat(process.env.LATITUDE),
            longitude: parseFloat(process.env.LONGITUDE),
          }
        : undefined,
  } as BrowserConfig,

  // Automation configuration
  automation: {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
    pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT || '60000'),

    screenshots: {
      enabled: process.env.SCREENSHOTS_ENABLED !== 'false',
      onError: process.env.SCREENSHOTS_ON_ERROR !== 'false',
      directory: process.env.SCREENSHOTS_DIR || path.join(process.cwd(), 'screenshots'),
      format: (process.env.SCREENSHOT_FORMAT as 'png' | 'jpeg') || 'png',
      quality: process.env.SCREENSHOT_QUALITY ? parseInt(process.env.SCREENSHOT_QUALITY) : undefined,
    },

    storage: {
      type: (process.env.STORAGE_TYPE as 'memory' | 'file') || 'file',
      directory: process.env.STORAGE_DIR || path.join(process.cwd(), 'data'),
      autoSave: process.env.AUTO_SAVE !== 'false',
    },

    network: {
      blockImages: process.env.BLOCK_IMAGES === 'true',
      blockCSS: process.env.BLOCK_CSS === 'true',
      blockFonts: process.env.BLOCK_FONTS === 'true',
      blockAds: process.env.BLOCK_ADS === 'true',
      userAgent: process.env.NETWORK_USER_AGENT,
    },

    stealth: {
      enabled: process.env.STEALTH_ENABLED !== 'false',
      plugins: process.env.STEALTH_PLUGINS?.split(',') || ['stealth'],
    },

    logging: {
      level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      console: process.env.LOG_CONSOLE !== 'false',
      file: process.env.LOG_FILE === 'true',
      directory: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    },
  } as AutomationConfig,
}

/**
 * Environment-specific configurations
 */
const environments = {
  development: {
    ...defaultConfig,
    browser: {
      ...defaultConfig.browser,
      headless: false,
      slowMo: 100,
    },
    automation: {
      ...defaultConfig.automation,
      logging: {
        ...defaultConfig.automation.logging,
        level: 'debug' as const,
      },
    },
  },

  production: {
    ...defaultConfig,
    browser: {
      ...defaultConfig.browser,
      headless: true,
      slowMo: 0,
    },
    automation: {
      ...defaultConfig.automation,
      logging: {
        ...defaultConfig.automation.logging,
        level: 'warn' as const,
      },
    },
  },

  testing: {
    ...defaultConfig,
    browser: {
      ...defaultConfig.browser,
      headless: true,
      slowMo: 0,
    },
    automation: {
      ...defaultConfig.automation,
      screenshots: {
        ...defaultConfig.automation.screenshots,
        enabled: false,
      },
      storage: {
        ...defaultConfig.automation.storage,
        type: 'memory' as const,
      },
    },
  },
}

/**
 * Get configuration based on NODE_ENV
 */
const getConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return environments[env as keyof typeof environments] || environments.development
}

const config = getConfig()

export default config
export type { BrowserConfig, AutomationConfig }
