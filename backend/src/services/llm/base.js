/**
 * Base LLM Provider Interface
 * All LLM providers must implement this interface
 */

class BaseLLMProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
    this.tokensUsed = 0;
    this.totalCost = 0;
  }

  /**
   * Generate text completion
   * @param {Object} params
   * @param {string} params.prompt - The prompt to send
   * @param {string} params.systemPrompt - System message
   * @param {number} params.maxTokens - Max tokens to generate
   * @param {number} params.temperature - Sampling temperature
   * @param {Array} params.messages - Chat messages array
   * @returns {Promise<Object>} { text, tokensUsed, cost }
   */
  async complete(params) {
    throw new Error('complete() must be implemented by provider');
  }

  /**
   * Stream text completion
   * @param {Object} params - Same as complete()
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<Object>} { text, tokensUsed, cost }
   */
  async streamComplete(params, onChunk) {
    throw new Error('streamComplete() must be implemented by provider');
  }

  /**
   * Count tokens in text
   * @param {string} text
   * @returns {number}
   */
  countTokens(text) {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on tokens
   * @param {number} promptTokens
   * @param {number} completionTokens
   * @returns {number} Cost in USD
   */
  calculateCost(promptTokens, completionTokens) {
    throw new Error('calculateCost() must be implemented by provider');
  }

  /**
   * Get usage statistics
   * @returns {Object}
   */
  getUsageStats() {
    return {
      provider: this.name,
      tokensUsed: this.tokensUsed,
      totalCost: this.totalCost
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats() {
    this.tokensUsed = 0;
    this.totalCost = 0;
  }
}

module.exports = BaseLLMProvider;
