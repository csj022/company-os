/**
 * Ollama Provider
 * Handles local model inference for privacy-sensitive operations
 */

const axios = require('axios');
const BaseLLMProvider = require('./base');

class OllamaProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.name = 'ollama';
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = config.model || 'codellama';
    
    // Local models have no API cost
    this.pricing = {
      'codellama': { prompt: 0, completion: 0 },
      'llama2': { prompt: 0, completion: 0 },
      'mistral': { prompt: 0, completion: 0 },
      'deepseek-coder': { prompt: 0, completion: 0 }
    };
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
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

    const fullPrompt = messages.length > 0 
      ? this._formatMessages(messages, systemPrompt)
      : `${systemPrompt}\n\n${prompt}`;

    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens
        }
      });

      const text = response.data.response;
      const tokensUsed = this.countTokens(fullPrompt) + this.countTokens(text);

      this.tokensUsed += tokensUsed;

      return {
        text,
        tokensUsed,
        promptTokens: this.countTokens(fullPrompt),
        completionTokens: this.countTokens(text),
        cost: 0, // Local models are free
        model
      };
    } catch (error) {
      console.error('Ollama API error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Start it with: ollama serve');
      }
      
      throw new Error(`Ollama API error: ${error.message}`);
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

    const fullPrompt = messages.length > 0 
      ? this._formatMessages(messages, systemPrompt)
      : `${systemPrompt}\n\n${prompt}`;

    let fullText = '';

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model,
          prompt: fullPrompt,
          stream: true,
          options: {
            temperature,
            num_predict: maxTokens
          }
        },
        {
          responseType: 'stream'
        }
      );

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          try {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              const data = JSON.parse(line);
              if (data.response) {
                fullText += data.response;
                if (onChunk) {
                  onChunk(data.response);
                }
              }
              
              if (data.done) {
                const tokensUsed = this.countTokens(fullPrompt) + this.countTokens(fullText);
                this.tokensUsed += tokensUsed;
                
                resolve({
                  text: fullText,
                  tokensUsed,
                  promptTokens: this.countTokens(fullPrompt),
                  completionTokens: this.countTokens(fullText),
                  cost: 0,
                  model
                });
              }
            }
          } catch (parseError) {
            console.error('Error parsing Ollama stream:', parseError);
          }
        });

        response.data.on('error', (error) => {
          reject(new Error(`Ollama stream error: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('Ollama streaming error:', error);
      throw new Error(`Ollama streaming error: ${error.message}`);
    }
  }

  /**
   * Calculate cost (always 0 for local models)
   */
  calculateCost(promptTokens, completionTokens, model = this.defaultModel) {
    return 0;
  }

  /**
   * Format messages for Ollama
   */
  _formatMessages(messages, systemPrompt) {
    let formatted = `${systemPrompt}\n\n`;
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        formatted += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        formatted += `Assistant: ${msg.content}\n\n`;
      }
    }
    
    formatted += 'Assistant: ';
    return formatted;
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }

  /**
   * Pull a model
   */
  async pullModel(model) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/pull`, {
        name: model
      });
      return response.data;
    } catch (error) {
      console.error('Error pulling Ollama model:', error);
      throw new Error(`Failed to pull model ${model}: ${error.message}`);
    }
  }
}

module.exports = OllamaProvider;
