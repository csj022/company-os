# CompanyOS Backend API Documentation
## Complete API Reference v1.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [REST API](#rest-api)
4. [GraphQL API](#graphql-api)
5. [WebSocket API](#websocket-api)
6. [Event Bus](#event-bus)
7. [Webhook Endpoints](#webhook-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Security](#security)

---

## Architecture Overview

### Tech Stack

- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **GraphQL**: Apollo Server with subscriptions
- **WebSocket**: Socket.io
- **Database**: PostgreSQL (via pg)
- **Cache**: Redis (ioredis)
- **Authentication**: JWT (stateless)
- **Security**: Helmet, bcrypt, CORS, rate limiting

### Design Pattern

**Microservices-Inspired Monolith:**
- Clean separation of concerns
- Service-based architecture
- Event-driven communication
- Horizontal scalability ready

### Layers

```
┌─────────────────────────────────────────┐
│         REST + GraphQL + WebSocket       │
├─────────────────────────────────────────┤
│              Middleware Layer            │
│  (Auth, CORS, Rate Limit, Validation)   │
├─────────────────────────────────────────┤
│            Business Services             │
│    (Auth, Org, Integration, Event)      │
├─────────────────────────────────────────┤
│             Event Bus (Redis)            │
├─────────────────────────────────────────┤
│         Database + Cache Layer           │
│        (PostgreSQL + Redis)              │
└─────────────────────────────────────────┘
```

---

## Authentication

### JWT-Based Authentication

CompanyOS uses **JSON Web Tokens (JWT)** for stateless authentication.

#### Token Types

1. **Access Token**
   - Expiry: 15 minutes
   - Used for API requests
   - Payload: `{ userId, email, role, organizationId }`

2. **Refresh Token**
   - Expiry: 7 days
   - Used to obtain new access tokens
   - Payload: `{ userId }`

#### Authentication Flow

```
┌─────────┐                 ┌─────────┐
│ Client  │                 │  Server │
└────┬────┘                 └────┬────┘
     │                           │
     │ POST /api/auth/login      │
     ├──────────────────────────▶│
     │   { email, password }     │
     │                           │
     │  accessToken + refreshToken│
     │◀──────────────────────────┤
     │                           │
     │ GET /api/organizations    │
     │ Authorization: Bearer ... │
     ├──────────────────────────▶│
     │                           │
     │   { organizations: [...] }│
     │◀──────────────────────────┤
     │                           │
     │ POST /api/auth/refresh    │
     │   { refreshToken }        │
     ├──────────────────────────▶│
     │                           │
     │   { accessToken }         │
     │◀──────────────────────────┤
     │                           │
```

#### Using Authentication

**Login:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member",
    "organizationId": "org-uuid"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Authenticated Requests:**

```bash
curl -X GET http://localhost:3001/api/organizations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## REST API

Base URL: `http://localhost:3001/api`

All endpoints require authentication unless specified as **Public**.

### Authentication Endpoints

#### POST /auth/register

Register a new user.

**Request:**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123",
  "organizationId": "org-uuid" // optional
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member"
  }
}
```

---

#### POST /auth/login

Login user and receive tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member",
    "organizationId": "org-uuid"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "..."
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "..."
}
```

---

#### GET /auth/me

Get current authenticated user.

**Response:** `200 OK`

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member",
    "organizationId": "org-uuid"
  }
}
```

---

#### POST /auth/logout

Logout user (client-side token removal).

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

### Organization Endpoints

#### GET /organizations

Get all organizations for current user.

**Response:** `200 OK`

```json
{
  "organizations": [
    {
      "id": "org-uuid",
      "name": "My Company",
      "slug": "my-company",
      "logo_url": "https://...",
      "role": "owner",
      "joined_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /organizations/:id

Get organization by ID.

**Response:** `200 OK`

```json
{
  "organization": {
    "id": "org-uuid",
    "name": "My Company",
    "slug": "my-company",
    "logo_url": "https://...",
    "settings": {},
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### POST /organizations

Create new organization.

**Permissions**: Authenticated users

**Request:**

```json
{
  "name": "My Company",
  "slug": "my-company",
  "logo_url": "https://..." // optional
}
```

**Response:** `201 Created`

```json
{
  "organization": {
    "id": "org-uuid",
    "name": "My Company",
    "slug": "my-company",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### PATCH /organizations/:id

Update organization.

**Permissions**: Owner, Admin

**Request:**

```json
{
  "name": "Updated Company Name",
  "logo_url": "https://new-logo.png",
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Response:** `200 OK`

```json
{
  "organization": {
    "id": "org-uuid",
    "name": "Updated Company Name",
    "slug": "my-company",
    "logo_url": "https://new-logo.png",
    "settings": { ... },
    "updated_at": "2024-01-16T12:00:00Z"
  }
}
```

---

#### GET /organizations/:id/members

Get organization members.

**Response:** `200 OK`

```json
{
  "members": [
    {
      "id": "member-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://...",
      "role": "owner",
      "joined_at": "2024-01-15T10:00:00Z",
      "last_seen_at": "2024-01-20T14:30:00Z"
    }
  ]
}
```

---

#### POST /organizations/:id/members

Add member to organization.

**Permissions**: Owner, Admin

**Request:**

```json
{
  "userId": "user-uuid",
  "role": "member" // owner | admin | member | viewer
}
```

**Response:** `201 Created`

```json
{
  "member": {
    "id": "member-uuid",
    "organization_id": "org-uuid",
    "user_id": "user-uuid",
    "role": "member",
    "joined_at": "2024-01-20T10:00:00Z"
  }
}
```

---

#### PATCH /organizations/:id/members/:userId

Update member role.

**Permissions**: Owner, Admin

**Request:**

```json
{
  "role": "admin"
}
```

**Response:** `200 OK`

---

#### DELETE /organizations/:id/members/:userId

Remove member from organization.

**Permissions**: Owner, Admin

**Response:** `204 No Content`

---

### Integration Endpoints

#### GET /integrations

Get all integrations for organization.

**Response:** `200 OK`

```json
{
  "integrations": [
    {
      "id": "integration-uuid",
      "organization_id": "org-uuid",
      "service": "github",
      "status": "active",
      "metadata": {
        "repositories_count": 15
      },
      "last_sync_at": "2024-01-20T14:00:00Z",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /integrations/:service

Get specific integration.

**Parameters:**
- `service`: `github | vercel | figma | slack | twitter | linkedin`

**Response:** `200 OK`

```json
{
  "integration": {
    "id": "integration-uuid",
    "service": "github",
    "status": "active",
    "metadata": {},
    "last_sync_at": "2024-01-20T14:00:00Z"
  }
}
```

---

#### POST /integrations/:service/connect

Initiate OAuth flow for integration.

**Permissions**: Owner, Admin, Member

**Response:** `200 OK`

```json
{
  "message": "OAuth flow for github initiated",
  "service": "github"
}
```

---

#### DELETE /integrations/:service/disconnect

Disconnect integration.

**Permissions**: Owner, Admin, Member

**Response:** `204 No Content`

---

#### POST /integrations/:service/sync

Manually trigger sync for integration.

**Permissions**: Owner, Admin, Member

**Response:** `200 OK`

```json
{
  "message": "Sync triggered for github"
}
```

---

#### GET /integrations/:service/status

Get integration health status.

**Response:** `200 OK`

```json
{
  "service": "github",
  "status": "active",
  "lastSync": "2024-01-20T14:00:00Z"
}
```

---

### Webhook Endpoints

**All webhook endpoints are public** (signature verification required).

#### POST /webhooks/github/receive

GitHub webhook receiver.

**Headers:**
- `x-github-event`: Event type
- `x-hub-signature-256`: HMAC signature

**Verification**: HMAC SHA-256 with webhook secret

**Response:** `200 OK`

```
OK
```

---

#### POST /webhooks/vercel/receive

Vercel webhook receiver.

**Headers:**
- `x-vercel-signature`: Signature

**Response:** `200 OK`

```
OK
```

---

#### POST /webhooks/figma/receive

Figma webhook receiver.

**Request Body:**

```json
{
  "passcode": "secret",
  "event_type": "FILE_UPDATE",
  "file_key": "...",
  "file_name": "..."
}
```

**Response:** `200 OK`

```
OK
```

---

#### POST /webhooks/slack/events

Slack event subscription endpoint.

**URL Verification:**

```json
{
  "type": "url_verification",
  "challenge": "3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P"
}
```

**Response:**

```json
{
  "challenge": "3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P"
}
```

**Event:**

```json
{
  "type": "event_callback",
  "event": {
    "type": "app_mention",
    "user": "U123",
    "text": "@bot hello",
    "channel": "C123"
  }
}
```

---

#### POST /webhooks/slack/interactions

Slack interactive components endpoint.

**Request:** Form-encoded with `payload` field

---

## GraphQL API

Endpoint: `http://localhost:3001/graphql`

### Schema

Full GraphQL schema available at `/graphql` (GraphQL Playground in development).

### Queries

#### organization

Get organization by ID.

```graphql
query GetOrganization($id: ID!) {
  organization(id: $id) {
    id
    name
    slug
    logoUrl
    members {
      id
      user {
        id
        name
        email
      }
      role
      joinedAt
    }
    integrations {
      id
      service
      status
      lastSyncAt
    }
  }
}
```

---

#### organizations

Get all organizations for current user.

```graphql
query GetOrganizations {
  organizations {
    id
    name
    slug
    logoUrl
  }
}
```

---

#### integrations

Get all integrations for organization.

```graphql
query GetIntegrations {
  integrations {
    id
    service
    status
    metadata
    lastSyncAt
  }
}
```

---

#### events

Get events with filters.

```graphql
query GetEvents($filters: EventFilters) {
  events(filters: $filters) {
    id
    eventType
    eventSource
    actorType
    resourceType
    metadata
    createdAt
  }
}
```

**Variables:**

```json
{
  "filters": {
    "eventType": "deployment.created",
    "limit": 10,
    "offset": 0
  }
}
```

---

#### metrics

Get metrics by type.

```graphql
query GetMetrics($metricType: String!, $timeRange: String) {
  metrics(metricType: $metricType, timeRange: $timeRange) {
    id
    metricType
    value
    unit
    dimensions
    recordedAt
  }
}
```

**Variables:**

```json
{
  "metricType": "deployment_frequency",
  "timeRange": "7d"
}
```

---

### Mutations

#### createOrganization

Create new organization.

```graphql
mutation CreateOrganization($input: CreateOrganizationInput!) {
  createOrganization(input: $input) {
    id
    name
    slug
    createdAt
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "My Company",
    "slug": "my-company",
    "logoUrl": "https://..."
  }
}
```

---

#### updateOrganization

Update organization.

```graphql
mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
  updateOrganization(id: $id, input: $input) {
    id
    name
    logoUrl
    updatedAt
  }
}
```

---

#### addOrganizationMember

Add member to organization.

```graphql
mutation AddMember($organizationId: ID!, $userId: ID!, $role: MemberRole!) {
  addOrganizationMember(organizationId: $organizationId, userId: $userId, role: $role) {
    id
    user {
      name
      email
    }
    role
    joinedAt
  }
}
```

---

### Subscriptions

#### eventCreated

Subscribe to events for organization.

```graphql
subscription OnEventCreated($organizationId: ID!) {
  eventCreated(organizationId: $organizationId) {
    id
    eventType
    eventSource
    metadata
    createdAt
  }
}
```

---

#### deploymentStatusChanged

Subscribe to deployment status changes.

```graphql
subscription OnDeploymentStatusChanged($projectId: ID) {
  deploymentStatusChanged(projectId: $projectId) {
    id
    projectName
    state
    url
  }
}
```

---

#### pullRequestUpdated

Subscribe to pull request updates.

```graphql
subscription OnPRUpdated($repoId: ID) {
  pullRequestUpdated(repoId: $repoId) {
    id
    number
    title
    state
    reviewStatus
  }
}
```

---

#### agentTaskCreated

Subscribe to agent task creation.

```graphql
subscription OnAgentTaskCreated($agentId: ID) {
  agentTaskCreated(agentId: $agentId) {
    id
    taskType
    status
    priority
    requiresApproval
  }
}
```

---

## WebSocket API

Endpoint: `ws://localhost:3001`

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

### Subscribing to Channels

```javascript
// Subscribe to deployments
socket.emit('subscribe', { channel: 'deployments' });

// Subscribe to pull requests for specific repo
socket.emit('subscribe', { 
  channel: 'pull_requests',
  filters: { repoId: 'repo-uuid' }
});

// Subscribe to agent tasks
socket.emit('subscribe', { channel: 'agent_tasks' });

// Subscribe to all events
socket.emit('subscribe', { channel: 'events' });
```

### Listening for Events

```javascript
// Deployment events
socket.on('deployment.created', (deployment) => {
  console.log('Deployment created:', deployment);
});

socket.on('deployment.ready', (deployment) => {
  console.log('Deployment ready:', deployment);
});

socket.on('deployment.error', (deployment) => {
  console.error('Deployment failed:', deployment);
});

// Pull request events
socket.on('pull_request.opened', (pr) => {
  console.log('PR opened:', pr);
});

socket.on('pull_request.reviewed', (pr) => {
  console.log('PR reviewed:', pr);
});

// Agent task events
socket.on('agent_task.started', (task) => {
  console.log('Task started:', task);
});

socket.on('agent_task.completed', (task) => {
  console.log('Task completed:', task);
});

socket.on('agent_task.needs_approval', (task) => {
  console.log('Task needs approval:', task);
});

// Generic events
socket.on('event.created', (event) => {
  console.log('Event:', event);
});
```

### Unsubscribing

```javascript
socket.emit('unsubscribe', { channel: 'deployments' });
```

---

## Event Bus

Internal event bus using Redis pub/sub for inter-service communication.

### Publishing Events

```javascript
const eventBus = require('./events/eventBus');

await eventBus.publish('deployment.created', {
  deploymentId: 'deploy-123',
  projectName: 'my-app',
  url: 'https://my-app-xyz.vercel.app'
});
```

### Subscribing to Events

```javascript
await eventBus.subscribe('deployment.created', async (data, meta) => {
  console.log('Event type:', meta.eventType);
  console.log('Timestamp:', meta.timestamp);
  console.log('Data:', data);
  
  // Handle event
  await handleDeploymentCreated(data);
});
```

### Event Types

**GitHub Events:**
- `github.pull_request`
- `github.push`
- `github.issues`
- `github.deployment`

**Vercel Events:**
- `vercel.deployment.created`
- `vercel.deployment.ready`
- `vercel.deployment.error`

**Agent Events:**
- `agent.task.started`
- `agent.task.completed`
- `agent.task.needs_approval`

**Generic Events:**
- `event.created`

---

## Error Handling

All errors return consistent JSON format:

### Error Response Format

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "stack": "..." // Only in development mode
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Validation Errors

```json
{
  "error": "Validation Error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "not-an-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": "short"
    }
  ]
}
```

---

## Rate Limiting

### Standard Rate Limit

- **Window**: 15 minutes
- **Max Requests**: 100
- **Applies to**: All `/api/*` endpoints

### Strict Rate Limit (Authentication)

- **Window**: 15 minutes
- **Max Requests**: 5
- **Applies to**: `/api/auth/login`, `/api/auth/register`

### Webhook Rate Limit

- **Window**: 1 minute
- **Max Requests**: 100
- **Applies to**: All `/api/webhooks/*` endpoints

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1674567890
```

### Rate Limit Exceeded

**Response:** `429 Too Many Requests`

```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Security

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control (RBAC)**: Owner > Admin > Member > Viewer
- **Password Hashing**: bcrypt with salt rounds = 10

### Data Protection

- **Encryption**: AES-256 for OAuth tokens and API keys
- **HTTPS**: TLS 1.3 in production
- **CORS**: Restricted to allowed origins
- **Helmet**: HTTP security headers

### Webhook Security

- **GitHub**: HMAC SHA-256 signature verification
- **Vercel**: Signature verification
- **Figma**: Passcode verification
- **Slack**: Timestamp + signature verification

### Input Validation

- **express-validator**: All user inputs validated
- **SQL Injection**: Prevented via parameterized queries
- **XSS**: Prevented via input sanitization

---

## Summary

The CompanyOS backend provides:

✅ **Complete REST API** with JWT authentication  
✅ **GraphQL API** with queries, mutations, and subscriptions  
✅ **Real-time WebSocket server** with channel subscriptions  
✅ **Event-driven architecture** with Redis pub/sub  
✅ **Webhook receivers** for GitHub, Vercel, Figma, Slack  
✅ **Role-based access control** (Owner, Admin, Member, Viewer)  
✅ **Rate limiting** with Redis backing  
✅ **Comprehensive error handling** and validation  
✅ **Security best practices** (encryption, CORS, Helmet)  

**Next Steps:**
1. Set up PostgreSQL database (see `ARCHITECTURE.md` for schema)
2. Configure environment variables (`.env`)
3. Install dependencies (`npm install`)
4. Run server (`npm run dev`)
5. Test endpoints via Postman or GraphQL Playground

For integration details, see `INTEGRATIONS.md`.  
For architecture details, see `ARCHITECTURE.md`.

---

*Built with ❤️ for CompanyOS*
