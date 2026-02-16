/**
 * GitHub Repository Sync
 * Syncs repositories, pull requests, and commits from GitHub
 */

import { GitHubClient } from './client.js';
import { GET_PULL_REQUEST_DETAILS, GET_REPOSITORY_WITH_PRS } from './queries.js';
import { setupWebhook } from './webhooks.js';

/**
 * Sync all GitHub data for an organization
 */
export async function syncGitHubData(organizationId, { getIntegration, decrypt, upsertRepository, upsertPullRequest }) {
  console.log(`Starting GitHub sync for organization ${organizationId}`);
  
  const integration = await getIntegration(organizationId, 'github');
  
  if (!integration || integration.status !== 'active') {
    throw new Error('GitHub integration not found or inactive');
  }
  
  const accessToken = decrypt(integration.credentials);
  const client = new GitHubClient(accessToken);
  
  const syncStartTime = Date.now();
  const stats = {
    repositories: 0,
    pullRequests: 0,
    errors: []
  };
  
  try {
    // Fetch all repositories
    const repos = await client.listRepositories();
    
    console.log(`Found ${repos.data.length} repositories`);
    
    for (const repo of repos.data) {
      try {
        // Store repository
        await upsertRepository({
          organizationId,
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          defaultBranch: repo.default_branch,
          visibility: repo.private ? 'private' : 'public',
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          metadata: {
            hasIssues: repo.has_issues,
            hasProjects: repo.has_projects,
            hasWiki: repo.has_wiki,
            archived: repo.archived,
            disabled: repo.disabled
          }
        });
        
        stats.repositories++;
        
        // Sync pull requests for this repository
        const prCount = await syncPullRequests(
          client,
          repo.owner.login,
          repo.name,
          organizationId,
          { upsertPullRequest }
        );
        
        stats.pullRequests += prCount;
        
        // Setup webhook for this repository
        await setupWebhookForRepository(client, repo.owner.login, repo.name);
        
      } catch (error) {
        console.error(`Error syncing repository ${repo.full_name}:`, error.message);
        stats.errors.push({
          repository: repo.full_name,
          error: error.message
        });
      }
    }
    
    const syncDuration = Date.now() - syncStartTime;
    
    console.log(`GitHub sync completed in ${syncDuration}ms:`, stats);
    
    // Update integration with last sync time
    await updateIntegration(integration.id, { 
      lastSyncAt: new Date(),
      lastSyncStats: stats
    });
    
    return stats;
    
  } catch (error) {
    console.error('GitHub sync failed:', error);
    throw error;
  }
}

/**
 * Sync pull requests for a specific repository
 */
export async function syncPullRequests(client, owner, repo, organizationId, { upsertPullRequest }) {
  try {
    // Fetch open pull requests
    const openPRs = await client.listPullRequests(owner, repo, 'open');
    
    // Also fetch recently closed PRs (last 7 days)
    const closedPRs = await client.listPullRequests(owner, repo, 'closed');
    const recentlyClosed = closedPRs.data.filter(pr => {
      const closedAt = new Date(pr.closed_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return closedAt > weekAgo;
    });
    
    const allPRs = [...openPRs.data, ...recentlyClosed];
    
    console.log(`Syncing ${allPRs.length} pull requests for ${owner}/${repo}`);
    
    for (const pr of allPRs) {
      try {
        // Get detailed PR info via GraphQL
        const prDetails = await client.query(GET_PULL_REQUEST_DETAILS, {
          owner,
          name: repo,
          number: pr.number
        });
        
        const detailedPR = prDetails.repository.pullRequest;
        
        await upsertPullRequest({
          organizationId,
          githubId: pr.id,
          number: pr.number,
          repositoryFullName: `${owner}/${repo}`,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          author: pr.user.login,
          baseBranch: pr.base.ref,
          headBranch: pr.head.ref,
          url: pr.html_url,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
          draft: pr.draft,
          additions: detailedPR.additions,
          deletions: detailedPR.deletions,
          changedFiles: detailedPR.changedFiles,
          metadata: {
            labels: detailedPR.labels.nodes.map(l => l.name),
            assignees: detailedPR.assignees.nodes.map(a => a.login),
            reviewers: detailedPR.reviewRequests.nodes.map(r => r.requestedReviewer.login),
            reviews: detailedPR.reviews.nodes.map(r => ({
              author: r.author.login,
              state: r.state,
              submittedAt: r.submittedAt
            })),
            commits: detailedPR.commits.totalCount,
            mergeable: detailedPR.mergeable
          }
        });
        
      } catch (error) {
        console.error(`Error syncing PR #${pr.number}:`, error.message);
      }
    }
    
    return allPRs.length;
    
  } catch (error) {
    console.error(`Error syncing PRs for ${owner}/${repo}:`, error.message);
    return 0;
  }
}

/**
 * Sync commits for a repository
 */
export async function syncCommits(client, owner, repo, organizationId, { upsertCommit }, options = {}) {
  const { branch, since, limit = 100 } = options;
  
  try {
    const commits = await client.listCommits(owner, repo, {
      sha: branch,
      since,
      per_page: limit
    });
    
    console.log(`Syncing ${commits.data.length} commits for ${owner}/${repo}`);
    
    for (const commit of commits.data) {
      await upsertCommit({
        organizationId,
        githubId: commit.sha,
        sha: commit.sha,
        repositoryFullName: `${owner}/${repo}`,
        message: commit.commit.message,
        author: commit.commit.author.name,
        authorEmail: commit.commit.author.email,
        committer: commit.commit.committer.name,
        committerEmail: commit.commit.committer.email,
        timestamp: commit.commit.author.date,
        url: commit.html_url,
        metadata: {
          parents: commit.parents.map(p => p.sha),
          stats: commit.stats
        }
      });
    }
    
    return commits.data.length;
    
  } catch (error) {
    console.error(`Error syncing commits for ${owner}/${repo}:`, error.message);
    return 0;
  }
}

/**
 * Setup webhook for a repository
 */
async function setupWebhookForRepository(client, owner, repo) {
  const webhookUrl = process.env.GITHUB_WEBHOOK_URL || 'https://app.companyos.com/api/webhooks/github/receive';
  
  try {
    await setupWebhook(client, owner, repo, webhookUrl);
  } catch (error) {
    console.error(`Failed to setup webhook for ${owner}/${repo}:`, error.message);
    // Don't throw - webhook setup is optional
  }
}

/**
 * Incremental sync - only fetch updates since last sync
 */
export async function incrementalSync(organizationId, dependencies) {
  const { getIntegration, decrypt, getLastSyncTime } = dependencies;
  
  const integration = await getIntegration(organizationId, 'github');
  const lastSyncTime = await getLastSyncTime(organizationId, 'github');
  
  if (!lastSyncTime) {
    // No previous sync, do full sync
    return syncGitHubData(organizationId, dependencies);
  }
  
  console.log(`Starting incremental sync since ${lastSyncTime}`);
  
  const accessToken = decrypt(integration.credentials);
  const client = new GitHubClient(accessToken);
  
  // Only sync repositories that have been updated since last sync
  const repos = await client.listRepositories({
    sort: 'updated',
    direction: 'desc'
  });
  
  const updatedRepos = repos.data.filter(repo => {
    const updatedAt = new Date(repo.updated_at);
    return updatedAt > new Date(lastSyncTime);
  });
  
  console.log(`Found ${updatedRepos.length} repositories updated since last sync`);
  
  // Sync only updated repositories
  for (const repo of updatedRepos) {
    await syncPullRequests(
      client,
      repo.owner.login,
      repo.name,
      organizationId,
      dependencies
    );
  }
  
  await updateIntegration(integration.id, { lastSyncAt: new Date() });
}

/**
 * Scheduled sync job
 */
export async function scheduledSync(dependencies) {
  const { getAllOrganizationsWithIntegration } = dependencies;
  
  const organizations = await getAllOrganizationsWithIntegration('github');
  
  console.log(`Running scheduled sync for ${organizations.length} organizations`);
  
  for (const org of organizations) {
    try {
      await incrementalSync(org.id, dependencies);
    } catch (error) {
      console.error(`Sync failed for organization ${org.id}:`, error.message);
    }
  }
}

// Helper function to update integration (would be in database module)
async function updateIntegration(integrationId, data) {
  // TODO: Implement database update
  console.log(`Updating integration ${integrationId}:`, data);
}
