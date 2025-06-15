const BrowserUtils = require('../utils/browserUtils');
const GHLUtils = require('../utils/ghlUtils');
const AIContentService = require('./aiContentService');
const { Automation, ExecutionLog, TwoFactorRequest, Workspace } = require('../models');
const crypto = require('crypto');

class GHLAutomationService {
  constructor() {
    this.aiService = new AIContentService();
  }

  async runAutomation(input, user, workspace) {
    const { email, password, subaccountId, customValues, companyData, serviceText } = input;

    console.log('Starting GHL automation with input:', input);

    // Handle AI generation for new fields if requested
    let processedCompanyData = { ...companyData };
    
    if (companyData?.aiGenerateBroadService && companyData?.name) {
      try {
        console.log('Generating AI content for Broad Service Name');
        const aiResponse = await this.generateAIContent(
          `Generate a broad service name (1-3 words) for a company called "${companyData.name}". This should be a general category that describes what type of business this is.`,
          companyData
        );
        if (aiResponse.success && aiResponse.data) {
          processedCompanyData.broadServiceName = aiResponse.data.trim();
          console.log('AI generated Broad Service Name:', processedCompanyData.broadServiceName);
        }
      } catch (error) {
        console.error('Error generating AI content for Broad Service Name:', error);
      }
    }

    if (companyData?.aiGenerateSubHeadline && companyData?.name) {
      try {
        console.log('Generating AI content for Sub Headline Text');
        const aiResponse = await this.generateAIContent(
          `Generate a catchy sub-headline (one sentence, 8-12 words) for a company called "${companyData.name}". This will appear beneath the company name on the homepage hero section. Make it compelling and describe what they do.`,
          companyData
        );
        if (aiResponse.success && aiResponse.data) {
          processedCompanyData.subHeadlineText = aiResponse.data.trim();
          console.log('AI generated Sub Headline Text:', processedCompanyData.subHeadlineText);
        }
      } catch (error) {
        console.error('Error generating AI content for Sub Headline Text:', error);
      }
    }

    console.log('Merging company data into customValues');
    const mergedCustomValues = {
      ...(customValues || {}),
      'Company Name': processedCompanyData?.name || '',
      'Company Owner First Name': processedCompanyData?.ownerFirstName || '',
      'Company Email': processedCompanyData?.email || '',
      'Global Button Colors': processedCompanyData?.globalButtonColors || '',
      'Broad Service Name': processedCompanyData?.broadServiceName || '',
      'Sub Headline Text': processedCompanyData?.subHeadlineText || '',
      'Company GMB Link': processedCompanyData?.gmbLink || '',
      'Company Facebook Link': processedCompanyData?.facebookLink || '',
      'Google Map Embed': processedCompanyData?.googleMapEmbed || '',
      'GMB Review Link': processedCompanyData?.gmbReviewLink || '',
      'Company Instagram Link': processedCompanyData?.instagramLink || '',
    };

    if (processedCompanyData?.phone && /^\d{10}$/.test(processedCompanyData.phone)) {
      console.log('Formatting phone numbers');
      const phone = processedCompanyData.phone;
      const aestheticPhone = `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
      const functionalPhone = `1${phone}`;
      
      mergedCustomValues['Company Phone (Aesthetic)'] = aestheticPhone;
      mergedCustomValues['Company Phone (Functional)'] = functionalPhone;
    }

    console.log('Creating automation record with PENDING status');
    const automation = new Automation({
      workspace: workspace._id,
      name: `GHL Automation - ${new Date().toLocaleString()}`,
      email,
      password,
      subaccountId,
      customValues: mergedCustomValues,
      companyData: processedCompanyData || {},
      serviceText,
      status: 'PENDING',
      createdBy: user._id
    });
    console.log("PASSWORD", password)
    await automation.save();
    console.log('Automation record created:', automation._id);

    console.log('Adding automation to workspace queue');
    await workspace.addToQueue(automation._id);
    
    const isFirstInQueue = workspace.automationQueue[0].equals(automation._id);
    
    if (isFirstInQueue) {
      console.log('Automation is first in queue, starting now');
      return await this.executeAutomation(automation);
    } else {
      console.log('Automation queued successfully');
      return {
        success: true,
        message: 'Automation queued successfully',
        automation
      };
    }
  }

  async executeAutomation(automation) {
    let browser = null;

    try {
      console.log('Setting automation status to RUNNING');
      await automation.start();
      await this.logExecution(automation._id, 'started', 'Automation started');

      console.log('Creating browser instance');
      browser = await BrowserUtils.createBrowser(false);
      const { context, page } = await BrowserUtils.createPage(browser);

      let objectJson = automation.customValues || {};

      console.log('Starting browser automation');
      await automation.updateProgress(0, 'Starting browser automation');
      await this.realAuto(page, automation.email, automation.password, automation.subaccountId, objectJson, automation);

      console.log('Automation completed successfully');
      await automation.updateProgress(100, 'Automation completed successfully');
      await this.logExecution(automation._id, 'completed', 'Automation completed successfully');

      return {
        success: true,
        message: 'Automation completed successfully',
        automation
      };

    } catch (error) {
      console.error('Automation error:', error.message);

      await automation.fail(error.message);
      await this.logExecution(automation._id, 'failed', `Automation failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        automation
      };
    } finally {
      if (browser) {
        console.log('Closing browser - automation completed');
        await BrowserUtils.closeBrowser(browser);
      }

      console.log('Removing automation from front of queue');
      const workspace = await Workspace.findById(automation.workspace);
      if (workspace) {
        await workspace.removeFromFront();
        
        if (workspace.automationQueue.length > 0) {
          const nextAutomationId = workspace.automationQueue[0];
          const nextAutomation = await Automation.findById(nextAutomationId)
            .populate('createdBy')
            .populate('workspace');
            
          if (nextAutomation && nextAutomation.status === 'PENDING') {
            console.log(`Starting next automation in queue: ${nextAutomation.id}`);
            setImmediate(() => this.executeAutomation(nextAutomation));
          }
        }
      }
    }
  }

  async realAuto(page, email, password, subaccountId, objectJson, automation) {
    console.log("Starting automation for GHL");
    const fallbackMap = {
      'Service Area 1': 'Biz Area 1',
      'Service Area 2': 'Biz Area 2',
      'Service Area 3': 'Biz Area 3',
      'Service Area 4': 'Biz Area 4',
      'Service Area 5': 'Biz Area 5',
      'Service Area 6': 'Biz Area 6',
      'Service Area 7': 'Biz Area 7',
      'Service Area 8': 'Biz Area 8',
      'Service Area 9': 'Biz Area 9',
      'Service Area 10': 'Biz Area 10',
      'Service Area 11': 'Biz Area 11',
      'Service Area 12': 'Biz Area 12'
    };

    const serviceAreaKeys = [
      'Service Area 1', 'Service Area 2', 'Service Area 3', 'Service Area 4',
      'Service Area 5', 'Service Area 6', 'Service Area 7', 'Service Area 8',
      'Service Area 9', 'Service Area 10', 'Service Area 11', 'Service Area 12'
    ];

    console.log('Navigating to GoHighLevel');
    await automation.updateProgress(0, 'Navigating to GoHighLevel');
    console.log('Logging into GoHighLevel');
    await automation.updateProgress(0, 'Logging into GoHighLevel');
    await this.logExecution(automation._id, 'in_progress', 'Starting GHL login process');

    await GHLUtils.loginToGHL(page, email, password, automation._id);
    console.log("Logged in to GHL");
    console.log('Navigating to custom values');
    await automation.updateProgress(0, 'Navigating to custom values');
    const customValuesUrl = `https://app.gohighlevel.com/v2/location/${subaccountId}/settings/custom_values`;
    await page.goto(customValuesUrl);
    await this.logExecution(automation._id, 'in_progress', `Navigated to custom values: ${customValuesUrl}`);

    let completedFields = 0;
    console.log('Processing custom values:', objectJson);
    const totalFields = Object.keys(objectJson).length;

    const companyFields = [
      'Company Name',
      'Company Owner First Name',
      'Company Email',
      'Company Phone (Aesthetic)',
      'Company Phone (Functional)',
      'Global Button Colors',
      'Broad Service Name',
      'Sub Headline Text',
      'Company GMB Link',
      'Company Facebook Link',
      'Google Map Embed',
      'GMB Review Link',
      'Company Instagram Link'
    ];

    for (const field of companyFields) {
      if (field in objectJson && objectJson[field] !== "") {
        console.log(`Creating custom value for field: ${field}`);
        await this.createCustomValue(page, field, field, objectJson[field], false);
        completedFields++;
        const progress = Math.floor((completedFields / totalFields) * 35);
        await automation.updateProgress(progress, `Processing field: ${field}`);
      }
    }

    for (let i = 1; i <= 12; i++) {
      const labels = [
        `Service Area ${i}`,
        `Service ${i}`,
        `Service ${i} Homepage Blurb`,
        `Service ${i} Text 1`,
        `Service ${i} Text 2`,
        `Service ${i} Text 3`,
        `Service ${i} Headline 1`,
        `Service ${i} Headline 2`,
        `Service ${i} Headline 3`,
        `Service Area ${i} Text 1`,
        `Service Area ${i} Text 2`,
        `Service Area ${i} Text 3`,
        `Service Area ${i} Headline 1`,
        `Service Area ${i} Headline 2`,
        `Service Area ${i} Headline 3`,
      ];

      for (const label of labels) {
        if (!(label in objectJson) || objectJson[label] === "") {
          continue;
        }

        const serviceArea = serviceAreaKeys.includes(label);
        const useLabel = serviceArea ? fallbackMap[label] : label;

        console.log(`Creating custom value for label: ${label}`);
        await this.createCustomValue(page, label, useLabel, objectJson[label], serviceArea);

        completedFields++;
        const progress = Math.floor((completedFields / totalFields) * 35);
        await automation.updateProgress(progress, `Processing field: ${label}`);
      }
    }

    console.log(`Processed ${completedFields} custom values`);
    await this.logExecution(automation._id, 'in_progress', `Processed ${completedFields} custom values`);
  }

  async continueAfter2FA(automationId, twoFactorCode) {
    console.log('Continuing automation after 2FA code submission');

    const automation = await Automation.findById(automationId);

    if (!automation) {
      throw new Error('Automation not found');
    }

    if (automation.status !== 'WAITING_2FA') {
      throw new Error('Automation is not waiting for 2FA');
    }

    try {
      console.log('Storing 2FA code');
      automation.twoFactorCode = twoFactorCode;
      await automation.save();

      console.log('2FA code stored, waiting automation will pick it up and continue');

      return {
        success: true,
        message: '2FA code submitted, automation will continue',
        automation
      };

    } catch (error) {
      console.error('Error submitting 2FA code:', error.message);

      return {
        success: false,
        error: error.message,
        automation
      };
    }
  }

  async populateCustomValues(page, objectJson, automation) {
    console.log('Populating custom values');
    const fallbackMap = {
      'Service Area 1': 'Biz Area 1',
      'Service Area 2': 'Biz Area 2',
      'Service Area 3': 'Biz Area 3',
      'Service Area 4': 'Biz Area 4',
      'Service Area 5': 'Biz Area 5',
      'Service Area 6': 'Biz Area 6',
      'Service Area 7': 'Biz Area 7',
      'Service Area 8': 'Biz Area 8',
      'Service Area 9': 'Biz Area 9',
      'Service Area 10': 'Biz Area 10',
      'Service Area 11': 'Biz Area 11',
      'Service Area 12': 'Biz Area 12'
    };

    const serviceAreaKeys = [
      'Service Area 1', 'Service Area 2', 'Service Area 3', 'Service Area 4',
      'Service Area 5', 'Service Area 6', 'Service Area 7', 'Service Area 8',
      'Service Area 9', 'Service Area 10', 'Service Area 11', 'Service Area 12'
    ];

    let completedFields = 0;
    const totalFields = Object.keys(objectJson).length;

    for (let i = 1; i <= 12; i++) {
      const labels = [
        `Service Area ${i}`,
        `Service ${i}`,
        `Service ${i} Homepage Blurb`,
        `Service ${i} Text 1`,
        `Service ${i} Text 2`,
        `Service ${i} Text 3`,
        `Service ${i} Headline 1`,
        `Service ${i} Headline 2`,
        `Service ${i} Headline 3`,
        `Service Area ${i} Text 1`,
        `Service Area ${i} Text 2`,
        `Service Area ${i} Text 3`,
        `Service Area ${i} Headline 1`,
        `Service Area ${i} Headline 2`,
        `Service Area ${i} Headline 3`,
      ];

      for (const label of labels) {
        if (!(label in objectJson) || objectJson[label] === "") {
          continue;
        }

        const serviceArea = serviceAreaKeys.includes(label);
        const useLabel = serviceArea ? fallbackMap[label] : label;

        console.log(`Creating custom value for label: ${label}`);
        await this.createCustomValue(page, label, useLabel, objectJson[label], serviceArea);

        completedFields++;
        const progress = Math.floor((completedFields / totalFields));
        await automation.updateProgress(progress, `Processing field: ${label}`);
      }
    }

    console.log(`Processed ${completedFields} custom values`);
    await this.logExecution(automation._id, 'in_progress', `Processed ${completedFields} custom values`);
  }

  async createCustomValue(page, originalLabel, useLabel, value, isServiceArea) {
    try {
      console.log(`Creating custom value: ${originalLabel}`);
      await page.locator('button', { hasText: 'New Custom Value' }).first().click();
      await page.getByRole('textbox', { name: 'Enter name' }).fill(originalLabel);
      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForTimeout(3000);
      await page.getByRole('textbox', { name: 'Search Custom Values' }).click();
      await page.getByRole('textbox', { name: 'Search Custom Values' }).fill(useLabel);

      try {
        await page.getByRole('row', { name: useLabel + ' {{' }).locator('svg').nth(2).click();
      } catch (err) {
        const categoryName = isServiceArea ? 'Service Areas' : 'Services';
        await page.getByRole('row', { name: useLabel + ` ${categoryName} {{` }).locator('svg').nth(3).click();
      }

      console.log(`Editing custom value: ${useLabel}`);
      await page.getByText('Edit Custom Value').click();
      await page.getByRole('textbox', { name: 'Enter value' }).click();
      await page.getByRole('textbox', { name: 'Enter value' }).fill(value);
      await page.getByRole('button', { name: 'Update' }).click();
      await page.waitForTimeout(3000);
    } catch (error) {
      console.error(`Error creating custom value ${originalLabel}:`, error.message);
    }
  }

  async logExecution(automationId, status, message, data = null) {
    try {
      console.log(`Logging execution: ${status} - ${message}`);
      const log = new ExecutionLog({
        automation: automationId,
        status,
        message,
        data
      });
      await log.save();
    } catch (error) {
      console.error('Failed to log execution:', error.message);
    }
  }

  async runContentGeneration(serviceText, companyData = {}) {
    console.log('Running content generation only with serviceText:', serviceText);

    try {
      const result = await this.aiService.generateContent(serviceText, companyData);

      if (result.success) {
        console.log('Content generation completed successfully');
        return {
          success: true,
          data: result.data,
          rawResponse: result.rawResponse
        };
      } else {
        console.error('Content generation failed:', result.error);
        return {
          success: false,
          error: result.error,
          data: null
        };
      }
    } catch (error) {
      console.error('Error in content generation:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async generateAIContent(prompt, companyData = {}) {
    console.log('Generating AI content with prompt:', prompt);
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: this.aiService.openaiApiKey
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates concise, professional business content. Respond with only the requested content, no explanations or extra formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      if (response?.choices?.[0]?.message?.content) {
        console.log('AI content generated successfully');
        return {
          success: true,
          data: response.choices[0].message.content.trim()
        };
      } else {
        console.error('No content generated');
        return {
          success: false,
          error: 'No content generated'
        };
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GHLAutomationService; 
