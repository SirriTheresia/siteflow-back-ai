const axios = require('axios');
const { AUTOMATION_CONFIG } = require('../config/automation');
const OpenAI = require('openai');
class AIContentService {
  constructor() {
    this.openaiApiKey = AUTOMATION_CONFIG.AI.OPENAI_API_KEY;
    this.claudeApiKey = AUTOMATION_CONFIG.AI.CLAUDE_API_KEY;
  }

  generateServiceFieldsTemplate() {
    const serviceFields = { "About Us": "" };
    
    for (let i = 1; i <= 12; i++) {
      [
        `Service ${i}`,
        `Service ${i} Homepage Blurb`,
        `Service ${i} Text 1`,
        `Service ${i} Text 2`,
        `Service ${i} Text 3`,
        `Service ${i} Headline 1`,
        `Service ${i} Headline 2`,
        `Service ${i} Headline 3`,
        `Service Area ${i}`,
        `Service Area ${i} Text 1`,
        `Service Area ${i} Text 2`,
        `Service Area ${i} Text 3`,
        `Service Area ${i} Headline 1`,
        `Service Area ${i} Headline 2`,
        `Service Area ${i} Headline 3`,
      ].forEach((key) => {
        serviceFields[key] = "";
      });
    }
    
    return serviceFields;
  }

  generateSystemPrompt(companyData = {}) {
    const serviceFields = this.generateServiceFieldsTemplate();
    
    let prompt = `You are an AI content generator for Go-High-Level custom fields. Generate content that follows this exact JSON structure:

${JSON.stringify(serviceFields, null, 2)}

IMPORTANT RULES:
- Every field value must be a non-empty string
- Only populate fields that are relevant to the provided service text
- If only 1 service area is given, suggest AT LEAST 5 nearby cities/areas (or more, based on how many are provided)
- If only 1 service is given, generate AT LEAST 5 related sub-services (or more, based on how many are provided)
- Generate compelling headlines and descriptive content
- Output must be valid JSON only — do NOT include markdown formatting, explanations, or comments
- You must EXECUTE ON EVERY SINGLE RULE in this prompt
- There can absolutely be more service areas than services, or vice versa — they are NOT linked or dependent on each other
- It’s okay if some service fields have empty strings at the end to balance the structure
- ALL TEXT MUST BE LONG. No one-sentence paragraphs. Each paragraph must be at least **6 full sentences** long

For each number i = 1 to 10, generate or extract the following fields:

1. "Service {i} Homepage Blurb"  
   → A short 1–3 sentence summary describing what this service is. This will show on the homepage under a service section or card.

2. "Service {i} Headline {j}" and "Service {i} Text {j}" for j = 1 to 3  
   → These represent 3 feature sections of the service:
   - "Service {i} Headline {j}" = A short, benefit-driven headline
   - "Service {i} Text {j}" = A medium-length paragraph with at least 6 sentences, expanding on that section's unique feature or benefit

3. "Service Area {i} Headline {j}" and "Service Area {i} Text {j}" for j = 1 to 3  
   → These are localized sections about the service in each city:
   - "Service Area {i} Headline {j}" = A short, local-relevant headline (e.g., “Top-Rated House Cleaning in Miami”)
   - "Service Area {i} Text {j}" = A 6-sentence paragraph explaining the benefit of this service to that specific local audience

4. "Service Area {i}" = a string like "City, State"

⚠️ ONLY include populated data for however many services or service areas are available. If only 3 service areas exist, do NOT populate fields for Service Area 4 to 10.

⚠️ AGAIN: VALID JSON ONLY. NO MARKDOWN. NO COMMENTS. NO HEADERS. NO EXPLANATIONS. NO SHORT PARAGRAPHS.`
    // Add company data context if provided
 
    return prompt;
  }

  async generateContentWithClaude(serviceText, companyData = {}) {
    const openai = new OpenAI({
      apiKey: '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'
  });
  
    console.log('Generating content with Claude API');
    
    // Validate inputs
    if (!serviceText || typeof serviceText !== 'string' || serviceText.trim().length === 0) {
      return { 
        success: false, 
        error: 'Service text is required and must be a non-empty string', 
        data: null 
      };
    }

    if (!this.claudeApiKey || this.claudeApiKey.length < 10) {
      return { 
        success: false, 
        error: 'Claude API key is not properly configured', 
        data: null 
      };
    }
    
    try {
      const systemPrompt = this.generateSystemPrompt(companyData);
      console.log(this.claudeApiKey);
      console.log('Making Claude API request...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `${serviceText} ${JSON.stringify(companyData)}`,
          },
        ],
        max_tokens: 16384,
        response_format: { type: "json_object" }
      });
      console.log(response.choices[0].message.content);

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        return { 
          success: false, 
          error: 'Invalid response format from OpenAI API', 
          data: null 
        };
      }

      const rawContent = response.choices[0].message.content;
      // console.log('Raw OpenAI response:', rawContent.substring(0, 200) + '...');
      
      let parsed;
      try {
        parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
      } catch (error) {
        return { 
          success: false, 
          error: 'Failed to parse raw content into an object', 
          data: null 
        };
      }
      
      // Validate that we got an object
      if (!parsed || typeof parsed !== 'object') {
        return { 
          success: false, 
          error: 'Generated content is not a valid object', 
          data: null 
        };
      }
      
      console.log('Successfully generated and parsed content');
      return { success: true, data: parsed, rawResponse: JSON.stringify(rawContent) };
    } catch (error) {
      console.error('Claude API error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 400) {
          return { 
            success: false, 
            error: `Claude API returned 400: ${JSON.stringify(error.response.data)}`, 
            data: null 
          };
        } else if (error.response.status === 401) {
          return { 
            success: false, 
            error: 'Claude API authentication failed - check your API key', 
            data: null 
          };
        } else if (error.response.status === 429) {
          return { 
            success: false, 
            error: 'Claude API rate limit exceeded - please try again later', 
            data: null 
          };
        }
      } else if (error.request) {
        // The request was made but no response was received
        return { 
          success: false, 
          error: 'No response received from Claude API - check your internet connection', 
          data: null 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred with Claude API', 
        data: null 
      };
    }
  }

  async generateContent(serviceText, companyData = {}) {
    console.log('Generating content with Claude');
    return await this.generateContentWithClaude(serviceText, companyData);
  }

  validateGeneratedContent(contentData) {
    console.log('Validating generated content');
    
    const errors = [];
    const warnings = [];
    
    // Check if data exists
    if (!contentData || typeof contentData !== 'object') {
      errors.push('Generated content is not a valid object');
      return { isValid: false, errors, warnings };
    }
    
    // Count services and service areas
    let serviceCount = 0;
    let serviceAreaCount = 0;
    
    for (let i = 1; i <= 12; i++) {
      if (contentData[`Service ${i}`]) {
        serviceCount++;
      }
      if (contentData[`Service Area ${i}`]) {
        serviceAreaCount++;
      }
    }
    
    // Validate minimum requirements
    if (serviceCount === 0) {
      errors.push('No services found in generated content');
    }
    
    if (serviceAreaCount === 0) {
      warnings.push('No service areas found in generated content');
    }
    
    // Check for required fields for each service
    for (let i = 1; i <= serviceCount; i++) {
      const serviceName = contentData[`Service ${i}`];
      if (!serviceName) continue;
      
      const requiredFields = [
        `Service ${i} Homepage Blurb`,
        `Service ${i} Headline 1`,
        `Service ${i} Text 1`
      ];
      
      requiredFields.forEach(field => {
        if (!contentData[field] || contentData[field].trim() === '') {
          warnings.push(`Missing or empty field: ${field}`);
        }
      });
    }
    
    console.log(`Validation complete: ${serviceCount} services, ${serviceAreaCount} service areas`);
    console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        serviceCount,
        serviceAreaCount,
        totalFields: Object.keys(contentData).length
      }
    };
  }

  async processAndValidateContent(serviceText, preferredProvider = 'claude') {
    console.log('Processing and validating content generation');
    
    try {
      // Generate content
      const result = await this.generateContent(serviceText, preferredProvider);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          data: null,
          validation: null
        };
      }
      
      // Validate content
      const validation = this.validateGeneratedContent(result.data);
      
      return {
        success: true,
        data: result.data,
        validation,
        rawResponse: result.rawResponse,
        usage: result.usage
      };
    } catch (error) {
      console.error('Error in processAndValidateContent:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null,
        validation: null
      };
    }
  }
}

module.exports = AIContentService; 