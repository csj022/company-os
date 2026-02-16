/**
 * GitHub API Client Wrapper
 * Uses Octokit with rate limiting and retry logic
 */

const { Octokit } = require('@octokit/rest');
const { throttling } = require('@octokit/plugin-throttling');
const { graphql } = require('@octokit/graphql');

const OctokitWithPlugins = Octokit.plugin(throttling);

class GitHubClient {
  constructor(token) {
    this.token = token;
    
    // Initialize Octokit with throttling plugin
    this.octokit = new OctokitWithPlugins({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          console.warn(
            `Rate limit hit for ${options.method} ${options.url}. Retry count: ${retryCount}`
          );
          
          // Retry up to 3 times
          if (retryCount < 3) {
            console.log(`Retrying after ${retryAfter} seconds`);
            return true;
          }
          
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          console.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
          // Don't retry on secondary rate limits
          return false;
        }
      }
    });
    
    // Initialize GraphQL client
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`
      }
    });
  }
  
  /**
   * Make a request with error handling and rate limit awareness
   */
  async makeRequest(fn) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        await this.notifyRateLimitExceeded();
        throw new RateLimitError('GitHub API rate limit exceeded');
      }
      
      if (error.status === 401) {
        throw new AuthenticationError('GitHub authentication failed - token may be invalid');
      }
      
      throw error;
    }
  }
  
  /**
   * Get current rate limit status
   */
  async getRateLimit() {
    const response = await this.octokit.rateLimit.get();
    return {
      core: {
        limit: response.data.resources.core.limit,
        remaining: response.data.resources.core.remaining,
        reset: new Date(response.data.resources.core.reset * 1000)
      },
      graphql: {
        limit: response.data.resources.graphql.limit,
        remaining: response.data.resources.graphql.remaining,
        reset: new Date(response.data.resources.graphql.reset * 1000)
      }
    };
  }
  
  /**
   * List repositories for authenticated user
   */
  async listRepositories(options = {}) {
    return this.makeRequest(() =>
      this.octokit.repos.listForAuthenticatedUser({
        affiliation: 'owner,organization_member',
        per_page: 100,
        ...options
      })
    );
  }
  
  /**
   * List repositories for organization
   */
  async listOrgRepositories(org, options = {}) {
    return this.makeRequest(() =>
      this.octokit.repos.listForOrg({
        org,
        per_page: 100,
        ...options
      })
    );
  }
  
  /**
   * Get pull requests for a repository
   */
  async listPullRequests(owner, repo, state = 'open') {
    return this.makeRequest(() =>
      this.octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: 100
      })
    );
  }
  
  /**
   * Get pull request details
   */
  async getPullRequest(owner, repo, pullNumber) {
    return this.makeRequest(() =>
      this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber
      })
    );
  }
  
  /**
   * Get pull request files
   */
  async getPullRequestFiles(owner, repo, pullNumber) {
    return this.makeRequest(() =>
      this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber
      })
    );
  }
  
  /**
   * Get pull request reviews
   */
  async getPullRequestReviews(owner, repo, pullNumber) {
    return this.makeRequest(() =>
      this.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: pullNumber
      })
    );
  }
  
  /**
   * Create pull request review
   */
  async createPullRequestReview(owner, repo, pullNumber, body, event = 'COMMENT') {
    return this.makeRequest(() =>
      this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        body,
        event
      })
    );
  }
  
  /**
   * List commits for a repository
   */
  async listCommits(owner, repo, options = {}) {
    return this.makeRequest(() =>
      this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 100,
        ...options
      })
    );
  }
  
  /**
   * Get commit details
   */
  async getCommit(owner, repo, ref) {
    return this.makeRequest(() =>
      this.octokit.repos.getCommit({
        owner,
        repo,
        ref
      })
    );
  }
  
  /**
   * Create webhook for repository
   */
  async createWebhook(owner, repo, webhookUrl, secret) {
    return this.makeRequest(() =>
      this.octokit.repos.createWebhook({
        owner,
        repo,
        name: 'web',
        active: true,
        events: [
          'pull_request',
          'pull_request_review',
          'push',
          'issues',
          'issue_comment',
          'deployment',
          'deployment_status',
          'release'
        ],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret,
          insecure_ssl: '0'
        }
      })
    );
  }
  
  /**
   * List webhooks for repository
   */
  async listWebhooks(owner, repo) {
    return this.makeRequest(() =>
      this.octokit.repos.listWebhooks({
        owner,
        repo
      })
    );
  }
  
  /**
   * Delete webhook
   */
  async deleteWebhook(owner, repo, hookId) {
    return this.makeRequest(() =>
      this.octokit.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookId
      })
    );
  }
  
  /**
   * Get authenticated user
   */
  async getAuthenticatedUser() {
    return this.makeRequest(() =>
      this.octokit.users.getAuthenticated()
    );
  }
  
  /**
   * Execute GraphQL query
   */
  async query(queryString, variables = {}) {
    try {
      return await this.graphqlClient(queryString, variables);
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
  
  /**
   * Notify about rate limit exceeded (implement based on notification system)
   */
  async notifyRateLimitExceeded() {
    const rateLimit = await this.getRateLimit();
    console.error('GitHub API rate limit exceeded. Reset at:', rateLimit.core.reset);
    // TODO: Integrate with notification system
  }
}

// Custom error classes
class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Factory function to create a GitHub client
function createGitHubClient(token) {
  return new GitHubClient(token);
}

module.exports = {
  GitHubClient,
  RateLimitError,
  AuthenticationError,
  createGitHubClient
};
