/**
 * LLM Manager
 * Unified interface for all LLM providers with rate limiting and cost tracking
 */

const AnthropicProvider = require('./anthropic');
const OpenAIProvider = require('./openai');
const OllamaProvider = require('./ollama');
const { RateLimiter } = require('../../utils/rateLimiter');

class LLMManager {
  constructor(config = {}) {
    this.providers = {};
    this.defaultProvider = config.defaultProvider || 'anthropic';
    
    // Initialize providers
    if (config.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY) {
      this.providers.anthropic = new AnthropicProvider(config.anthropic || {});
    }
    
    if (config.openai?.apiKey || process.env.OPENAI_API_KEY) {
      this.providers.openai = new OpenAIProvider(config.openai || {});
    }
    
    if (config.ollama?.enabled) {
      this.providers.ollama = new OllamaProvider(config.ollama || {});
    }

    // Rate limiting: 100 requests per minute per provider
    this.rateLimiter = new RateLimiter({
      maxRequests: config.maxRequests || 100,
      windowMs: 60000 // 1 minute
    });

    // Cost tracking
    this.totalCost = 0;
    this.costByProvider = {};
    this.requestCount = 0;
  }

  /**
   * Get a provider by name
   */
  getProvider(name = this.defaultProvider) {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`Provider ${name} is not configured`);
    }
    return provider;
  }

  /**
   * Complete with automatic provider selection
   */
  async complete(params) {
    const provider = params.provider || this.defaultProvider;
    
    // Check rate limit
    await this.rateLimiter.checkLimit(`llm:${provider}`);

    const llm = this.getProvider(provider);
    const result = await llm.complete(params);

    // Track usage
    this.requestCount++;
    this.totalCost += result.cost;
    this.costByProvider[provider] = (this.costByProvider[provider] || 0) + result.cost;

    return {
      ...result,
      provider
    };
  }

  /**
   * Stream completion
   */
  async streamComplete(params, onChunk) {
    const provider = params.provider || this.defaultProvider;
    
    // Check rate limit
    await this.rateLimiter.checkLimit(`llm:${provider}`);

    const llm = this.getProvider(provider);
    const result = await llm.streamComplete(params, onChunk);

    // Track usage
    this.requestCount++;
    this.totalCost += result.cost;
    this.costByProvider[provider] = (this.costByProvider[provider] || 0) + result.cost;

    return {
      ...result,
      provider
    };
  }

  /**
   * Generate code with best provider
   */
  async generateCode(params) {
    const {
      description,
      language,
      context = '',
      style = 'clean',
      provider = 'anthropic' // Claude is better for code generation
    } = params;

    const systemPrompt = `You are an expert ${language} developer. Generate clean, production-ready code following best practices.`;
    
    const prompt = `Generate ${language} code based on this description:

Description: ${description}

Context:
${context}

Requirements:
- Follow ${style} code style
- Include comments for complex logic
- Handle edge cases
- Use modern ${language} features
- Make it production-ready

Output only the code, no explanations.`;

    return this.complete({
      provider,
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 4096
    });
  }

  /**
   * Review code
   */
  async reviewCode(params) {
    const {
      code,
      language,
      context = '',
      checkFor = ['bugs', 'security', 'performance', 'style'],
      provider = 'anthropic'
    } = params;

    const systemPrompt = 'You are a senior code reviewer. Provide constructive, actionable feedback.';
    
    const prompt = `Review this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Context:
${context}

Check for:
${checkFor.map(c => `- ${c}`).join('\n')}

Provide:
1. Summary (1-2 sentences)
2. Issues found (if any)
3. Suggestions for improvement
4. Security concerns (if any)
5. Overall rating (1-10)

Format as JSON:
{
  "summary": "...",
  "issues": [...],
  "suggestions": [...],
  "securityConcerns": [...],
  "rating": 8
}`;

    const result = await this.complete({
      provider,
      prompt,
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2048
    });

    try {
      const review = JSON.parse(result.text);
      return {
        ...result,
        review
      };
    } catch (error) {
      // If JSON parsing fails, return raw text
      return {
        ...result,
        review: {
          summary: result.text,
          issues: [],
          suggestions: [],
          securityConcerns: [],
          rating: 0
        }
      };
    }
  }

  /**
   * Refactor code
   */
  async refactorCode(params) {
    const {
      code,
      language,
      goal = 'improve readability and maintainability',
      provider = 'anthropic'
    } = params;

    const systemPrompt = 'You are an expert at code refactoring. Improve code quality while maintaining functionality.';
    
    const prompt = `Refactor this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Goal: ${goal}

Rules:
- Maintain exact same functionality
- Improve code structure
- Add helpful comments
- Use better variable names
- Extract reusable functions
- Follow ${language} best practices

Output:
1. Refactored code
2. Explanation of changes

Format as JSON:
{
  "refactoredCode": "...",
  "changes": ["...", "..."]
}`;

    const result = await this.complete({
      provider,
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 4096
    });

    try {
      const refactoring = JSON.parse(result.text);
      return {
        ...result,
        refactoring
      };
    } catch (error) {
      return {
        ...result,
        refactoring: {
          refactoredCode: result.text,
          changes: []
        }
      };
    }
  }

  /**
   * Generate tests
   */
  async generateTests(params) {
    const {
      code,
      language,
      framework = 'jest',
      coverage = 'comprehensive',
      provider = 'anthropic'
    } = params;

    const systemPrompt = `You are an expert at writing ${framework} tests. Generate comprehensive test suites.`;
    
    const prompt = `Generate ${framework} tests for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Requirements:
- ${coverage} coverage
- Test happy paths
- Test edge cases
- Test error handling
- Use clear test descriptions
- Follow ${framework} best practices

Output only the test code.`;

    return this.complete({
      provider,
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 4096
    });
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const providerStats = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      providerStats[name] = provider.getUsageStats();
    }

    return {
      totalCost: this.totalCost,
      costByProvider: this.costByProvider,
      requestCount: this.requestCount,
      providers: providerStats
    };
  }

  /**
   * Reset all usage statistics
   */
  resetUsageStats() {
    this.totalCost = 0;
    this.costByProvider = {};
    this.requestCount = 0;
    
    for (const provider of Object.values(this.providers)) {
      provider.resetUsageStats();
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Check if a provider is available
   */
  hasProvider(name) {
    return !!this.providers[name];
  }
}

// Singleton instance
let instance = null;

module.exports = {
  LLMManager,
  getInstance: (config) => {
    if (!instance) {
      instance = new LLMManager(config);
    }
    return instance;
  }
};
