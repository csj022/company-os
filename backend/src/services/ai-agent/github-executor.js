/**
 * GitHub Executor
 * Handles GitHub file operations, branch management, and PR creation
 */

const { Octokit } = require('@octokit/rest');
const logger = require('../../utils/logger');

class GitHubExecutor {
  constructor(config = {}) {
    this.octokit = new Octokit({
      auth: config.token || process.env.GITHUB_TOKEN
    });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  /**
   * Read file from repository
   */
  async readFile({ path, branch = 'main' }) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch
      });

      if (data.type !== 'file') {
        throw new Error(`${path} is not a file`);
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      return {
        content,
        sha: data.sha,
        path: data.path,
        size: data.size
      };
    } catch (error) {
      logger.error('GitHub readFile error:', error);
      throw new Error(`Failed to read file ${path}: ${error.message}`);
    }
  }

  /**
   * Write file to repository
   */
  async writeFile({ path, content, message, branch = 'main', sha = null }) {
    try {
      const contentBase64 = Buffer.from(content).toString('base64');
      
      const params = {
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: contentBase64,
        branch
      };

      if (sha) {
        params.sha = sha; // Required for updating existing files
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
      
      return {
        path: data.content.path,
        sha: data.content.sha,
        commit: data.commit.sha
      };
    } catch (error) {
      logger.error('GitHub writeFile error:', error);
      throw new Error(`Failed to write file ${path}: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch({ branchName, fromBranch = 'main' }) {
    try {
      // Get the SHA of the commit we want to branch from
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${fromBranch}`
      });

      const sha = ref.object.sha;

      // Create new branch
      const { data } = await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha
      });

      return {
        branch: branchName,
        sha: data.object.sha,
        ref: data.ref
      };
    } catch (error) {
      if (error.status === 422) {
        // Branch already exists
        logger.warn(`Branch ${branchName} already exists`);
        return {
          branch: branchName,
          exists: true
        };
      }
      logger.error('GitHub createBranch error:', error);
      throw new Error(`Failed to create branch ${branchName}: ${error.message}`);
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch({ branchName }) {
    try {
      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`
      });

      return { deleted: true, branch: branchName };
    } catch (error) {
      logger.error('GitHub deleteBranch error:', error);
      throw new Error(`Failed to delete branch ${branchName}: ${error.message}`);
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest({ title, body, head, base = 'main', draft = false }) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        head,
        base,
        draft
      });

      return {
        number: data.number,
        url: data.html_url,
        id: data.id,
        state: data.state,
        head: data.head.ref,
        base: data.base.ref
      };
    } catch (error) {
      logger.error('GitHub createPullRequest error:', error);
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  /**
   * Update a pull request
   */
  async updatePullRequest({ number, title, body, state }) {
    try {
      const params = {
        owner: this.owner,
        repo: this.repo,
        pull_number: number
      };

      if (title) params.title = title;
      if (body) params.body = body;
      if (state) params.state = state;

      const { data } = await this.octokit.pulls.update(params);

      return {
        number: data.number,
        url: data.html_url,
        state: data.state
      };
    } catch (error) {
      logger.error('GitHub updatePullRequest error:', error);
      throw new Error(`Failed to update PR #${number}: ${error.message}`);
    }
  }

  /**
   * Add comment to pull request
   */
  async addPRComment({ number, body }) {
    try {
      const { data } = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: number,
        body
      });

      return {
        id: data.id,
        url: data.html_url
      };
    } catch (error) {
      logger.error('GitHub addPRComment error:', error);
      throw new Error(`Failed to add comment to PR #${number}: ${error.message}`);
    }
  }

  /**
   * Merge pull request
   */
  async mergePullRequest({ number, commitMessage, mergeMethod = 'merge' }) {
    try {
      const { data } = await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: number,
        commit_title: commitMessage,
        merge_method: mergeMethod // merge, squash, rebase
      });

      return {
        merged: data.merged,
        sha: data.sha,
        message: data.message
      };
    } catch (error) {
      logger.error('GitHub mergePullRequest error:', error);
      throw new Error(`Failed to merge PR #${number}: ${error.message}`);
    }
  }

  /**
   * Get pull request details
   */
  async getPullRequest({ number }) {
    try {
      const { data } = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: number
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state,
        merged: data.merged,
        mergeable: data.mergeable,
        head: data.head.ref,
        base: data.base.ref,
        url: data.html_url,
        author: data.user.login
      };
    } catch (error) {
      logger.error('GitHub getPullRequest error:', error);
      throw new Error(`Failed to get PR #${number}: ${error.message}`);
    }
  }

  /**
   * Generate smart commit message
   */
  generateCommitMessage({ type, description, files = [] }) {
    const types = {
      generate: 'feat',
      fix: 'fix',
      refactor: 'refactor',
      test: 'test',
      docs: 'docs',
      style: 'style',
      chore: 'chore'
    };

    const commitType = types[type] || 'chore';
    const fileList = files.length > 0 ? ` (${files.join(', ')})` : '';
    
    return `${commitType}: ${description}${fileList}

🤖 Generated by AI Agent
`;
  }

  /**
   * Generate PR description
   */
  generatePRDescription({ type, description, changes = [], rationale = '', risks = [] }) {
    const emoji = {
      generate: '✨',
      fix: '🐛',
      refactor: '♻️',
      test: '✅',
      docs: '📝',
      style: '💄'
    };

    const icon = emoji[type] || '🔧';

    let body = `${icon} **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${description}\n\n`;
    
    if (rationale) {
      body += `## Rationale\n${rationale}\n\n`;
    }

    if (changes.length > 0) {
      body += `## Changes\n${changes.map(c => `- ${c}`).join('\n')}\n\n`;
    }

    if (risks.length > 0) {
      body += `## Risks\n${risks.map(r => `- ⚠️ ${r}`).join('\n')}\n\n`;
    }

    body += `---\n🤖 This PR was generated by AI Agent\n`;
    body += `🔍 Review Status: **Pending Human Approval**\n`;

    return body;
  }

  /**
   * Generate branch name
   */
  generateBranchName({ type, description }) {
    const prefix = {
      generate: 'feature',
      fix: 'fix',
      refactor: 'refactor',
      test: 'test',
      docs: 'docs'
    }[type] || 'ai';

    // Create slug from description
    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const timestamp = Date.now().toString().slice(-6);

    return `${prefix}/${slug}-${timestamp}`;
  }

  /**
   * Execute full code change workflow
   */
  async executeCodeChange({ 
    changes, 
    description, 
    type, 
    autoMerge = false 
  }) {
    const results = {
      branch: null,
      commits: [],
      pullRequest: null,
      merged: false,
      errors: []
    };

    try {
      // 1. Generate branch name
      const branchName = this.generateBranchName({ type, description });
      logger.info(`Creating branch: ${branchName}`);

      // 2. Create branch
      const branch = await this.createBranch({ branchName });
      results.branch = branch.branch;

      // 3. Apply changes (write files)
      for (const change of changes) {
        try {
          const commitMessage = this.generateCommitMessage({
            type,
            description: change.description || description,
            files: [change.path]
          });

          // Get current file SHA if it exists
          let sha = null;
          try {
            const existing = await this.readFile({ 
              path: change.path, 
              branch: branchName 
            });
            sha = existing.sha;
          } catch (error) {
            // File doesn't exist, that's okay
          }

          const commit = await this.writeFile({
            path: change.path,
            content: change.content,
            message: commitMessage,
            branch: branchName,
            sha
          });

          results.commits.push(commit);
          logger.info(`Committed: ${change.path}`);
        } catch (error) {
          results.errors.push(`Failed to commit ${change.path}: ${error.message}`);
        }
      }

      // 4. Create pull request
      const prTitle = `[AI] ${description}`;
      const prBody = this.generatePRDescription({
        type,
        description,
        changes: changes.map(c => c.description || c.path),
        rationale: changes[0]?.rationale || 'AI-generated code change',
        risks: changes[0]?.risks || []
      });

      const pr = await this.createPullRequest({
        title: prTitle,
        body: prBody,
        head: branchName,
        base: 'main',
        draft: !autoMerge
      });

      results.pullRequest = pr;
      logger.info(`Created PR: ${pr.url}`);

      // 5. Auto-merge if approved
      if (autoMerge) {
        // Wait a bit for CI checks to start
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
          const merged = await this.mergePullRequest({
            number: pr.number,
            commitMessage: prTitle,
            mergeMethod: 'squash'
          });

          results.merged = merged.merged;
          logger.info(`Auto-merged PR #${pr.number}`);
        } catch (error) {
          results.errors.push(`Failed to auto-merge: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      logger.error('Execute code change error:', error);
      results.errors.push(error.message);
      return results;
    }
  }
}

module.exports = GitHubExecutor;
