/**
 * Base AI Agent
 * Foundation for all AI agents with multi-step reasoning
 */

const { getInstance: getLLM } = require('../llm/manager');
const logger = require('../../utils/logger');

class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'BaseAgent';
    this.llm = getLLM();
    this.tools = new Map();
    this.context = {};
    this.steps = [];
    this.provider = config.provider || 'anthropic';
  }

  /**
   * Register a tool for the agent to use
   */
  registerTool(name, handler, description) {
    this.tools.set(name, {
      name,
      handler,
      description
    });
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName, params) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    logger.info(`[${this.name}] Executing tool: ${toolName}`, { params });
    
    try {
      const result = await tool.handler(params);
      return { success: true, result };
    } catch (error) {
      logger.error(`[${this.name}] Tool execution failed: ${toolName}`, { error });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add context to the agent
   */
  addContext(key, value) {
    this.context[key] = value;
  }

  /**
   * Get context value
   */
  getContext(key) {
    return this.context[key];
  }

  /**
   * Clear all context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Log a step in the reasoning process
   */
  logStep(step, data = {}) {
    const stepData = {
      step,
      timestamp: new Date(),
      ...data
    };
    this.steps.push(stepData);
    logger.info(`[${this.name}] Step: ${step}`, data);
    return stepData;
  }

  /**
   * Get all reasoning steps
   */
  getSteps() {
    return this.steps;
  }

  /**
   * Clear reasoning steps
   */
  clearSteps() {
    this.steps = [];
  }

  /**
   * Multi-step reasoning: Analyze → Plan → Implement → Test
   * This is the core reasoning loop
   */
  async reason(task) {
    this.clearSteps();
    this.logStep('START', { task });

    try {
      // Step 1: Analyze
      const analysis = await this.analyze(task);
      this.logStep('ANALYZE', { analysis });

      // Step 2: Plan
      const plan = await this.plan(analysis);
      this.logStep('PLAN', { plan });

      // Step 3: Implement
      const implementation = await this.implement(plan);
      this.logStep('IMPLEMENT', { implementation });

      // Step 4: Test
      const testResults = await this.test(implementation);
      this.logStep('TEST', { testResults });

      // Step 5: Validate
      const validation = await this.validate(testResults);
      this.logStep('VALIDATE', { validation });

      this.logStep('COMPLETE', { validation });

      return {
        success: validation.passed,
        analysis,
        plan,
        implementation,
        testResults,
        validation,
        steps: this.getSteps()
      };
    } catch (error) {
      this.logStep('ERROR', { error: error.message });
      throw error;
    }
  }

  /**
   * Step 1: Analyze the task
   * Understand what needs to be done
   */
  async analyze(task) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Step 2: Plan the approach
   * Break down into actionable steps
   */
  async plan(analysis) {
    throw new Error('plan() must be implemented by subclass');
  }

  /**
   * Step 3: Implement the solution
   * Execute the plan
   */
  async implement(plan) {
    throw new Error('implement() must be implemented by subclass');
  }

  /**
   * Step 4: Test the implementation
   * Verify it works correctly
   */
  async test(implementation) {
    throw new Error('test() must be implemented by subclass');
  }

  /**
   * Step 5: Validate the results
   * Final safety check
   */
  async validate(testResults) {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Get agent summary
   */
  getSummary() {
    return {
      name: this.name,
      provider: this.provider,
      availableTools: Array.from(this.tools.keys()),
      contextKeys: Object.keys(this.context),
      stepCount: this.steps.length
    };
  }
}

module.exports = BaseAgent;
