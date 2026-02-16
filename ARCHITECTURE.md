# CompanyOS Technical Architecture
## System Design Document v1.0

---

## Architecture Overview

CompanyOS follows a **microservices-inspired monolith** architecture with an **event-driven agent system**. The platform consists of:

1. **Frontend Application** (React SPA)
2. **API Gateway** (Express.js)
3. **Core Services** (Business logic modules)
4. **Agent Runtime** (Distributed worker system)
5. **Integration Layer** (Third-party service adapters)
6. **Data Layer** (PostgreSQL + Redis + Vector DB)
7. **Event Bus** (Redis Pub/Sub + RabbitMQ)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React SPA (TypeScript + TailwindCSS)                    │   │
│  │  - Command Center Dashboard                              │   │
│  │  - Development Hub                                        │   │
│  │  - Design System Manager                                 │   │
│  │  - Team Coordination Center                              │   │
│  │  - Social Command Post                                   │   │
│  │  - Agent Orchestration Console                           │   │
│  │  - Intelligence Hub                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↕ WebSocket/REST                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Gateway (Express.js + GraphQL)                      │   │
│  │  - Authentication/Authorization                          │   │
│  │  - Rate Limiting                                         │   │
│  │  - Request Validation                                    │   │
│  │  - WebSocket Server                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CORE SERVICES LAYER                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ Development │ Design      │ Team        │ Social          │ │
│  │ Service     │ Service     │ Service     │ Service         │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘ │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ Agent       │ Integration │ Analytics   │ Notification    │ │
│  │ Service     │ Service     │ Service     │ Service         │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        AGENT RUNTIME                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Agent Orchestrator                                      │   │
│  │  ┌────────────┬────────────┬────────────┬─────────────┐ │   │
│  │  │ Code Review│ Deployment │ Design QA  │ Content     │ │   │
│  │  │ Agent      │ Agent      │ Agent      │ Agent       │ │   │
│  │  └────────────┴────────────┴────────────┴─────────────┘ │   │
│  │  ┌────────────┬────────────┬────────────┬─────────────┐ │   │
│  │  │ Standup    │ Analytics  │ Prediction │ Engagement  │ │   │
│  │  │ Agent      │ Agent      │ Agent      │ Agent       │ │   │
│  │  └────────────┴────────────┴────────────┴─────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                          │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ GitHub      │ Vercel      │ Figma       │ Slack           │ │
│  │ Adapter     │ Adapter     │ Adapter     │ Adapter         │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘ │
│  ┌─────────────┬─────────────┐                                 │
│  │ Twitter     │ LinkedIn    │                                 │
│  │ Adapter     │ Adapter     │                                 │
│  └─────────────┴─────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         EVENT BUS                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Redis Pub/Sub + RabbitMQ                                │   │
│  │  - Event routing                                         │   │
│  │  - Task queues                                           │   │
│  │  - Agent communication                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ PostgreSQL  │ Redis       │ Pinecone    │ S3/Object       │ │
│  │ (Primary)   │ (Cache)     │ (Vectors)   │ Storage         │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

**Core Framework:**
- **React 19** with TypeScript
- **Vite** for build tooling and HMR
- **React Router** for client-side routing

**UI/UX:**
- **TailwindCSS v4** for styling
- **shadcn/ui** component library (customized)
- **Lucide React** for icons
- **Framer Motion** for animations
- **Recharts** for data visualization

**State Management:**
- **Zustand** for global state
- **TanStack Query** (React Query) for server state
- **React Context** for theming and preferences

**Real-Time:**
- **Socket.io Client** for WebSocket connections
- **EventSource** for SSE fallback

**Code Quality:**
- **ESLint** + **Prettier**
- **TypeScript strict mode**
- **Vitest** for unit tests
- **Playwright** for E2E tests

### Backend Stack

**Core Framework:**
- **Node.js v20+** (LTS)
- **Express.js** for REST API
- **Apollo Server** for GraphQL
- **Socket.io** for WebSocket server

**Database:**
- **PostgreSQL 16** (primary database)
  - **Prisma ORM** for type-safe queries
  - **pg-boss** for job queues
- **Redis 7** (caching + pub/sub)
  - **ioredis** client
- **Pinecone** (vector database for semantic search)

**Message Queue:**
- **RabbitMQ** for reliable task queuing
- **BullMQ** for job processing

**Authentication:**
- **Passport.js** for OAuth strategies
- **jsonwebtoken** for JWT tokens
- **bcrypt** for password hashing

**Integrations:**
- **Octokit** (GitHub API)
- **@vercel/client** (Vercel API)
- **figma-api** (Figma REST API)
- **@slack/web-api** (Slack SDK)
- **twitter-api-v2** (Twitter/X API)
- **linkedin-api-client** (LinkedIn API)

**AI/ML:**
- **OpenAI SDK** (GPT-4, GPT-4 Turbo)
- **Anthropic SDK** (Claude 3.5 Sonnet)
- **LangChain** for agent orchestration
- **Transformers.js** for local embeddings

**Testing:**
- **Jest** for unit tests
- **Supertest** for API testing
- **Testcontainers** for integration tests

### Infrastructure

**Containerization:**
- **Docker** for containerization
- **Docker Compose** for local development

**Orchestration:**
- **Kubernetes** (K8s) for production deployment
- **Helm** for K8s package management

**Cloud Provider:**
- **AWS** (primary)
  - ECS/EKS for container orchestration
  - RDS for managed PostgreSQL
  - ElastiCache for managed Redis
  - S3 for object storage
  - CloudFront for CDN
  - Route 53 for DNS
- **Alternative: GCP or Azure** (provider-agnostic design)

**CI/CD:**
- **GitHub Actions** for CI/CD pipelines
- **Vercel** for frontend deployment (optional)
- **ArgoCD** for GitOps deployments

**Monitoring & Observability:**
- **Datadog** or **New Relic** for APM
- **Sentry** for error tracking
- **Prometheus + Grafana** for metrics
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for logs

**Security:**
- **Vault** by HashiCorp for secrets management
- **OAuth 2.0** for third-party auth
- **Let's Encrypt** for SSL/TLS certificates
- **AWS WAF** for web application firewall

---

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- admin, member, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### `organization_members`
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- owner, admin, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

### Integration Tables

#### `integrations`
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL, -- github, vercel, figma, slack, twitter, linkedin
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, error
  credentials_encrypted TEXT NOT NULL, -- encrypted OAuth tokens
  metadata JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, service)
);

CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_integrations_service ON integrations(service);
```

#### `webhooks`
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- pull_request.opened, deployment.created, etc.
  webhook_id VARCHAR(255), -- external webhook ID for management
  secret VARCHAR(255), -- webhook signature secret
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_integration ON webhooks(integration_id);
```

### Development Tables

#### `repositories`
```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  github_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  default_branch VARCHAR(100) DEFAULT 'main',
  visibility VARCHAR(50), -- public, private
  metadata JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repos_org ON repositories(organization_id);
CREATE INDEX idx_repos_github_id ON repositories(github_id);
```

#### `pull_requests`
```sql
CREATE TABLE pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  github_id BIGINT UNIQUE NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state VARCHAR(50) NOT NULL, -- open, closed, merged
  author_github_id BIGINT,
  base_branch VARCHAR(255),
  head_branch VARCHAR(255),
  draft BOOLEAN DEFAULT false,
  mergeable BOOLEAN,
  review_status VARCHAR(50), -- pending, approved, changes_requested
  agent_review_status VARCHAR(50), -- not_started, in_progress, completed
  metadata JSONB DEFAULT '{}',
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prs_repo ON pull_requests(repository_id);
CREATE INDEX idx_prs_state ON pull_requests(state);
CREATE INDEX idx_prs_review_status ON pull_requests(review_status);
```

#### `deployments`
```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vercel_deployment_id VARCHAR(255) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  state VARCHAR(50) NOT NULL, -- queued, building, ready, error, canceled
  environment VARCHAR(50), -- production, preview, development
  commit_sha VARCHAR(255),
  branch VARCHAR(255),
  creator_id UUID REFERENCES users(id),
  agent_checked BOOLEAN DEFAULT false,
  health_score INTEGER, -- 0-100
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ
);

CREATE INDEX idx_deployments_org ON deployments(organization_id);
CREATE INDEX idx_deployments_state ON deployments(state);
CREATE INDEX idx_deployments_vercel_id ON deployments(vercel_deployment_id);
```

### Design Tables

#### `figma_files`
```sql
CREATE TABLE figma_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  figma_file_key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- design_file, component_library
  thumbnail_url TEXT,
  last_modified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_figma_files_org ON figma_files(organization_id);
CREATE INDEX idx_figma_files_key ON figma_files(figma_file_key);
```

#### `design_components`
```sql
CREATE TABLE design_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figma_file_id UUID NOT NULL REFERENCES figma_files(id) ON DELETE CASCADE,
  figma_component_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  component_type VARCHAR(100), -- button, input, card, etc.
  code_generated BOOLEAN DEFAULT false,
  code_path TEXT, -- path in codebase
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_design_components_file ON design_components(figma_file_id);
CREATE INDEX idx_design_components_type ON design_components(component_type);
```

### Social Tables

#### `social_accounts`
```sql
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- twitter, linkedin
  account_id VARCHAR(255) NOT NULL, -- external account ID
  handle VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  follower_count INTEGER DEFAULT 0,
  credentials_encrypted TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform, account_id)
);

CREATE INDEX idx_social_accounts_org ON social_accounts(organization_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
```

#### `social_posts`
```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  external_post_id VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL, -- draft, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_views INTEGER DEFAULT 0,
  agent_generated BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_account ON social_posts(social_account_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for);
```

### Agent Tables

#### `agents`
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  agent_type VARCHAR(100) NOT NULL, -- code_review, deployment, content, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'idle', -- idle, working, error, disabled
  capabilities JSONB DEFAULT '[]', -- list of things this agent can do
  configuration JSONB DEFAULT '{}',
  current_task_id UUID,
  total_tasks_completed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  average_duration_seconds INTEGER,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_agents_status ON agents(status);
```

#### `agent_tasks`
```sql
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  retry_count INTEGER DEFAULT 0,
  requires_human_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at DESC);
```

#### `agent_collaborations`
```sql
CREATE TABLE agent_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  collaborating_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
  collaboration_type VARCHAR(100), -- handoff, parallel, review
  status VARCHAR(50) DEFAULT 'active', -- active, completed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_collabs_primary ON agent_collaborations(primary_agent_id);
CREATE INDEX idx_agent_collabs_collaborating ON agent_collaborations(collaborating_agent_id);
```

### Analytics Tables

#### `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- deployment.created, pr.opened, post.published, etc.
  event_source VARCHAR(50) NOT NULL, -- github, vercel, slack, agent, user
  actor_type VARCHAR(50), -- user, agent, webhook
  actor_id UUID,
  resource_type VARCHAR(100), -- pull_request, deployment, post, etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_source ON events(event_source);
CREATE INDEX idx_events_created ON events(created_at DESC);
```

#### `metrics`
```sql
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- deployment_frequency, pr_merge_time, etc.
  value DECIMAL(12,2) NOT NULL,
  unit VARCHAR(50), -- seconds, count, percentage
  dimensions JSONB DEFAULT '{}', -- tags for filtering
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_org ON metrics(organization_id);
CREATE INDEX idx_metrics_type ON metrics(metric_type);
CREATE INDEX idx_metrics_recorded ON metrics(recorded_at DESC);
```

---

## API Design

### REST API Endpoints

#### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

#### Organizations
```
GET    /api/organizations
GET    /api/organizations/:id
POST   /api/organizations
PATCH  /api/organizations/:id
DELETE /api/organizations/:id

GET    /api/organizations/:id/members
POST   /api/organizations/:id/members
PATCH  /api/organizations/:id/members/:userId
DELETE /api/organizations/:id/members/:userId
```

#### Integrations
```
GET    /api/integrations
GET    /api/integrations/:service
POST   /api/integrations/:service/connect
DELETE /api/integrations/:service/disconnect
POST   /api/integrations/:service/sync
GET    /api/integrations/:service/status

POST   /api/webhooks/:service/receive (public webhook endpoint)
```

#### Development
```
GET    /api/repositories
GET    /api/repositories/:id
POST   /api/repositories/:id/sync

GET    /api/pull-requests
GET    /api/pull-requests/:id
POST   /api/pull-requests/:id/agent-review

GET    /api/deployments
GET    /api/deployments/:id
POST   /api/deployments/:id/rollback
```

#### Design
```
GET    /api/figma/files
GET    /api/figma/files/:id
POST   /api/figma/files/:id/sync

GET    /api/design-components
GET    /api/design-components/:id
POST   /api/design-components/:id/generate-code
```

#### Social
```
GET    /api/social/accounts
GET    /api/social/accounts/:id
POST   /api/social/accounts/:platform/connect

GET    /api/social/posts
GET    /api/social/posts/:id
POST   /api/social/posts
PATCH  /api/social/posts/:id
DELETE /api/social/posts/:id
POST   /api/social/posts/:id/publish
```

#### Agents
```
GET    /api/agents
GET    /api/agents/:id
POST   /api/agents
PATCH  /api/agents/:id
DELETE /api/agents/:id

GET    /api/agents/:id/tasks
GET    /api/agent-tasks/:id
POST   /api/agent-tasks/:id/approve
POST   /api/agent-tasks/:id/reject

GET    /api/agent-tasks
POST   /api/agent-tasks (create manual task for agent)
```

#### Analytics
```
GET    /api/analytics/dashboard
GET    /api/analytics/metrics/:type
GET    /api/analytics/events
POST   /api/analytics/reports
```

### GraphQL Schema (Subset)

```graphql
type Query {
  organization(id: ID!): Organization
  pullRequests(filters: PRFilters): [PullRequest!]!
  deployments(filters: DeploymentFilters): [Deployment!]!
  agents(filters: AgentFilters): [Agent!]!
  socialPosts(filters: SocialPostFilters): [SocialPost!]!
  analytics(query: AnalyticsQuery!): AnalyticsResult!
}

type Mutation {
  createPullRequest(input: CreatePRInput!): PullRequest!
  rollbackDeployment(id: ID!): Deployment!
  publishSocialPost(id: ID!): SocialPost!
  spawnAgent(type: AgentType!, config: JSON): Agent!
  approveAgentTask(taskId: ID!): AgentTask!
}

type Subscription {
  deploymentStatusChanged(projectId: ID): Deployment!
  pullRequestUpdated(repoId: ID): PullRequest!
  agentTaskCreated(agentId: ID): AgentTask!
  newEvent(organizationId: ID!): Event!
}

type Organization {
  id: ID!
  name: String!
  slug: String!
  members: [OrganizationMember!]!
  integrations: [Integration!]!
  agents: [Agent!]!
}

type PullRequest {
  id: ID!
  number: Int!
  title: String!
  state: PRState!
  author: User
  reviewStatus: ReviewStatus
  agentReview: AgentReview
  repository: Repository!
}

type Deployment {
  id: ID!
  projectName: String!
  url: String!
  state: DeploymentState!
  environment: String!
  healthScore: Int
  createdAt: DateTime!
}

type Agent {
  id: ID!
  name: String!
  type: AgentType!
  status: AgentStatus!
  currentTask: AgentTask
  stats: AgentStats!
}

type AgentTask {
  id: ID!
  agent: Agent!
  taskType: String!
  status: TaskStatus!
  priority: Int!
  requiresApproval: Boolean!
}
```

### WebSocket Events

```javascript
// Client → Server
socket.emit('subscribe', { channel: 'deployments' })
socket.emit('subscribe', { channel: 'pull_requests', repoId: 'repo-123' })
socket.emit('subscribe', { channel: 'agent_tasks' })

// Server → Client
socket.on('deployment.created', (deployment) => { /* ... */ })
socket.on('deployment.ready', (deployment) => { /* ... */ })
socket.on('deployment.error', (deployment) => { /* ... */ })

socket.on('pull_request.opened', (pr) => { /* ... */ })
socket.on('pull_request.reviewed', (pr) => { /* ... */ })

socket.on('agent_task.started', (task) => { /* ... */ })
socket.on('agent_task.completed', (task) => { /* ... */ })
socket.on('agent_task.needs_approval', (task) => { /* ... */ })

socket.on('event.created', (event) => { /* ... */ })
```

---

## Agent Runtime Architecture

### Agent Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │  IDLE   │───▶│ WORKING │───▶│COMPLETE │───▶│  IDLE   │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│       │              │                              │      │
│       │              └──────────┐                   │      │
│       │                         ▼                   │      │
│       │                    ┌─────────┐              │      │
│       └───────────────────▶│  ERROR  │──────────────┘      │
│                            └─────────┘                     │
│                                 │                          │
│                                 ▼                          │
│                            ┌─────────┐                     │
│                            │DISABLED │                     │
│                            └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Agent Types & Responsibilities

#### 1. **Watcher Agents** (Event-Driven)
Monitor external systems and trigger workflows.

**Examples:**
- **GitHub Watcher**: Monitors webhooks for PR events, push events, issue updates
- **Vercel Watcher**: Monitors deployments, build status
- **Figma Watcher**: Monitors file changes, component updates
- **Slack Watcher**: Monitors messages, mentions, reactions

**Implementation:**
```javascript
class GitHubWatcherAgent extends WatcherAgent {
  async handleWebhook(event) {
    if (event.type === 'pull_request.opened') {
      await this.spawnTask('analyze_pr', {
        prId: event.pull_request.id,
        assignTo: 'CodeReviewAgent'
      })
    }
  }
}
```

#### 2. **Executor Agents** (Action-Oriented)
Perform specific tasks and actions.

**Examples:**
- **Code Review Agent**: Analyzes PRs, provides feedback, assigns reviewers
- **Deployment Agent**: Triggers deployments, monitors health, performs rollbacks
- **Component Generator Agent**: Converts Figma designs to React code
- **Content Writer Agent**: Drafts social media posts
- **Notification Agent**: Sends alerts to Slack, email, etc.

**Implementation:**
```javascript
class CodeReviewAgent extends ExecutorAgent {
  async executeTask(task) {
    const pr = await this.fetchPullRequest(task.data.prId)
    const analysis = await this.analyzeCode(pr.diff)
    
    if (analysis.hasSecurityIssues) {
      await this.spawnTask('security_scan', {
        prId: pr.id,
        assignTo: 'SecurityAgent',
        priority: 10
      })
    }
    
    return analysis
  }
}
```

#### 3. **Coordinator Agents** (Orchestration)
Manage multi-step workflows and coordinate other agents.

**Examples:**
- **Deployment Coordinator**: Orchestrates full deployment pipeline
- **Content Pipeline Coordinator**: Manages content creation → review → publish
- **Incident Response Coordinator**: Orchestrates emergency responses

**Implementation:**
```javascript
class DeploymentCoordinatorAgent extends CoordinatorAgent {
  async orchestrateDeployment(deployment) {
    // Step 1: Pre-deployment checks
    await this.spawnTask('pre_deployment_check', {
      assignTo: 'QAAgent',
      blocking: true
    })
    
    // Step 2: Deploy
    await this.spawnTask('deploy', {
      assignTo: 'DeploymentAgent',
      blocking: true
    })
    
    // Step 3: Monitor
    await this.spawnTask('monitor_health', {
      assignTo: 'MonitoringAgent',
      duration: 300 // 5 minutes
    })
    
    // Step 4: Notify
    await this.spawnTask('notify_team', {
      assignTo: 'NotificationAgent'
    })
  }
}
```

#### 4. **Analyst Agents** (Intelligence)
Analyze data, generate insights, make predictions.

**Examples:**
- **Analytics Agent**: Aggregates metrics, identifies trends
- **Prediction Agent**: Forecasts deployment risk, content performance
- **Anomaly Detection Agent**: Detects unusual patterns
- **Recommendation Agent**: Suggests optimizations

**Implementation:**
```javascript
class PredictionAgent extends AnalystAgent {
  async predictDeploymentRisk(deployment) {
    const history = await this.fetchDeploymentHistory()
    const features = this.extractFeatures(deployment, history)
    const prediction = await this.mlModel.predict(features)
    
    return {
      riskScore: prediction.riskScore, // 0-100
      confidence: prediction.confidence,
      factors: prediction.topFactors
    }
  }
}
```

### Agent Communication Patterns

#### 1. **Direct Task Assignment**
```javascript
await agentA.assignTask(agentB, {
  type: 'review_code',
  data: { prId: '123' }
})
```

#### 2. **Event Bus Broadcasting**
```javascript
eventBus.publish('deployment.completed', {
  deploymentId: '456',
  status: 'success'
})

// Multiple agents can subscribe
eventBus.subscribe('deployment.completed', (data) => {
  // Handle event
})
```

#### 3. **Request-Response**
```javascript
const analysis = await agentA.request(agentB, {
  type: 'analyze_security',
  data: { code: '...' }
})
```

#### 4. **Consensus Building**
```javascript
const opinions = await Promise.all([
  agentA.evaluate(task),
  agentB.evaluate(task),
  agentC.evaluate(task)
])

const decision = this.buildConsensus(opinions)
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│  User   │                  │ CompanyOS│                 │ Third   │
│ Browser │                  │  Server  │                 │ Party   │
└────┬────┘                  └────┬─────┘                 └────┬────┘
     │                            │                            │
     │  1. Request login          │                            │
     ├───────────────────────────▶│                            │
     │                            │                            │
     │  2. Redirect to OAuth      │                            │
     │◀───────────────────────────┤                            │
     │                            │                            │
     │  3. User authorizes        │                            │
     ├────────────────────────────┼───────────────────────────▶│
     │                            │                            │
     │  4. Callback with code     │                            │
     │◀───────────────────────────┼────────────────────────────┤
     │                            │                            │
     │  5. Exchange code for token│                            │
     ├───────────────────────────▶│                            │
     │                            │  6. Validate with provider │
     │                            ├───────────────────────────▶│
     │                            │                            │
     │                            │  7. User info              │
     │                            │◀───────────────────────────┤
     │                            │                            │
     │  8. JWT token + cookie     │                            │
     │◀───────────────────────────┤                            │
     │                            │                            │
```

### Authorization (RBAC)

**Roles:**
- **Owner**: Full access, can delete organization
- **Admin**: Full access except organization deletion
- **Member**: Standard access to all features
- **Viewer**: Read-only access

**Permissions Matrix:**

| Resource              | Owner | Admin | Member | Viewer |
|-----------------------|-------|-------|--------|--------|
| View Dashboard        | ✓     | ✓     | ✓      | ✓      |
| Manage Integrations   | ✓     | ✓     | ✓      | ✗      |
| Spawn Agents          | ✓     | ✓     | ✓      | ✗      |
| Approve Agent Tasks   | ✓     | ✓     | ✓      | ✗      |
| Publish Social Posts  | ✓     | ✓     | ✓      | ✗      |
| Manage Members        | ✓     | ✓     | ✗      | ✗      |
| Delete Organization   | ✓     | ✗     | ✗      | ✗      |

### Data Encryption

- **In Transit**: TLS 1.3 for all connections
- **At Rest**: AES-256 encryption for sensitive data (OAuth tokens, API keys)
- **Database**: Encrypted columns for credentials
- **Object Storage**: Server-side encryption for S3

### Secret Management

```javascript
// Secrets stored in Vault
const secrets = {
  'github.oauth.clientSecret': vault.read('github/oauth/client_secret'),
  'slack.botToken': vault.read('slack/bot_token'),
  'openai.apiKey': vault.read('openai/api_key')
}

// Automatic rotation every 90 days
vault.enableAutoRotation('github/oauth/client_secret', { days: 90 })
```

---

## Deployment Architecture

### Development Environment

```bash
# Start all services
docker-compose up

# Services running:
# - Frontend: http://localhost:5173
# - API: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - RabbitMQ: localhost:5672
```

### Production Environment (Kubernetes)

```yaml
# Simplified K8s architecture
---
apiVersion: v1
kind: Namespace
metadata:
  name: companyos

---
# Frontend Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: companyos
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: companyos/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
# API Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: companyos
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: companyos/api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: companyos-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

---
# Agent Worker Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-worker
  namespace: companyos
spec:
  replicas: 10
  selector:
    matchLabels:
      app: agent-worker
  template:
    metadata:
      labels:
        app: agent-worker
    spec:
      containers:
      - name: agent-worker
        image: companyos/agent-worker:latest
        env:
        - name: WORKER_TYPE
          value: "general"
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy CompanyOS

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t companyos/frontend:${{ github.sha }} ./frontend
          docker build -t companyos/api:${{ github.sha }} ./backend
          docker build -t companyos/agent-worker:${{ github.sha }} ./agent-worker
      
      - name: Push to registry
        run: |
          docker push companyos/frontend:${{ github.sha }}
          docker push companyos/api:${{ github.sha }}
          docker push companyos/agent-worker:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/frontend frontend=companyos/frontend:${{ github.sha }} -n companyos
          kubectl set image deployment/api api=companyos/api:${{ github.sha }} -n companyos
          kubectl set image deployment/agent-worker agent-worker=companyos/agent-worker:${{ github.sha }} -n companyos
```

---

## Performance Optimization

### Caching Strategy

1. **Redis Cache Layers:**
   - L1: User session data (TTL: 24h)
   - L2: API responses (TTL: 5min)
   - L3: Agent task results (TTL: 1h)
   - L4: Analytics aggregations (TTL: 15min)

2. **Database Query Optimization:**
   - Connection pooling (50-100 connections)
   - Read replicas for analytics queries
   - Materialized views for complex aggregations
   - Query result caching

3. **CDN:**
   - Static assets (images, JS, CSS)
   - Edge caching for API responses (specific endpoints)

### Scalability Considerations

- **Horizontal Scaling**: API and agent workers scale independently
- **Database Sharding**: By organization_id for multi-tenant isolation
- **Queue Partitioning**: Separate queues for high/low priority tasks
- **WebSocket Connection Management**: Sticky sessions with Redis adapter

---

## Monitoring & Observability

### Key Metrics

**Application Metrics:**
- API response time (p50, p95, p99)
- WebSocket connection count
- Agent task queue depth
- Agent task completion rate
- Error rate by endpoint
- Cache hit rate

**Business Metrics:**
- Deployments per day
- PR merge velocity
- Social posts published
- Agent task success rate
- User active sessions

**Infrastructure Metrics:**
- CPU/Memory utilization
- Database connection pool saturation
- Redis memory usage
- Disk I/O
- Network throughput

### Alerting Rules

```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: SlowAPIResponse
    condition: p95_response_time > 2s
    duration: 5m
    severity: warning
    
  - name: AgentTaskBacklog
    condition: task_queue_depth > 1000
    duration: 10m
    severity: warning
    
  - name: DeploymentFailed
    condition: deployment_state == "error"
    severity: critical
```

---

## Future Architecture Considerations

1. **GraphQL Federation**: Split schema across microservices
2. **Event Sourcing**: Full audit trail of all state changes
3. **CQRS**: Separate read/write models for better performance
4. **Multi-Region**: Deploy across multiple AWS regions
5. **Offline Support**: PWA with local-first architecture
6. **Mobile Apps**: Native iOS/Android apps
7. **Plugin System**: Allow third-party extensions
8. **Self-Hosted**: On-premise deployment option

---

*See `INTEGRATIONS.md` for detailed integration specifications.*
*See `AGENTS.md` for comprehensive agent system design.*
*See `ROADMAP.md` for phased implementation plan.*
