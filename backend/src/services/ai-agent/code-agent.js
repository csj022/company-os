/**
 * Code Agent
 * Specialized agent for code generation, review, and refactoring
 */

const BaseAgent = require('./base-agent');
const { readFile, writeFile, parseCode, runLinter, runFormatter } = require('./tools/file-tools');
const { runTests } = require('./tools/test-tools');
const { checkSecurity } = require('./tools/security-tools');

class CodeAgent extends BaseAgent {
  constructor(config = {}) {
    super({ ...config, name: 'CodeAgent' });
    
    // Register tools
    this.registerTool('readFile', readFile, 'Read a file from the filesystem');
    this.registerTool('writeFile', writeFile, 'Write content to a file');
    this.registerTool('parseCode', parseCode, 'Parse code to AST');
    this.registerTool('runLinter', runLinter, 'Run linter on code');
    this.registerTool('runFormatter', runFormatter, 'Format code');
    this.registerTool('runTests', runTests, 'Run test suite');
    this.registerTool('checkSecurity', checkSecurity, 'Check code for security issues');
  }

  /**
   * Step 1: Analyze the code task
   */
  async analyze(task) {
    const { type, description, filePath, code } = task;

    const prompt = `Analyze this coding task:

Type: ${type}
Description: ${description}
${filePath ? `File: ${filePath}` : ''}
${code ? `\nExisting code:\n\`\`\`\n${code}\n\`\`\`` : ''}

Provide analysis as JSON:
{
  "taskType": "generate|review|refactor|fix|test",
  "complexity": "low|medium|high",
  "estimatedLines": number,
  "language": "...",
  "requiredChanges": [...],
  "potentialIssues": [...],
  "dependencies": [...]
}`;

    const result = await this.llm.complete({
      provider: this.provider,
      prompt,
      systemPrompt: 'You are an expert software architect. Analyze tasks precisely.',
      temperature: 0.3,
      maxTokens: 1024
    });

    try {
      return JSON.parse(result.text);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        taskType: type || 'unknown',
        complexity: 'medium',
        estimatedLines: 100,
        language: 'javascript',
        requiredChanges: [description],
        potentialIssues: [],
        dependencies: []
      };
    }
  }

  /**
   * Step 2: Plan the implementation
   */
  async plan(analysis) {
    const prompt = `Create an implementation plan for this task:

Analysis:
${JSON.stringify(analysis, null, 2)}

Provide a detailed plan as JSON:
{
  "steps": [
    { "order": 1, "action": "...", "tool": "...", "rationale": "..." }
  ],
  "estimatedDuration": "...",
  "risks": [...],
  "rollbackStrategy": "..."
}`;

    const result = await this.llm.complete({
      provider: this.provider,
      prompt,
      systemPrompt: 'You are an expert at planning software implementations.',
      temperature: 0.3,
      maxTokens: 2048
    });

    try {
      return JSON.parse(result.text);
    } catch (error) {
      return {
        steps: [
          { order: 1, action: 'Implement changes', tool: 'writeFile', rationale: 'Execute task' }
        ],
        estimatedDuration: '10 minutes',
        risks: [],
        rollbackStrategy: 'Revert to previous version'
      };
    }
  }

  /**
   * Step 3: Implement the solution
   */
  async implement(plan) {
    const task = this.getContext('task');
    const { type, description, filePath, code } = task;

    let implementation = {};

    switch (type) {
      case 'generate':
        implementation = await this._generateCode(description, task);
        break;
      case 'review':
        implementation = await this._reviewCode(code, task);
        break;
      case 'refactor':
        implementation = await this._refactorCode(code, task);
        break;
      case 'fix':
        implementation = await this._fixCode(code, description, task);
        break;
      case 'test':
        implementation = await this._generateTests(code, task);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    return implementation;
  }

  /**
   * Step 4: Test the implementation
   */
  async test(implementation) {
    const results = {
      syntax: { passed: false, errors: [] },
      linter: { passed: false, warnings: [] },
      tests: { passed: false, results: [] },
      security: { passed: false, issues: [] }
    };

    try {
      // 1. Syntax check (parse code)
      if (implementation.code) {
        const parseResult = await this.executeTool('parseCode', {
          code: implementation.code,
          language: implementation.language || 'javascript'
        });
        results.syntax.passed = parseResult.success;
        if (!parseResult.success) {
          results.syntax.errors.push(parseResult.error);
        }
      }

      // 2. Linter check
      if (implementation.code) {
        const lintResult = await this.executeTool('runLinter', {
          code: implementation.code,
          language: implementation.language || 'javascript'
        });
        results.linter.passed = lintResult.success;
        results.linter.warnings = lintResult.result?.warnings || [];
      }

      // 3. Security check
      if (implementation.code) {
        const securityResult = await this.executeTool('checkSecurity', {
          code: implementation.code,
          language: implementation.language || 'javascript'
        });
        results.security.passed = securityResult.result?.passed || false;
        results.security.issues = securityResult.result?.issues || [];
      }

      // 4. Run tests (if test files exist)
      const task = this.getContext('task');
      if (task.runTests !== false) {
        const testResult = await this.executeTool('runTests', {
          filePath: task.filePath
        });
        results.tests.passed = testResult.success;
        results.tests.results = testResult.result || [];
      }

      return results;
    } catch (error) {
      logger.error('Test execution error:', error);
      return results;
    }
  }

  /**
   * Step 5: Validate the results
   */
  async validate(testResults) {
    const { syntax, linter, tests, security } = testResults;

    // Check if all tests passed
    const allPassed = syntax.passed && 
                     linter.passed && 
                     security.passed && 
                     (tests.passed || tests.results.length === 0);

    // Collect all issues
    const issues = [
      ...syntax.errors.map(e => ({ type: 'syntax', message: e })),
      ...linter.warnings.map(w => ({ type: 'linter', message: w })),
      ...security.issues.map(i => ({ type: 'security', message: i }))
    ];

    // Determine if changes need approval
    const implementation = this.getContext('implementation');
    const needsApproval = this._needsApproval(implementation, issues);

    return {
      passed: allPassed,
      needsApproval,
      issues,
      summary: {
        syntaxCheck: syntax.passed ? '✓' : '✗',
        linterCheck: linter.passed ? '✓' : '✗',
        securityCheck: security.passed ? '✓' : '✗',
        testsCheck: tests.passed ? '✓' : '⊘'
      }
    };
  }

  /**
   * Helper: Generate code
   */
  async _generateCode(description, task) {
    const result = await this.llm.generateCode({
      description,
      language: task.language || 'javascript',
      context: task.context || '',
      style: task.style || 'clean',
      provider: this.provider
    });

    return {
      code: result.text,
      language: task.language || 'javascript',
      tokensUsed: result.tokensUsed,
      cost: result.cost
    };
  }

  /**
   * Helper: Review code
   */
  async _reviewCode(code, task) {
    const result = await this.llm.reviewCode({
      code,
      language: task.language || 'javascript',
      context: task.context || '',
      checkFor: task.checkFor || ['bugs', 'security', 'performance', 'style'],
      provider: this.provider
    });

    return {
      review: result.review,
      originalCode: code,
      tokensUsed: result.tokensUsed,
      cost: result.cost
    };
  }

  /**
   * Helper: Refactor code
   */
  async _refactorCode(code, task) {
    const result = await this.llm.refactorCode({
      code,
      language: task.language || 'javascript',
      goal: task.goal || 'improve readability and maintainability',
      provider: this.provider
    });

    return {
      code: result.refactoring.refactoredCode,
      changes: result.refactoring.changes,
      originalCode: code,
      language: task.language || 'javascript',
      tokensUsed: result.tokensUsed,
      cost: result.cost
    };
  }

  /**
   * Helper: Fix code
   */
  async _fixCode(code, issue, task) {
    const prompt = `Fix this code issue:

Issue: ${issue}

Code:
\`\`\`${task.language || 'javascript'}
${code}
\`\`\`

Provide:
1. Fixed code
2. Explanation of the fix

Format as JSON:
{
  "fixedCode": "...",
  "explanation": "..."
}`;

    const result = await this.llm.complete({
      provider: this.provider,
      prompt,
      systemPrompt: 'You are an expert debugger. Fix issues precisely.',
      temperature: 0.3,
      maxTokens: 4096
    });

    try {
      const fix = JSON.parse(result.text);
      return {
        code: fix.fixedCode,
        explanation: fix.explanation,
        originalCode: code,
        issue,
        language: task.language || 'javascript',
        tokensUsed: result.tokensUsed,
        cost: result.cost
      };
    } catch (error) {
      return {
        code: result.text,
        explanation: 'Fix applied',
        originalCode: code,
        issue,
        language: task.language || 'javascript',
        tokensUsed: result.tokensUsed,
        cost: result.cost
      };
    }
  }

  /**
   * Helper: Generate tests
   */
  async _generateTests(code, task) {
    const result = await this.llm.generateTests({
      code,
      language: task.language || 'javascript',
      framework: task.testFramework || 'jest',
      coverage: task.coverage || 'comprehensive',
      provider: this.provider
    });

    return {
      testCode: result.text,
      originalCode: code,
      framework: task.testFramework || 'jest',
      language: task.language || 'javascript',
      tokensUsed: result.tokensUsed,
      cost: result.cost
    };
  }

  /**
   * Helper: Determine if changes need approval
   */
  _needsApproval(implementation, issues) {
    // Always need approval for security issues
    if (issues.some(i => i.type === 'security')) {
      return true;
    }

    // Check line count (>50 lines needs approval)
    const lineCount = (implementation.code || '').split('\n').length;
    if (lineCount > 50) {
      return true;
    }

    // Test additions are auto-approved
    const task = this.getContext('task');
    if (task.type === 'test') {
      return false;
    }

    // Bug fixes under 50 lines are auto-approved
    if (task.type === 'fix' && lineCount <= 50) {
      return false;
    }

    // Everything else needs approval
    return true;
  }
}

module.exports = CodeAgent;
