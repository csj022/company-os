/**
 * Database Seed Script for CompanyOS
 * 
 * Creates sample data for development and testing:
 * - Organizations and users
 * - Integrations (GitHub, Vercel, Figma, Slack, Twitter)
 * - Repositories and pull requests
 * - Deployments
 * - Figma files and components
 * - Social accounts and posts
 * - Agents and agent tasks
 * - Events and metrics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================================
  // USERS
  // ============================================================================
  
  console.log('👤 Creating users...');
  
  const alice = await prisma.user.create({
    data: {
      email: 'alice@companyos.dev',
      name: 'Alice Johnson',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      role: 'admin',
      settings: {
        theme: 'dark',
        notifications: { email: true, slack: true },
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@companyos.dev',
      name: 'Bob Smith',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      role: 'member',
      settings: {
        theme: 'light',
        notifications: { email: false, slack: true },
      },
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@companyos.dev',
      name: 'Charlie Davis',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      role: 'member',
    },
  });

  // ============================================================================
  // ORGANIZATION
  // ============================================================================
  
  console.log('🏢 Creating organization...');
  
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=acme',
      settings: {
        timezone: 'America/New_York',
        workingHours: { start: '09:00', end: '17:00' },
      },
    },
  });

  // Organization members
  await prisma.organizationMember.createMany({
    data: [
      { organizationId: org.id, userId: alice.id, role: 'owner' },
      { organizationId: org.id, userId: bob.id, role: 'admin' },
      { organizationId: org.id, userId: charlie.id, role: 'member' },
    ],
  });

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  
  console.log('🔌 Creating integrations...');
  
  const githubIntegration = await prisma.integration.create({
    data: {
      organizationId: org.id,
      service: 'github',
      status: 'active',
      credentialsEncrypted: 'ENCRYPTED_GITHUB_TOKEN',
      metadata: {
        installationId: '12345678',
        accountLogin: 'acme-corp',
      },
      lastSyncAt: new Date(),
    },
  });

  const vercelIntegration = await prisma.integration.create({
    data: {
      organizationId: org.id,
      service: 'vercel',
      status: 'active',
      credentialsEncrypted: 'ENCRYPTED_VERCEL_TOKEN',
      metadata: {
        teamId: 'team_abc123',
      },
      lastSyncAt: new Date(),
    },
  });

  const figmaIntegration = await prisma.integration.create({
    data: {
      organizationId: org.id,
      service: 'figma',
      status: 'active',
      credentialsEncrypted: 'ENCRYPTED_FIGMA_TOKEN',
      metadata: {
        teamId: 'figma_team_xyz',
      },
      lastSyncAt: new Date(),
    },
  });

  await prisma.integration.create({
    data: {
      organizationId: org.id,
      service: 'slack',
      status: 'active',
      credentialsEncrypted: 'ENCRYPTED_SLACK_TOKEN',
      metadata: {
        teamId: 'T01234567',
        channelId: 'C98765432',
      },
      lastSyncAt: new Date(),
    },
  });

  // Webhooks
  await prisma.webhook.createMany({
    data: [
      {
        integrationId: githubIntegration.id,
        service: 'github',
        eventType: 'pull_request',
        webhookId: 'github_webhook_1',
        secret: 'webhook_secret_1',
      },
      {
        integrationId: vercelIntegration.id,
        service: 'vercel',
        eventType: 'deployment',
        webhookId: 'vercel_webhook_1',
        secret: 'webhook_secret_2',
      },
    ],
  });

  // ============================================================================
  // REPOSITORIES & PULL REQUESTS
  // ============================================================================
  
  console.log('📦 Creating repositories...');
  
  const frontendRepo = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubId: BigInt(111111111),
      name: 'acme-frontend',
      fullName: 'acme-corp/acme-frontend',
      defaultBranch: 'main',
      visibility: 'private',
      metadata: {
        language: 'TypeScript',
        framework: 'React',
      },
      lastSyncAt: new Date(),
    },
  });

  const backendRepo = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubId: BigInt(222222222),
      name: 'acme-backend',
      fullName: 'acme-corp/acme-backend',
      defaultBranch: 'main',
      visibility: 'private',
      metadata: {
        language: 'TypeScript',
        framework: 'Express',
      },
      lastSyncAt: new Date(),
    },
  });

  console.log('🔀 Creating pull requests...');
  
  await prisma.pullRequest.createMany({
    data: [
      {
        repositoryId: frontendRepo.id,
        githubId: BigInt(1001),
        number: 42,
        title: 'Add new dashboard component',
        body: 'This PR adds a new analytics dashboard with real-time metrics.',
        state: 'open',
        authorGithubId: BigInt(99999),
        baseBranch: 'main',
        headBranch: 'feature/dashboard',
        draft: false,
        reviewStatus: 'pending',
        agentReviewStatus: 'in_progress',
        openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        repositoryId: backendRepo.id,
        githubId: BigInt(1002),
        number: 38,
        title: 'Fix authentication bug',
        body: 'Resolves issue with JWT token validation.',
        state: 'open',
        authorGithubId: BigInt(88888),
        baseBranch: 'main',
        headBranch: 'fix/auth-bug',
        draft: false,
        reviewStatus: 'approved',
        agentReviewStatus: 'completed',
        openedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        repositoryId: frontendRepo.id,
        githubId: BigInt(1003),
        number: 41,
        title: 'Update dependencies',
        body: 'Monthly dependency updates and security patches.',
        state: 'merged',
        authorGithubId: BigInt(77777),
        baseBranch: 'main',
        headBranch: 'chore/deps-update',
        draft: false,
        reviewStatus: 'approved',
        agentReviewStatus: 'completed',
        openedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        mergedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ],
  });

  // ============================================================================
  // DEPLOYMENTS
  // ============================================================================
  
  console.log('🚀 Creating deployments...');
  
  await prisma.deployment.createMany({
    data: [
      {
        organizationId: org.id,
        vercelDeploymentId: 'dpl_abc123xyz',
        projectName: 'acme-frontend',
        url: 'https://acme-frontend-git-main-acme.vercel.app',
        state: 'ready',
        environment: 'production',
        commitSha: 'a1b2c3d4e5f6',
        branch: 'main',
        creatorId: alice.id,
        agentChecked: true,
        healthScore: 95,
        readyAt: new Date(),
      },
      {
        organizationId: org.id,
        vercelDeploymentId: 'dpl_def456uvw',
        projectName: 'acme-frontend',
        url: 'https://acme-frontend-pr-42-acme.vercel.app',
        state: 'ready',
        environment: 'preview',
        commitSha: 'b2c3d4e5f6g7',
        branch: 'feature/dashboard',
        creatorId: bob.id,
        agentChecked: true,
        healthScore: 88,
        readyAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        organizationId: org.id,
        vercelDeploymentId: 'dpl_ghi789rst',
        projectName: 'acme-backend',
        url: 'https://acme-backend.vercel.app',
        state: 'ready',
        environment: 'production',
        commitSha: 'c3d4e5f6g7h8',
        branch: 'main',
        creatorId: alice.id,
        agentChecked: true,
        healthScore: 98,
        readyAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ],
  });

  // ============================================================================
  // FIGMA FILES & COMPONENTS
  // ============================================================================
  
  console.log('🎨 Creating Figma files...');
  
  const designSystem = await prisma.figmaFile.create({
    data: {
      organizationId: org.id,
      figmaFileKey: 'abc123def456',
      name: 'Acme Design System',
      fileType: 'component_library',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Design+System',
      lastModifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadata: {
        version: '2.1.0',
        contributors: ['Alice', 'Charlie'],
      },
    },
  });

  const appMockups = await prisma.figmaFile.create({
    data: {
      organizationId: org.id,
      figmaFileKey: 'xyz789uvw012',
      name: 'App Mockups',
      fileType: 'design_file',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=App+Mockups',
      lastModifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('🧩 Creating design components...');
  
  await prisma.designComponent.createMany({
    data: [
      {
        figmaFileId: designSystem.id,
        figmaComponentId: 'comp_button_primary',
        name: 'Button/Primary',
        description: 'Primary action button',
        componentType: 'button',
        codeGenerated: true,
        codePath: 'src/components/Button/Primary.tsx',
        usageCount: 42,
      },
      {
        figmaFileId: designSystem.id,
        figmaComponentId: 'comp_input_text',
        name: 'Input/Text',
        description: 'Text input field',
        componentType: 'input',
        codeGenerated: true,
        codePath: 'src/components/Input/Text.tsx',
        usageCount: 28,
      },
      {
        figmaFileId: designSystem.id,
        figmaComponentId: 'comp_card_default',
        name: 'Card/Default',
        description: 'Standard card component',
        componentType: 'card',
        codeGenerated: false,
        usageCount: 15,
      },
    ],
  });

  // ============================================================================
  // SOCIAL ACCOUNTS & POSTS
  // ============================================================================
  
  console.log('📱 Creating social accounts...');
  
  const twitterAccount = await prisma.socialAccount.create({
    data: {
      organizationId: org.id,
      platform: 'twitter',
      accountId: 'twitter_123456',
      handle: '@AcmeCorp',
      displayName: 'Acme Corp',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=acme',
      followerCount: 1523,
      credentialsEncrypted: 'ENCRYPTED_TWITTER_TOKEN',
      lastSyncAt: new Date(),
    },
  });

  const linkedinAccount = await prisma.socialAccount.create({
    data: {
      organizationId: org.id,
      platform: 'linkedin',
      accountId: 'linkedin_789012',
      handle: 'acme-corp',
      displayName: 'Acme Corp',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=acme-linkedin',
      followerCount: 842,
      credentialsEncrypted: 'ENCRYPTED_LINKEDIN_TOKEN',
      lastSyncAt: new Date(),
    },
  });

  console.log('📝 Creating social posts...');
  
  await prisma.socialPost.createMany({
    data: [
      {
        socialAccountId: twitterAccount.id,
        platform: 'twitter',
        externalPostId: 'tweet_12345',
        content: '🚀 Just shipped a major update to our dashboard! Check out the new real-time analytics features.',
        status: 'published',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        engagementLikes: 47,
        engagementComments: 8,
        engagementShares: 12,
        engagementViews: 1240,
        agentGenerated: false,
        approvedBy: alice.id,
      },
      {
        socialAccountId: twitterAccount.id,
        platform: 'twitter',
        content: '💡 Tip of the day: Always write meaningful commit messages. Your future self will thank you!',
        status: 'scheduled',
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        agentGenerated: true,
        approvedBy: bob.id,
      },
      {
        socialAccountId: linkedinAccount.id,
        platform: 'linkedin',
        externalPostId: 'linkedin_post_67890',
        content: 'Excited to announce our team has grown to 50 members! We\'re hiring talented engineers.',
        status: 'published',
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        engagementLikes: 124,
        engagementComments: 18,
        engagementShares: 6,
        engagementViews: 3450,
        agentGenerated: false,
        approvedBy: alice.id,
      },
      {
        socialAccountId: twitterAccount.id,
        platform: 'twitter',
        content: 'Draft post about upcoming features...',
        status: 'draft',
        agentGenerated: true,
      },
    ],
  });

  // ============================================================================
  // AGENTS
  // ============================================================================
  
  console.log('🤖 Creating agents...');
  
  const codeReviewAgent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Code Reviewer',
      agentType: 'code_review',
      status: 'idle',
      capabilities: ['review_code', 'suggest_improvements', 'detect_security_issues'],
      configuration: {
        reviewDepth: 'thorough',
        autoApprove: false,
      },
      totalTasksCompleted: 127,
      successRate: 96.5,
      averageDurationSeconds: 180,
      lastActiveAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    },
  });

  const deploymentAgent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Deployment Manager',
      agentType: 'deployment',
      status: 'working',
      capabilities: ['deploy', 'rollback', 'monitor_health'],
      configuration: {
        autoRollback: true,
        healthCheckInterval: 60,
      },
      totalTasksCompleted: 234,
      successRate: 98.2,
      averageDurationSeconds: 420,
      lastActiveAt: new Date(),
    },
  });

  const contentAgent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Content Writer',
      agentType: 'content',
      status: 'idle',
      capabilities: ['generate_posts', 'optimize_engagement', 'schedule'],
      configuration: {
        tone: 'professional',
        hashtagLimit: 3,
      },
      totalTasksCompleted: 89,
      successRate: 94.1,
      averageDurationSeconds: 120,
      lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  const analyticsAgent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Analytics Tracker',
      agentType: 'analytics',
      status: 'idle',
      capabilities: ['aggregate_metrics', 'detect_anomalies', 'generate_reports'],
      configuration: {
        reportFrequency: 'daily',
      },
      totalTasksCompleted: 512,
      successRate: 99.8,
      averageDurationSeconds: 45,
      lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  });

  console.log('📋 Creating agent tasks...');
  
  await prisma.agentTask.createMany({
    data: [
      {
        agentId: codeReviewAgent.id,
        taskType: 'review_pull_request',
        description: 'Review PR #42: Add new dashboard component',
        status: 'completed',
        priority: 7,
        inputData: { prId: '1001', repository: 'acme-frontend' },
        outputData: { 
          approved: true, 
          comments: ['Great work!', 'Consider extracting shared logic'],
          securityIssues: 0,
        },
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        durationSeconds: 1800,
      },
      {
        agentId: deploymentAgent.id,
        taskType: 'monitor_deployment',
        description: 'Monitor deployment: acme-frontend (production)',
        status: 'in_progress',
        priority: 9,
        inputData: { deploymentId: 'dpl_abc123xyz' },
        startedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        agentId: contentAgent.id,
        taskType: 'generate_post',
        description: 'Generate weekly tech tips post',
        status: 'completed',
        priority: 5,
        inputData: { topic: 'development tips', platform: 'twitter' },
        outputData: {
          content: '💡 Tip of the day: Always write meaningful commit messages. Your future self will thank you!',
        },
        requiresHumanApproval: true,
        approvedBy: bob.id,
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000),
        durationSeconds: 120,
      },
      {
        agentId: analyticsAgent.id,
        taskType: 'aggregate_metrics',
        description: 'Daily metrics aggregation',
        status: 'pending',
        priority: 3,
        inputData: { period: '24h' },
      },
    ],
  });

  // ============================================================================
  // AGENT COLLABORATIONS
  // ============================================================================
  
  await prisma.agentCollaboration.create({
    data: {
      primaryAgentId: codeReviewAgent.id,
      collaboratingAgentId: deploymentAgent.id,
      collaborationType: 'handoff',
      status: 'completed',
      metadata: {
        context: 'After code review approval, hand off to deployment agent',
      },
    },
  });

  // ============================================================================
  // EVENTS
  // ============================================================================
  
  console.log('📊 Creating events...');
  
  await prisma.event.createMany({
    data: [
      {
        organizationId: org.id,
        eventType: 'deployment.created',
        eventSource: 'vercel',
        actorType: 'webhook',
        resourceType: 'deployment',
        metadata: { deploymentId: 'dpl_abc123xyz' },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        eventType: 'deployment.ready',
        eventSource: 'vercel',
        actorType: 'webhook',
        resourceType: 'deployment',
        metadata: { deploymentId: 'dpl_abc123xyz', duration: 180 },
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        eventType: 'pr.opened',
        eventSource: 'github',
        actorType: 'webhook',
        resourceType: 'pull_request',
        metadata: { prNumber: 42, repository: 'acme-frontend' },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        eventType: 'agent_task.completed',
        eventSource: 'agent',
        actorType: 'agent',
        actorId: codeReviewAgent.id,
        resourceType: 'agent_task',
        metadata: { taskType: 'review_pull_request', success: true },
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        eventType: 'post.published',
        eventSource: 'agent',
        actorType: 'agent',
        actorId: contentAgent.id,
        resourceType: 'social_post',
        metadata: { platform: 'twitter' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ============================================================================
  // METRICS
  // ============================================================================
  
  console.log('📈 Creating metrics...');
  
  await prisma.metric.createMany({
    data: [
      {
        organizationId: org.id,
        metricType: 'deployment_frequency',
        value: 3,
        unit: 'count',
        dimensions: { environment: 'production', period: '24h' },
        recordedAt: new Date(),
      },
      {
        organizationId: org.id,
        metricType: 'pr_merge_time',
        value: 7.5,
        unit: 'hours',
        dimensions: { repository: 'acme-frontend' },
        recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        metricType: 'agent_success_rate',
        value: 96.5,
        unit: 'percentage',
        dimensions: { agentType: 'code_review' },
        recordedAt: new Date(),
      },
      {
        organizationId: org.id,
        metricType: 'social_engagement_rate',
        value: 4.2,
        unit: 'percentage',
        dimensions: { platform: 'twitter', period: '7d' },
        recordedAt: new Date(),
      },
      {
        organizationId: org.id,
        metricType: 'deployment_health_score',
        value: 95,
        unit: 'score',
        dimensions: { project: 'acme-frontend', environment: 'production' },
        recordedAt: new Date(),
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Organizations: ${await prisma.organization.count()}`);
  console.log(`   - Integrations: ${await prisma.integration.count()}`);
  console.log(`   - Repositories: ${await prisma.repository.count()}`);
  console.log(`   - Pull Requests: ${await prisma.pullRequest.count()}`);
  console.log(`   - Deployments: ${await prisma.deployment.count()}`);
  console.log(`   - Figma Files: ${await prisma.figmaFile.count()}`);
  console.log(`   - Design Components: ${await prisma.designComponent.count()}`);
  console.log(`   - Social Accounts: ${await prisma.socialAccount.count()}`);
  console.log(`   - Social Posts: ${await prisma.socialPost.count()}`);
  console.log(`   - Agents: ${await prisma.agent.count()}`);
  console.log(`   - Agent Tasks: ${await prisma.agentTask.count()}`);
  console.log(`   - Events: ${await prisma.event.count()}`);
  console.log(`   - Metrics: ${await prisma.metric.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
