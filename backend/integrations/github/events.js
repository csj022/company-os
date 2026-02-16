/**
 * GitHub Event Handlers
 * Process webhook events and trigger appropriate actions
 */

/**
 * Event handler registry
 */
const eventHandlers = new Map();

/**
 * Register an event handler
 */
export function registerEventHandler(event, handler) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, []);
  }
  eventHandlers.get(event).push(handler);
}

/**
 * Process event through registered handlers
 */
export async function processEvent(eventName, data) {
  const handlers = eventHandlers.get(eventName) || [];
  
  for (const handler of handlers) {
    try {
      await handler(data);
    } catch (error) {
      console.error(`Error in ${eventName} handler:`, error);
    }
  }
}

/**
 * Handle pull_request events
 */
export async function handlePullRequestEvent(data, { spawnAgent, upsertPullRequest }) {
  const { payload } = data;
  const { action, pull_request, repository } = payload;
  
  console.log(`Pull Request ${action}: ${repository.full_name}#${pull_request.number}`);
  
  // Store/update pull request in database
  await upsertPullRequest({
    githubId: pull_request.id,
    number: pull_request.number,
    repositoryFullName: repository.full_name,
    title: pull_request.title,
    body: pull_request.body,
    state: pull_request.state,
    author: pull_request.user.login,
    baseBranch: pull_request.base.ref,
    headBranch: pull_request.head.ref,
    url: pull_request.html_url,
    createdAt: pull_request.created_at,
    updatedAt: pull_request.updated_at,
    mergedAt: pull_request.merged_at,
    closedAt: pull_request.closed_at,
    draft: pull_request.draft,
    additions: pull_request.additions,
    deletions: pull_request.deletions,
    changedFiles: pull_request.changed_files
  });
  
  // Trigger actions based on event type
  switch (action) {
    case 'opened':
      await spawnAgent('CodeReviewAgent', {
        task: 'analyze_pr',
        data: {
          prId: pull_request.id,
          prNumber: pull_request.number,
          repoFullName: repository.full_name,
          title: pull_request.title,
          baseBranch: pull_request.base.ref,
          headBranch: pull_request.head.ref
        }
      });
      break;
      
    case 'synchronize':
      // New commits pushed to PR
      await spawnAgent('CodeReviewAgent', {
        task: 'review_new_commits',
        data: {
          prId: pull_request.id,
          prNumber: pull_request.number,
          repoFullName: repository.full_name
        }
      });
      break;
      
    case 'closed':
      if (pull_request.merged) {
        await spawnAgent('NotificationAgent', {
          task: 'notify_pr_merged',
          data: {
            prNumber: pull_request.number,
            repoFullName: repository.full_name,
            title: pull_request.title,
            mergedBy: pull_request.merged_by?.login
          }
        });
      }
      break;
      
    case 'ready_for_review':
      // Draft PR marked as ready
      await spawnAgent('CodeReviewAgent', {
        task: 'full_pr_review',
        data: {
          prId: pull_request.id,
          prNumber: pull_request.number,
          repoFullName: repository.full_name
        }
      });
      break;
  }
}

/**
 * Handle pull_request_review events
 */
export async function handlePullRequestReviewEvent(data, { spawnAgent }) {
  const { payload } = data;
  const { action, review, pull_request, repository } = payload;
  
  console.log(`PR Review ${action}: ${repository.full_name}#${pull_request.number} - ${review.state}`);
  
  if (action === 'submitted') {
    // Check if all required reviews are complete
    if (review.state === 'approved') {
      await spawnAgent('NotificationAgent', {
        task: 'notify_pr_approved',
        data: {
          prNumber: pull_request.number,
          repoFullName: repository.full_name,
          reviewer: review.user.login,
          title: pull_request.title
        }
      });
    } else if (review.state === 'changes_requested') {
      await spawnAgent('NotificationAgent', {
        task: 'notify_changes_requested',
        data: {
          prNumber: pull_request.number,
          repoFullName: repository.full_name,
          reviewer: review.user.login,
          comments: review.body
        }
      });
    }
  }
}

/**
 * Handle push events
 */
export async function handlePushEvent(data, { spawnAgent, eventBus }) {
  const { payload } = data;
  const { ref, repository, commits, pusher } = payload;
  
  const branch = ref.replace('refs/heads/', '');
  console.log(`Push to ${repository.full_name}:${branch} by ${pusher.name} (${commits.length} commits)`);
  
  // If push to default branch, trigger deployment
  if (branch === repository.default_branch) {
    await eventBus.publish('deployment.trigger', {
      repo: repository.full_name,
      branch: branch,
      commitSha: payload.after,
      commits: commits.map(c => ({
        sha: c.id,
        message: c.message,
        author: c.author.name,
        timestamp: c.timestamp
      }))
    });
    
    await spawnAgent('DeploymentAgent', {
      task: 'prepare_deployment',
      data: {
        repoFullName: repository.full_name,
        branch: branch,
        commitSha: payload.after,
        commitCount: commits.length
      }
    });
  }
  
  // Analyze commits for patterns
  await spawnAgent('CodeAnalysisAgent', {
    task: 'analyze_commits',
    data: {
      repoFullName: repository.full_name,
      branch: branch,
      commits: commits.map(c => ({
        sha: c.id,
        message: c.message,
        author: c.author.name,
        added: c.added,
        modified: c.modified,
        removed: c.removed
      }))
    }
  });
}

/**
 * Handle issues events
 */
export async function handleIssuesEvent(data, { spawnAgent, upsertIssue }) {
  const { payload } = data;
  const { action, issue, repository } = payload;
  
  console.log(`Issue ${action}: ${repository.full_name}#${issue.number}`);
  
  // Store/update issue
  await upsertIssue({
    githubId: issue.id,
    number: issue.number,
    repositoryFullName: repository.full_name,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    author: issue.user.login,
    labels: issue.labels.map(l => l.name),
    assignees: issue.assignees.map(a => a.login),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at
  });
  
  if (action === 'opened') {
    // Classify and route new issues
    await spawnAgent('IssueTriageAgent', {
      task: 'classify_issue',
      data: {
        issueNumber: issue.number,
        repoFullName: repository.full_name,
        title: issue.title,
        body: issue.body,
        author: issue.user.login
      }
    });
  }
}

/**
 * Handle issue_comment events
 */
export async function handleIssueCommentEvent(data, { spawnAgent }) {
  const { payload } = data;
  const { action, comment, issue, repository } = payload;
  
  console.log(`Issue comment ${action}: ${repository.full_name}#${issue.number}`);
  
  if (action === 'created') {
    // Check if comment mentions bot or contains commands
    const mentionPattern = /@companyos-bot/i;
    const commandPattern = /^\/([\w-]+)/;
    
    if (mentionPattern.test(comment.body) || commandPattern.test(comment.body)) {
      await spawnAgent('IssueCommandAgent', {
        task: 'process_comment_command',
        data: {
          issueNumber: issue.number,
          repoFullName: repository.full_name,
          commentId: comment.id,
          commentBody: comment.body,
          commentAuthor: comment.user.login
        }
      });
    }
  }
}

/**
 * Handle deployment events
 */
export async function handleDeploymentEvent(data, { spawnAgent, upsertDeployment }) {
  const { payload } = data;
  const { deployment, repository } = payload;
  
  console.log(`Deployment created: ${repository.full_name} to ${deployment.environment}`);
  
  await upsertDeployment({
    githubId: deployment.id,
    repositoryFullName: repository.full_name,
    environment: deployment.environment,
    ref: deployment.ref,
    sha: deployment.sha,
    description: deployment.description,
    createdAt: deployment.created_at
  });
  
  await spawnAgent('DeploymentMonitorAgent', {
    task: 'monitor_deployment',
    data: {
      deploymentId: deployment.id,
      repoFullName: repository.full_name,
      environment: deployment.environment,
      sha: deployment.sha
    }
  });
}

/**
 * Handle deployment_status events
 */
export async function handleDeploymentStatusEvent(data, { spawnAgent, updateDeployment }) {
  const { payload } = data;
  const { deployment_status, deployment, repository } = payload;
  
  console.log(`Deployment status: ${repository.full_name} - ${deployment_status.state}`);
  
  await updateDeployment(deployment.id, {
    status: deployment_status.state,
    targetUrl: deployment_status.target_url,
    environmentUrl: deployment_status.environment_url,
    description: deployment_status.description,
    updatedAt: deployment_status.updated_at
  });
  
  if (deployment_status.state === 'success') {
    await spawnAgent('NotificationAgent', {
      task: 'notify_deployment_success',
      data: {
        repoFullName: repository.full_name,
        environment: deployment.environment,
        url: deployment_status.environment_url
      }
    });
  } else if (deployment_status.state === 'failure' || deployment_status.state === 'error') {
    await spawnAgent('NotificationAgent', {
      task: 'alert_deployment_failure',
      data: {
        repoFullName: repository.full_name,
        environment: deployment.environment,
        error: deployment_status.description
      }
    });
  }
}

/**
 * Handle release events
 */
export async function handleReleaseEvent(data, { spawnAgent, upsertRelease }) {
  const { payload } = data;
  const { action, release, repository } = payload;
  
  console.log(`Release ${action}: ${repository.full_name} - ${release.tag_name}`);
  
  if (action === 'published') {
    await upsertRelease({
      githubId: release.id,
      repositoryFullName: repository.full_name,
      tagName: release.tag_name,
      name: release.name,
      body: release.body,
      draft: release.draft,
      prerelease: release.prerelease,
      createdAt: release.created_at,
      publishedAt: release.published_at
    });
    
    await spawnAgent('NotificationAgent', {
      task: 'announce_release',
      data: {
        repoFullName: repository.full_name,
        tagName: release.tag_name,
        name: release.name,
        url: release.html_url,
        notes: release.body
      }
    });
  }
}

/**
 * Initialize event handlers
 */
export function initializeEventHandlers(dependencies) {
  // Register all handlers
  registerEventHandler('github.pull_request', (data) => handlePullRequestEvent(data, dependencies));
  registerEventHandler('github.pull_request_review', (data) => handlePullRequestReviewEvent(data, dependencies));
  registerEventHandler('github.push', (data) => handlePushEvent(data, dependencies));
  registerEventHandler('github.issues', (data) => handleIssuesEvent(data, dependencies));
  registerEventHandler('github.issue_comment', (data) => handleIssueCommentEvent(data, dependencies));
  registerEventHandler('github.deployment', (data) => handleDeploymentEvent(data, dependencies));
  registerEventHandler('github.deployment_status', (data) => handleDeploymentStatusEvent(data, dependencies));
  registerEventHandler('github.release', (data) => handleReleaseEvent(data, dependencies));
  
  console.log('GitHub event handlers initialized');
}
