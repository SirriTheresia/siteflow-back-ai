const BrowserUtils = require('./browserUtils');
const { AUTOMATION_CONFIG } = require('../config/automation');
const { Automation } = require('../models');

class GHLUtils {
  static async loginToGHL(page, email, password = null, automationId) {

    if (email == 'tee@gositeflow.com') {
password = 'Chefor2004@'
    } else {
    
      password = 'Sirri1234@'
    }

    console.log('Starting login process to HighLevel');

    try {
      await page.goto('https://app.gohighlevel.com', {
        timeout: 999999,
        waitUntil: 'load'
      });
      await page.setDefaultTimeout(999999); // safety net

      console.log('Navigated to login page');

      await page.waitForTimeout(800);

      console.log('Waiting for email field');
      await page.waitForSelector('#email', { timeout: 999999 });
      console.log('Filling email field');
      await page.fill('#email', email, { delay: 100, timeout: 999999 });

      await page.waitForTimeout(800);

      console.log('Waiting for password field');
      await page.waitForSelector('#password', { timeout: 999999 });
      console.log('Filling password field');
      await page.fill('#password', password, { delay: 100, timeout: 999999 });

      await page.waitForTimeout(800);

      const loginButtonSelector =
        'button.hl-btn.justify-center.w-full.inline-flex.items-center.px-4.py-2.border.border-transparent.text-sm.font-medium.rounded.text-white.bg-curious-blue-500.hover\\:bg-curious-blue-600.focus\\:outline-none.focus\\:ring-2.focus\\:ring-offset-2.focus\\:ring-curious-blue-600';
      console.log('Waiting for login button');
      await page.waitForSelector(loginButtonSelector, { timeout: 999999 });
      console.log('Clicking login button');
      await page.click(loginButtonSelector, { timeout: 999999 });

      const securityBtnSelector = 'button:has-text("Send Security Code")';
      console.log('Waiting for "Send Security Code" button');
      await page.waitForSelector(securityBtnSelector, {
        timeout: 999999,
        state: 'visible'
      });
      console.log('Clicking "Send Security Code"');
      await page.click(securityBtnSelector, { timeout: 999999 });

      const automation = await Automation.findById(automationId);
      automation.status = 'WAITING_2FA';
      await automation.save();

      console.log('2FA required - waiting for code from user...');
      const twoFactorCode = await this.waitForTwoFactorCode(automationId, page);

      if (!twoFactorCode) {
        throw new Error('2FA code timeout - no code received within 10 minutes');
      }

      automation.status = 'RUNNING';
      await automation.save();

      console.log('2FA login completed successfully');
      return true;
    } catch (error) {
      console.error('Error during GHL login:', error.message);
      throw error;
    }
  }

  static async checkForMessages(page) {
    let messageFound = false;
    const maxRetries = 20;
    let attempts = 0;

    while (!messageFound && attempts < maxRetries) {
      console.log(`Attempt ${attempts + 1} of ${maxRetries}`);
      try {
        console.log('Checking visibility of security code message');
        const isSecurityCodeMessageVisible = await page.isVisible('text=The security code is not');
        console.log('Checking visibility of agency dashboard message');
        const isAgencyDashboardVisible = await page.isVisible('text=Click here to switch');

        if (isSecurityCodeMessageVisible) {
          console.log('The security code message is visible on the screen');
          return false;
        } else if (isAgencyDashboardVisible) {
          console.log('The agency dashboard message is visible, breaking the loop');
          return true;
        } else {
          console.log('Neither message is visible, retrying...');
        }
      } catch (error) {
        console.error('Error checking for messages:', error);
      }

      attempts++;
      if (!messageFound) {
        await page.waitForTimeout(2000);
      }
    }

    return false;
  }

  static async waitForTwoFactorCode(automationId, page) {
    const maxAttempts = 200;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const automation = await Automation.findById(automationId);

      if (automation && automation.twoFactorCode) {
        const code = automation.twoFactorCode;
        await automation.save();

        for (let i = 0; i < code.length; i++) {
          const selector = `div:nth-child(${i + 1}) > .m-2`;
          await page.waitForSelector(selector, { timeout: 999999 });
          await page.locator(selector).fill(code[i], { timeout: 999999 });
        }

        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');

        await page.waitForTimeout(6000);
        const passed = await this.checkForMessages(page);

        if (passed) {
          return code;
        } else {
          automation.status = 'REENTER_2FA';
          await automation.save();
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    return null;
  }
}

module.exports = GHLUtils;
