const express = require('express');
const { param, query, body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validator');
const { createGitHubClient } = require('../../integrations/github/client');
const integrationService = require('../services/integration.service');
const { decrypt } = require('../utils/encryption');
const { query: dbQuery } = require('../config/database');

const router = express.Router();

/**
 * GET /api/github/repositories
 * Get all repositories for the organization
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Get GitHub integration
    const integration = await integrationService.get(req.user.organizationId, 'github');
    if (!integration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'GitHub integration not found. Please connect GitHub first.',
      });
    }

    // Get repositories from database
    const result = await dbQuery(
      `SELECT 
        r.id, r.github_id, r.name, r.full_name, r.default_branch, 
        r.visibility, r.metadata, r.last_sync_at, r.created_at
       FROM repositories r
       WHERE r.organization_id = $1
       ORDER BY r.metadata->>'updatedAt' DESC`,
      [req.user.organizationId]
    );

    res.json({ repositories: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repositories/:repoId
 * Get specific repository details
 */
router.get('/:repoId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM repositories WHERE id = $1 AND organization_id = $2`,
      [req.params.repoId, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Repository not found',
      });
    }

    res.json({ repository: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/github/repositories/:repoId/tree
 * Get file tree for repository
 */
router.get(
  '/:repoId/tree',
  authenticate,
  [query('branch').optional().isString()],
  validate,
  async (req, res, next) => {
    try {
      const integration = await integrationService.get(req.user.organizationId, 'github');
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'GitHub integration not found',
        });
      }

      const credentials = JSON.parse(decrypt(integration.credentials_encrypted));
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: credentials.accessToken });

      // Get repository details
      const repo = await dbQuery(
        `SELECT * FROM repositories WHERE id = $1 AND organization_id = $2`,
        [req.params.repoId, req.user.organizationId]
      );

      if (repo.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Repository not found',
        });
      }

      const [owner, name] = repo.rows[0].full_name.split('/');
      const branch = req.query.branch || repo.rows[0].default_branch;

      // Get tree
      const { data } = await octokit.git.getTree({
        owner,
        repo: name,
        tree_sha: branch,
        recursive: '1',
      });

      // Format tree structure
      const tree = data.tree.map((item) => ({
        path: item.path,
        type: item.type === 'blob' ? 'file' : 'directory',
        sha: item.sha,
      }));

      res.json({ tree });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/github/repositories/:repoId/contents/:path
 * Get file contents
 */
router.get('/:repoId/contents/*', authenticate, async (req, res, next) => {
  try {
    const integration = await integrationService.get(req.user.organizationId, 'github');
    if (!integration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'GitHub integration not found',
      });
    }

    const credentials = JSON.parse(decrypt(integration.credentials_encrypted));
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({ auth: credentials.accessToken });

    // Get repository details
    const repo = await dbQuery(
      `SELECT * FROM repositories WHERE id = $1 AND organization_id = $2`,
      [req.params.repoId, req.user.organizationId]
    );

    if (repo.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Repository not found',
      });
    }

    const [owner, name] = repo.rows[0].full_name.split('/');
    const path = req.params[0];
    const branch = req.query.branch || repo.rows[0].default_branch;

    // Get file contents
    const { data } = await octokit.repos.getContent({
      owner,
      repo: name,
      path,
      ref: branch,
    });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    res.json({
      content,
      sha: data.sha,
      path: data.path,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/github/repositories/:repoId/contents/:path
 * Update file contents
 */
router.put(
  '/:repoId/contents/*',
  authenticate,
  authorize('owner', 'admin', 'member'),
  [
    body('content').isString(),
    body('message').isString(),
    body('branch').optional().isString(),
    body('sha').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const integration = await integrationService.get(req.user.organizationId, 'github');
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'GitHub integration not found',
        });
      }

      const credentials = JSON.parse(decrypt(integration.credentials_encrypted));
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: credentials.accessToken });

      // Get repository details
      const repo = await dbQuery(
        `SELECT * FROM repositories WHERE id = $1 AND organization_id = $2`,
        [req.params.repoId, req.user.organizationId]
      );

      if (repo.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Repository not found',
        });
      }

      const [owner, name] = repo.rows[0].full_name.split('/');
      const path = req.params[0];
      const branch = req.body.branch || repo.rows[0].default_branch;

      // Get current file SHA if not provided
      let sha = req.body.sha;
      if (!sha) {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo: name,
            path,
            ref: branch,
          });
          sha = data.sha;
        } catch (error) {
          // File doesn't exist, will create new file
        }
      }

      // Update file
      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo: name,
        path,
        message: req.body.message,
        content: Buffer.from(req.body.content).toString('base64'),
        branch,
        sha,
      });

      res.json({
        success: true,
        commit: data.commit,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/github/pull-requests
 * Get pull requests
 */
router.get(
  '/pull-requests',
  authenticate,
  [query('state').optional().isIn(['open', 'closed', 'merged', 'all'])],
  validate,
  async (req, res, next) => {
    try {
      const state = req.query.state || 'open';
      let whereClause = 'pr.organization_id = $1';
      const params = [req.user.organizationId];

      if (state !== 'all') {
        whereClause += ' AND pr.state = $2';
        params.push(state);
      }

      const result = await dbQuery(
        `SELECT 
          pr.id, pr.github_id, pr.number, pr.title, pr.body, pr.state,
          pr.author_github_id, pr.base_branch, pr.head_branch, pr.draft,
          pr.mergeable, pr.review_status, pr.agent_review_status,
          pr.metadata, pr.opened_at, pr.closed_at, pr.merged_at,
          pr.created_at, pr.updated_at,
          r.name as repository_name, r.full_name as repository_full_name
         FROM pull_requests pr
         JOIN repositories r ON pr.repository_id = r.id
         WHERE ${whereClause}
         ORDER BY pr.updated_at DESC
         LIMIT 50`,
        params
      );

      res.json({ pullRequests: result.rows });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/github/pull-requests/:prId/merge
 * Merge a pull request
 */
router.post(
  '/pull-requests/:prId/merge',
  authenticate,
  authorize('owner', 'admin', 'member'),
  async (req, res, next) => {
    try {
      const integration = await integrationService.get(req.user.organizationId, 'github');
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'GitHub integration not found',
        });
      }

      const credentials = JSON.parse(decrypt(integration.credentials_encrypted));
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: credentials.accessToken });

      // Get PR details
      const pr = await dbQuery(
        `SELECT pr.*, r.full_name 
         FROM pull_requests pr
         JOIN repositories r ON pr.repository_id = r.id
         WHERE pr.id = $1`,
        [req.params.prId]
      );

      if (pr.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Pull request not found',
        });
      }

      const [owner, name] = pr.rows[0].full_name.split('/');

      // Merge PR
      const { data } = await octokit.pulls.merge({
        owner,
        repo: name,
        pull_number: pr.rows[0].number,
        merge_method: 'squash', // or 'merge', 'rebase'
      });

      // Update PR in database
      await dbQuery(
        `UPDATE pull_requests
         SET state = 'merged', merged_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [req.params.prId]
      );

      res.json({
        success: true,
        merged: data.merged,
        sha: data.sha,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/github/pull-requests/:prId/request-review
 * Request AI review for pull request
 */
router.post(
  '/pull-requests/:prId/request-review',
  authenticate,
  authorize('owner', 'admin', 'member'),
  async (req, res, next) => {
    try {
      // Update agent review status
      await dbQuery(
        `UPDATE pull_requests
         SET agent_review_status = 'in_progress', updated_at = NOW()
         WHERE id = $1`,
        [req.params.prId]
      );

      // TODO: Trigger AI code review agent
      // This would spawn a CodeReviewAgent with the PR details

      res.json({
        success: true,
        message: 'AI review requested',
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
