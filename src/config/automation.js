// Essential Automation Configuration
const AUTOMATION_CONFIG = {
  // GHL Configuration
  GHL: {
    LOGIN_URL: 'https://app.gohighlevel.com/?_gl=1%2a5xgtx5%2a_gcl_au%2aMzU1NjgwMzk1LjE3NDY4ODg1OTI.%2a_ga%2aMTM4NjkwODI3LjE3NDU1OTQwOTI.%2a_ga_HSZW8WNR22%2aczE3NDY4ODg1OTIkbzEkZzAkdDE3NDY4ODg1OTIkajYwJGwwJGgw',
    DEFAULT_PASSWORD: 'Chefor2004@'
  },

  // AI Configuration
  AI: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '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',
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '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',
    CLAUDE_MODEL: 'claude-opus-4-20250514',
    MAX_TOKENS: 32000 // Reduced to prevent timeout issues
  },

  // Browser Configuration
  BROWSER: {
    HEADLESS: process.env.BROWSER_HEADLESS !== 'false', // Default to headless, set env var to 'false' for non-headless
    TIMEOUT: {
      ELEMENT_WAIT: 30000,
      PAGE_LOAD: 60000,
      NETWORK_IDLE: 30000
    }
  }
};

module.exports = {
  AUTOMATION_CONFIG
}; 