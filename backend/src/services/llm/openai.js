/**
 * OpenAI Provider
 * Handles Copilot-style suggestions and general completions
 */

const OpenAI = require('openai');
const BaseLLMProvider = require('./base');

class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.name = 'openai';
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY
    });
    
    // Pricing per 1M tokens (as of Feb 2024)
    this.pricing = {
      'gpt-4-turbo-preview': {
        prompt: 10.00,
        completion: 30.00
      },
      'gpt-4': {
        prompt: 30.00,
        completion: 60.00
      },
      'gpt-3.5-turbo': {
        prompt: 0.50,
        completion: 1.50
      },
      'gpt-3.5-turbo-16k': {
        prompt: 3.00,
        completion: 4.00
      }
    };
    
    this.defaultModel = config.model || 'gpt-4-turbo-preview';
  }

  /**
   * Generate text completion
   */
  async complete(params) {
    const {
      prompt,
      systemPrompt = 'You are an expert software engineer.',
      maxTokens = 4096,
      temperature = 0.7,
      messages = [],
      model = this.defaultModel
    } = params;

    const messagesList = messages.length > 0 ? messages : [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messagesList,
        max_tokens: maxTokens,
        temperature
      });

      const text = response.choices[0].message.content;
      const promptTokens = response.usage.prompt_tokens;
      const completionTokens = response.usage.completion_tokens;
      const cost = this.calculateCost(promptTokens, completionTokens, model);

      this.tokensUsed += promptTokens + completionTokens;
      this.totalCost += cost;

      return {
        text,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        cost,
        model,
        finishReason: response.choices[0].finish_reason
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Stream text completion
   */
  async streamComplete(params, onChunk) {
    const {
      prompt,
      systemPrompt = 'You are an expert software engineer.',
      maxTokens = 4096,
      temperature = 0.7,
      messages = [],
      model = this.defaultModel
    } = params;

    const messagesList = messages.length > 0 ? messages : [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    let fullText = '';

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messagesList,
        max_tokens: maxTokens,
        temperature,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }

      // Estimate tokens (OpenAI doesn't provide usage in stream mode)
      const estimatedPromptTokens = this.countTokens(messagesList.map(m => m.content).join(' '));
      const estimatedCompletionTokens = this.countTokens(fullText);
      const cost = this.calculateCost(estimatedPromptTokens, estimatedCompletionTokens, model);

      this.tokensUsed += estimatedPromptTokens + estimatedCompletionTokens;
      this.totalCost += cost;

      return {
        text: fullText,
        tokensUsed: estimatedPromptTokens + estimatedCompletionTokens,
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        cost,
        model,
        estimated: true
      };
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error(`OpenAI streaming error: ${error.message}`);
    }
  }

  /**
   * Calculate cost based on tokens and model
   */
  calculateCost(promptTokens, completionTokens, model = this.defaultModel) {
    const pricing = this.pricing[model];
    if (!pricing) {
      console.warn(`Unknown model pricing: ${model}, using default`);
      return 0;
    }

    const promptCost = (promptTokens / 1000000) * pricing.prompt;
    const completionCost = (completionTokens / 1000000) * pricing.completion;

    return promptCost + completionCost;
  }

  /**
   * Generate code completion (Copilot-style)
   */
  async generateCodeCompletion(params) {
    const {
      code,
      language,
      context = '',
      maxTokens = 500
    } = params;

    const prompt = `Complete the following ${language} code:

Context:
${context}

Code to complete:
${code}

Continue the code naturally. Only output the completion, no explanations.`;

    return this.complete({
      prompt,
      systemPrompt: 'You are an expert programmer. Complete the code concisely.',
      maxTokens,
      temperature: 0.3
    });
  }
}

module.exports = OpenAIProvider;
