# CompanyOS Backend API

CompanyOS backend is a **microservices-inspired monolith** built with Node.js, Express, Apollo GraphQL, and Socket.io. It provides a comprehensive API for managing organizations, integrations, and agent-driven workflows.

## 🏗️ Architecture

- **REST API**: Express.js with JWT authentication
- **GraphQL API**: Apollo Server with subscriptions
- **WebSocket Server**: Socket.io for real-time updates
- **Event Bus**: Redis pub/sub for event-driven architecture
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and data caching

## 📦 Tech Stack

- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **GraphQL**: Apollo Server
- **WebSocket**: Socket.io
- **Database**: PostgreSQL
- **Cache/PubSub**: Redis (ioredis)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt, rate limiting
- **Logging**: Winston

## 🚀 Getting Started

### Prerequisites

- Node.js v20 or higher
- PostgreSQL 16
- Redis 7

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Database Setup

Create PostgreSQL database and run migrations (see `ARCHITECTURE.md` for schema):

```bash
# Create database
createdb companyos

# Run migrations (schema in ARCHITECTURE.md)
psql companyos < migrations/schema.sql
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## 📡 API Endpoints

### REST API

Base URL: `http://localhost:3001/api`

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user

#### Organizations

- `GET /organizations` - Get user's organizations
- `GET /organizations/:id` - Get organization by ID
- `POST /organizations` - Create organization
- `PATCH /organizations/:id` - Update organization
- `GET /organizations/:id/members` - Get members
- `POST /organizations/:id/members` - Add member
- `PATCH /organizations/:id/members/:userId` - Update member role
- `DELETE /organizations/:id/members/:userId` - Remove member

#### Integrations

- `GET /integrations` - Get all integrations
- `GET /integrations/:service` - Get specific integration
- `POST /integrations/:service/connect` - Connect integration
- `DELETE /integrations/:service/disconnect` - Disconnect integration
- `POST /integrations/:service/sync` - Trigger sync
- `GET /integrations/:service/status` - Get integration status

#### Webhooks

- `POST /webhooks/github/receive` - GitHub webhook receiver
- `POST /webhooks/vercel/receive` - Vercel webhook receiver
- `POST /webhooks/figma/receive` - Figma webhook receiver
- `POST /webhooks/slack/events` - Slack event subscriptions
- `POST /webhooks/slack/interactions` - Slack interactive components

### GraphQL API

Endpoint: `http://localhost:3001/graphql`

See GraphQL schema in `src/graphql/typeDefs/index.js`

**Example Queries:**

```graphql
query GetOrganization {
  organization(id: "org-id") {
    id
    name
    members {
      user {
        name
        email
      }
      role
    }
    integrations {
      service
      status
    }
  }
}

query GetEvents {
  events(filters: { eventType: "deployment.created", limit: 10 }) {
    id
    eventType
    eventSource
    metadata
    createdAt
  }
}
```

**Example Mutations:**

```graphql
mutation CreateOrganization {
  createOrganization(input: {
    name: "My Company"
    slug: "my-company"
  }) {
    id
    name
    slug
  }
}
```

**Example Subscriptions:**

```graphql
subscription OnEventCreated {
  eventCreated(organizationId: "org-id") {
    id
    eventType
    metadata
  }
}
```

### WebSocket Events

Connect to `ws://localhost:3001` with authentication token:

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

// Subscribe to channels
socket.emit('subscribe', { channel: 'deployments' });
socket.emit('subscribe', { channel: 'pull_requests', filters: { repoId: 'repo-123' } });
socket.emit('subscribe', { channel: 'agent_tasks' });

// Listen for events
socket.on('deployment.created', (deployment) => {
  console.log('New deployment:', deployment);
});

socket.on('deployment.ready', (deployment) => {
  console.log('Deployment ready:', deployment);
});

socket.on('pull_request.updated', (pr) => {
  console.log('PR updated:', pr);
});

socket.on('agent_task.needs_approval', (task) => {
  console.log('Task needs approval:', task);
});
```

## 🔐 Authentication

JWT-based authentication with access and refresh tokens.

**Login Flow:**

1. POST `/api/auth/login` with email/password
2. Receive `accessToken` (15min expiry) and `refreshToken` (7 days)
3. Include `Authorization: Bearer <accessToken>` in requests
4. Refresh token using `/api/auth/refresh` when expired

## 🎯 Event Bus

Event-driven architecture using Redis pub/sub:

```javascript
const eventBus = require('./events/eventBus');

// Publish event
await eventBus.publish('deployment.created', {
  deploymentId: '123',
  projectName: 'my-app'
});

// Subscribe to event
await eventBus.subscribe('deployment.created', async (data) => {
  console.log('Deployment created:', data);
  // Handle event
});
```

## 🔧 Configuration

All configuration in `src/config/index.js` loaded from environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - Data encryption key (32 chars)

See `.env.example` for full list.

## 📊 Logging

Winston logger with levels:

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages (dev only)

Logs written to:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs
- Console (development mode)

## 🛡️ Security

- **Helmet** - HTTP header security
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Redis-backed rate limiting
- **JWT** - Stateless authentication
- **bcrypt** - Password hashing
- **Encryption** - AES-256 for sensitive data

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # PostgreSQL setup
│   │   ├── redis.js         # Redis setup
│   │   └── index.js         # Main config
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication
│   │   ├── cors.js          # CORS config
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Error handling
│   ├── routes/              # REST API routes
│   │   ├── auth.js
│   │   ├── organizations.js
│   │   ├── integrations.js
│   │   ├── webhooks.js
│   │   └── index.js
│   ├── services/            # Business logic
│   │   ├── auth.service.js
│   │   ├── organization.service.js
│   │   ├── integration.service.js
│   │   └── event.service.js
│   ├── graphql/             # GraphQL server
│   │   ├── typeDefs/        # Schema definitions
│   │   └── resolvers/       # Resolvers
│   ├── websocket/           # WebSocket server
│   │   ├── server.js
│   │   └── handlers.js
│   ├── events/              # Event bus
│   │   ├── eventBus.js
│   │   └── handlers/        # Event handlers
│   ├── utils/               # Utilities
│   │   ├── logger.js
│   │   ├── encryption.js
│   │   └── jwt.js
│   ├── app.js               # Express app
│   └── server.js            # Server entry point
├── logs/                    # Log files
├── package.json
├── .env.example
└── README.md
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📝 License

MIT
