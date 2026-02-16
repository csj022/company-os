/**
 * Anthropic Claude Provider
 * Handles code generation, review, and refactoring
 */

const Anthropic = require('@anthropic-ai/sdk');
const BaseLLMProvider = require('./base');

class AnthropicProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.name = 'anthropic';
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY
    });
    
    // Pricing per 1M tokens (as of Feb 2024)
    this.pricing = {
      'claude-3-5-sonnet-20241022': {
        prompt: 3.00,
        completion: 15.00
      },
      'claude-3-opus-20240229': {
        prompt: 15.00,
        completion: 75.00
      },
      'claude-3-sonnet-20240229': {
        prompt: 3.00,
        completion: 15.00
      },
      'claude-3-haiku-20240307': {
        prompt: 0.25,
        completion: 1.25
      }
    };
    
    this.defaultModel = config.model || 'claude-3-5-sonnet-20241022';
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
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: messagesList
      });

      const text = response.content[0].text;
      const promptTokens = response.usage.input_tokens;
      const completionTokens = response.usage.output_tokens;
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
        stopReason: response.stop_reason
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
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
      { role: 'user', content: prompt }
    ];

    let fullText = '';
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const stream = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: messagesList,
        stream: true
      });

      for await (const event of stream) {
        if (event.type === 'message_start') {
          promptTokens = event.message.usage.input_tokens;
        } else if (event.type === 'content_block_delta') {
          const chunk = event.delta.text;
          fullText += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        } else if (event.type === 'message_delta') {
          completionTokens = event.usage.output_tokens;
        }
      }

      const cost = this.calculateCost(promptTokens, completionTokens, model);
      this.tokensUsed += promptTokens + completionTokens;
      this.totalCost += cost;

      return {
        text: fullText,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        cost,
        model
      };
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      throw new Error(`Anthropic streaming error: ${error.message}`);
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
   * Count tokens using Claude's tokenizer
   */
  async countTokens(text) {
    try {
      const response = await this.client.messages.countTokens({
        model: this.defaultModel,
        messages: [{ role: 'user', content: text }]
      });
      return response.input_tokens;
    } catch (error) {
      // Fallback to rough estimate
      return super.countTokens(text);
    }
  }
}

module.exports = AnthropicProvider;
