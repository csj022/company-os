/**
 * AI Coding Routes
 * API endpoints for AI-powered code generation, review, and management
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { getInstance: getLLM } = require('../services/llm/manager');
const CodeAgent = require('../services/ai-agent/code-agent');
const ApprovalClassifier = require('../services/ai-agent/approval-classifier');
const GitHubExecutor = require('../services/ai-agent/github-executor');
const { getInstance: getAuditLog } = require('../services/ai-agent/audit-log');
const logger = require('../utils/logger');

// Middleware to check validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/ai/generate-feature
 * Generate a new feature from description
 */
router.post('/generate-feature',
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('language').optional().isString(),
    body('filePath').optional().isString(),
    body('context').optional().isString(),
    body('autoApply').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    const { description, language = 'javascript', filePath, context = '', autoApply = false } = req.body;
    const taskId = `task_${Date.now()}`;

    try {
      const agent = new CodeAgent();
      
      // Set task context
      agent.addContext('task', {
        type: 'generate',
        description,
        language,
        filePath,
        context
      });

      // Execute reasoning workflow
      const result = await agent.reason({
        type: 'generate',
        description,
        language,
        filePath,
        context
      });

      // Classify for approval
      const classifier = new ApprovalClassifier();
      const classification = classifier.classify({
        type: 'generate',
        code: result.implementation.code,
        filePath,
        securityIssues: result.testResults.security.issues,
        testResults: result.testResults,
        description
      });

      // Log to audit
      const auditLog = await getAuditLog();
      await auditLog.logCodeGeneration({
        taskId,
        agentName: 'CodeAgent',
        input: { description, language, filePath },
        output: result.implementation,
        cost: result.implementation.cost,
        approved: classification.autoApproved
      });

      // Auto-apply if approved and requested
      let applicationResult = null;
      if (classification.autoApproved && autoApply && filePath) {
        const executor = new GitHubExecutor({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO
        });

        applicationResult = await executor.executeCodeChange({
          changes: [{
            path: filePath,
            content: result.implementation.code,
            description
          }],
          description,
          type: 'generate',
          autoMerge: true
        });

        await auditLog.logCommit({
          taskId,
          agentName: 'CodeAgent',
          branch: applicationResult.branch,
          files: [filePath],
          commitSha: applicationResult.commits[0]?.commit,
          prNumber: applicationResult.pullRequest?.number
        });
      }

      res.json({
        taskId,
        success: true,
        code: result.implementation.code,
        language,
        classification,
        steps: result.steps,
        testResults: result.testResults,
        cost: result.implementation.cost,
        application: applicationResult
      });
    } catch (error) {
      logger.error('Generate feature error:', error);
      
      const auditLog = await getAuditLog();
      await auditLog.logError({
        taskId,
        agentName: 'CodeAgent',
        error,
        context: { description, language, filePath }
      });

      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/ai/fix-bug
 * Fix a bug in existing code
 */
router.post('/fix-bug',
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('issue').notEmpty().withMessage('Issue description is required'),
    body('language').optional().isString(),
    body('filePath').optional().isString(),
    body('autoApply').optional().isBoolean()
  ],
  validateRequest,
  async (req, res) => {
    const { code, issue, language = 'javascript', filePath, autoApply = false } = req.body;
    const taskId = `task_${Date.now()}`;

    try {
      const agent = new CodeAgent();
      
      agent.addContext('task', {
        type: 'fix',
        code,
        description: issue,
        language,
        filePath
      });

      const result = await agent.reason({
        type: 'fix',
        code,
        description: issue,
        language,
        filePath
      });

      const classifier = new ApprovalClassifier();
      const classification = classifier.classify({
        type: 'fix',
        code: result.implementation.code,
        filePath,
        securityIssues: result.testResults.security.issues,
        testResults: result.testResults,
        description: issue
      });

      const auditLog = await getAuditLog();
      await auditLog.logCodeGeneration({
        taskId,
        agentName: 'CodeAgent',
        input: { description: issue, language, filePath },
        output: result.implementation,
        cost: result.implementation.cost,
        approved: classification.autoApproved
      });

      // Auto-apply if approved
      let applicationResult = null;
      if (classification.autoApproved && autoApply && filePath) {
        const executor = new GitHubExecutor({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO
        });

        applicationResult = await executor.executeCodeChange({
          changes: [{
            path: filePath,
            content: result.implementation.code,
            description: `Fix: ${issue}`
          }],
          description: `Fix: ${issue}`,
          type: 'fix',
          autoMerge: true
        });
      }

      res.json({
        taskId,
        success: true,
        fixedCode: result.implementation.code,
        explanation: result.implementation.explanation,
        originalCode: code,
        classification,
        steps: result.steps,
        testResults: result.testResults,
        cost: result.implementation.cost,
        application: applicationResult
      });
    } catch (error) {
      logger.error('Fix bug error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/ai/refactor
 * Refactor existing code
 */
router.post('/refactor',
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('goal').optional().isString(),
    body('language').optional().isString(),
    body('filePath').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    const { code, goal = 'improve readability and maintainability', language = 'javascript', filePath } = req.body;
    const taskId = `task_${Date.now()}`;

    try {
      const agent = new CodeAgent();
      
      agent.addContext('task', {
        type: 'refactor',
        code,
        goal,
        language,
        filePath
      });

      const result = await agent.reason({
        type: 'refactor',
        code,
        goal,
        language,
        filePath
      });

      const classifier = new ApprovalClassifier();
      const classification = classifier.classify({
        type: 'refactor',
        code: result.implementation.code,
        filePath,
        securityIssues: result.testResults.security.issues,
        testResults: result.testResults,
        description: goal
      });

      const auditLog = await getAuditLog();
      await auditLog.logCodeGeneration({
        taskId,
        agentName: 'CodeAgent',
        input: { description: goal, language, filePath },
        output: result.implementation,
        cost: result.implementation.cost,
        approved: classification.autoApproved
      });

      res.json({
        taskId,
        success: true,
        refactoredCode: result.implementation.code,
        changes: result.implementation.changes,
        originalCode: code,
        classification,
        steps: result.steps,
        testResults: result.testResults,
        cost: result.implementation.cost
      });
    } catch (error) {
      logger.error('Refactor error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/ai/add-tests
 * Generate tests for existing code
 */
router.post('/add-tests',
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('framework').optional().isString(),
    body('coverage').optional().isString(),
    body('language').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    const { code, framework = 'jest', coverage = 'comprehensive', language = 'javascript' } = req.body;
    const taskId = `task_${Date.now()}`;

    try {
      const agent = new CodeAgent();
      
      agent.addContext('task', {
        type: 'test',
        code,
        testFramework: framework,
        coverage,
        language
      });

      const result = await agent.reason({
        type: 'test',
        code,
        testFramework: framework,
        coverage,
        language
      });

      const classifier = new ApprovalClassifier();
      const classification = classifier.classify({
        type: 'test',
        code: result.implementation.testCode,
        securityIssues: [],
        testResults: result.testResults,
        description: 'Test generation'
      });

      const auditLog = await getAuditLog();
      await auditLog.logCodeGeneration({
        taskId,
        agentName: 'CodeAgent',
        input: { description: 'Generate tests', language, framework },
        output: result.implementation,
        cost: result.implementation.cost,
        approved: classification.autoApproved
      });

      res.json({
        taskId,
        success: true,
        testCode: result.implementation.testCode,
        framework,
        classification,
        steps: result.steps,
        cost: result.implementation.cost
      });
    } catch (error) {
      logger.error('Add tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/ai/review-pr
 * Review a pull request
 */
router.post('/review-pr',
  [
    body('prNumber').isInt().withMessage('PR number is required'),
    body('checkFor').optional().isArray()
  ],
  validateRequest,
  async (req, res) => {
    const { prNumber, checkFor = ['bugs', 'security', 'performance', 'style'] } = req.body;
    const taskId = `task_${Date.now()}`;

    try {
      // Get PR details from GitHub
      const executor = new GitHubExecutor({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO
      });

      const pr = await executor.getPullRequest({ number: prNumber });
      
      // For demo, we'll review the PR description
      // In production, you'd fetch the actual code changes
      const llm = getLLM();
      const reviewResult = await llm.reviewCode({
        code: pr.body || 'No code provided',
        language: 'javascript',
        context: `PR #${prNumber}: ${pr.title}`,
        checkFor
      });

      const auditLog = await getAuditLog();
      await auditLog.logCodeReview({
        taskId,
        agentName: 'CodeAgent',
        filePath: `PR #${prNumber}`,
        review: reviewResult.review,
        cost: reviewResult.cost
      });

      // Add review as comment to PR
      const commentBody = `## 🤖 AI Code Review

**Summary:** ${reviewResult.review.summary}

**Rating:** ${reviewResult.review.rating}/10

${reviewResult.review.issues.length > 0 ? `
### Issues Found
${reviewResult.review.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}
` : ''}

${reviewResult.review.suggestions.length > 0 ? `
### Suggestions
${reviewResult.review.suggestions.map((sug, i) => `${i + 1}. ${sug}`).join('\n')}
` : ''}

${reviewResult.review.securityConcerns.length > 0 ? `
### ⚠️ Security Concerns
${reviewResult.review.securityConcerns.map((concern, i) => `${i + 1}. ${concern}`).join('\n')}
` : ''}

---
*Automated review by AI Agent*
`;

      await executor.addPRComment({
        number: prNumber,
        body: commentBody
      });

      res.json({
        taskId,
        success: true,
        prNumber,
        review: reviewResult.review,
        cost: reviewResult.cost
      });
    } catch (error) {
      logger.error('Review PR error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/ai/pending-approvals
 * Get all pending approval tasks
 */
router.get('/pending-approvals',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    try {
      const auditLog = await getAuditLog();
      const allEntries = auditLog.getAll(1000);
      
      // Find tasks awaiting approval
      const pendingTasks = allEntries
        .filter(e => e.type === 'code_generation' && e.needsApproval && !e.approved)
        .slice(offset, offset + limit);

      res.json({
        success: true,
        count: pendingTasks.length,
        tasks: pendingTasks
      });
    } catch (error) {
      logger.error('Get pending approvals error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/ai/approve/:id
 * Approve a pending task
 */
router.post('/approve/:id',
  [
    param('id').notEmpty().withMessage('Task ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('comment').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    const { id } = req.params;
    const { userId, comment = '' } = req.body;

    try {
      const auditLog = await getAuditLog();
      
      await auditLog.logApproval({
        taskId: id,
        approved: true,
        approvedBy: userId,
        reason: comment || 'Approved by human reviewer'
      });

      res.json({
        success: true,
        taskId: id,
        approved: true,
        approvedBy: userId
      });
    } catch (error) {
      logger.error('Approve task error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/ai/reject/:id
 * Reject a pending task
 */
router.post('/reject/:id',
  [
    param('id').notEmpty().withMessage('Task ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  validateRequest,
  async (req, res) => {
    const { id } = req.params;
    const { userId, reason } = req.body;

    try {
      const auditLog = await getAuditLog();
      
      await auditLog.logApproval({
        taskId: id,
        approved: false,
        approvedBy: userId,
        reason
      });

      res.json({
        success: true,
        taskId: id,
        approved: false,
        rejectedBy: userId,
        reason
      });
    } catch (error) {
      logger.error('Reject task error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/ai/audit-log
 * Get audit log entries
 */
router.get('/audit-log',
  [
    query('type').optional().isString(),
    query('taskId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  validateRequest,
  async (req, res) => {
    const { type, taskId, startDate, endDate, limit = 100 } = req.query;

    try {
      const auditLog = await getAuditLog();
      
      let entries;
      if (taskId) {
        entries = auditLog.getByTaskId(taskId);
      } else if (startDate && endDate) {
        entries = auditLog.getByDateRange(startDate, endDate);
      } else if (type) {
        entries = auditLog.getByType(type, limit);
      } else {
        entries = auditLog.getAll(limit);
      }

      res.json({
        success: true,
        count: entries.length,
        entries
      });
    } catch (error) {
      logger.error('Get audit log error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/ai/stats
 * Get AI usage statistics
 */
router.get('/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
      const auditLog = await getAuditLog();
      const stats = auditLog.getStats(startDate, endDate);
      
      const llm = getLLM();
      const llmStats = llm.getUsageStats();

      res.json({
        success: true,
        period: { startDate, endDate },
        audit: stats,
        llm: llmStats
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
