const { chromium } = require('playwright');
const { AUTOMATION_CONFIG } = require('../config/automation');

class BrowserUtils {
  static async createBrowser(useProxy = false, proxyConfig = null) {
    console.log('Launching browser', useProxy ? 'with proxy' : 'without proxy');
    
    const launchOptions = {
      headless: AUTOMATION_CONFIG.BROWSER.HEADLESS
    };
      const launchOption = {
      headless: false
    };

    if (useProxy && proxyConfig) {
      launchOptions.proxy = proxyConfig;
      console.log(`Using proxy: ${proxyConfig.server}`);
    }

    try {
      const browser = await chromium.launch(launchOptions);
      console.log('Browser launched successfully');
      return browser;
    } catch (error) {
      console.error('Error launching browser:', error.message);
      throw error;
    }
  }

  static async createPage(browser) {
    try {
      console.log('Creating browser context');
      const context = await browser.newContext();
      
      console.log('Creating new page');
      const page = await context.newPage();
      console.log('New page created');
      
      return { context, page };
    } catch (error) {
      console.error('Error creating page:', error.message);
      throw error;
    }
  }

  static async safeClick(page, selector, options = {}) {
    const timeout = options.timeout || AUTOMATION_CONFIG.BROWSER.TIMEOUT.ELEMENT_WAIT;
    
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      await page.click(selector, { timeout });
      return true;
    } catch (error) {
      console.error(`Error clicking selector ${selector}:`, error.message);
      return false;
    }
  }

  static async safeFill(page, selector, text, options = {}) {
    const timeout = options.timeout || AUTOMATION_CONFIG.BROWSER.TIMEOUT.ELEMENT_WAIT;
    const delay = options.delay || 100;
    
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      await page.fill(selector, text, { delay });
      return true;
    } catch (error) {
      console.error(`Error filling selector ${selector}:`, error.message);
      return false;
    }
  }

  static async safeWaitAndClick(page, selector, timeout = null) {
    const waitTimeout = timeout || AUTOMATION_CONFIG.BROWSER.TIMEOUT.ELEMENT_WAIT;
    
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: waitTimeout });
      await page.click(selector);
      console.log(`Successfully clicked: ${selector}`);
      return true;
    } catch (error) {
      console.error(`Failed to wait and click ${selector}:`, error.message);
      return false;
    }
  }

  static async extractText(page, selector) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        return text ? text.trim() : '';
      }
      return '';
    } catch (error) {
      console.error(`Error extracting text from ${selector}:`, error.message);
      return '';
    }
  }

  static async waitForElement(page, selector, timeout = null) {
    const waitTimeout = timeout || AUTOMATION_CONFIG.BROWSER.TIMEOUT.ELEMENT_WAIT;
    
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: waitTimeout });
      return true;
    } catch (error) {
      console.error(`Element not found: ${selector}`, error.message);
      return false;
    }
  }

  static async navigateToUrl(page, url, waitForLoad = true) {
    try {
      console.log(`Navigating to: ${url}`);
      await page.goto(url);
      
      if (waitForLoad) {
        await page.waitForLoadState('networkidle');
      }
      
      console.log(`Successfully navigated to: ${url}`);
      return true;
    } catch (error) {
      console.error(`Error navigating to ${url}:`, error.message);
      return false;
    }
  }

  static async closeBrowser(browser) {
    try {
      if (browser) {
        await browser.close();
        console.log('Browser closed successfully');
      }
    } catch (error) {
      console.error('Error closing browser:', error.message);
    }
  }

  static async takeScreenshot(page, path) {
    try {
      await page.screenshot({ path, fullPage: true });
      console.log(`Screenshot saved to: ${path}`);
      return true;
    } catch (error) {
      console.error('Error taking screenshot:', error.message);
      return false;
    }
  }

  static async evaluateScript(page, script, ...args) {
    try {
      const result = await page.evaluate(script, ...args);
      return result;
    } catch (error) {
      console.error('Error evaluating script:', error.message);
      throw error;
    }
  }
}

module.exports = BrowserUtils; 