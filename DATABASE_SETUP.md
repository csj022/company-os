# Database Setup Guide

Complete setup instructions for the CompanyOS database layer using PostgreSQL, Prisma ORM, and Redis.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [PostgreSQL Setup](#postgresql-setup)
- [Redis Setup](#redis-setup)
- [Prisma Configuration](#prisma-configuration)
- [Running Migrations](#running-migrations)
- [Seeding the Database](#seeding-the-database)
- [Database Schema Overview](#database-schema-overview)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v20+ (LTS)
- **PostgreSQL**: 16+
- **Redis**: 7+
- **npm** or **pnpm**: Latest version

### Install Dependencies

```bash
npm install
# or
pnpm install
```

Required packages:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI (dev dependency)
- `ioredis` - Redis client
- `typescript` - TypeScript support
- `ts-node` - TypeScript execution

---

## PostgreSQL Setup

### Option 1: Local Installation

#### macOS (Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb companyos_dev
```

#### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb companyos_dev
```

#### Windows

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow instructions
3. Use pgAdmin or command line to create database

### Option 2: Docker

```bash
# Run PostgreSQL in Docker
docker run -d \
  --name companyos-postgres \
  -e POSTGRES_DB=companyos_dev \
  -e POSTGRES_USER=companyos \
  -e POSTGRES_PASSWORD=companyos_dev_password \
  -p 5432:5432 \
  postgres:16-alpine
```

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: companyos-postgres
    environment:
      POSTGRES_DB: companyos_dev
      POSTGRES_USER: companyos
      POSTGRES_PASSWORD: companyos_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U companyos"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: companyos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Start services:

```bash
docker-compose up -d
```

---

## Redis Setup

### Option 1: Local Installation

#### macOS (Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis
```

#### Ubuntu/Debian

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis
sudo systemctl enable redis
```

### Option 2: Docker (see Docker Compose above)

### Verify Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

---

## Prisma Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL Connection
DATABASE_URL="postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev?schema=public"

# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Application
NODE_ENV=development
```

**For Production:**

```env
# PostgreSQL Connection (use connection pooling)
DATABASE_URL="postgresql://user:password@host:5432/companyos_prod?schema=public&connection_limit=10&pool_timeout=10"

# Redis Connection (with TLS)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6380
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
REDIS_TLS=true

# Application
NODE_ENV=production
```

### 2. Prisma Client Generation

Generate the Prisma client:

```bash
npx prisma generate
```

This creates type-safe database client in `node_modules/@prisma/client`.

---

## Running Migrations

### Development Environment

#### 1. Create Initial Migration

```bash
npx prisma migrate dev --name init
```

This will:
- Create migration files in `prisma/migrations/`
- Apply migration to database
- Generate Prisma client

#### 2. Subsequent Migrations

After modifying `schema.prisma`:

```bash
npx prisma migrate dev --name <migration_name>

# Examples:
npx prisma migrate dev --name add_user_preferences
npx prisma migrate dev --name update_agent_schema
```

### Production Environment

#### 1. Generate Migration (without applying)

```bash
npx prisma migrate dev --create-only --name <migration_name>
```

#### 2. Review Generated SQL

Check the migration file in `prisma/migrations/`:

```bash
cat prisma/migrations/<timestamp>_<migration_name>/migration.sql
```

#### 3. Deploy to Production

```bash
npx prisma migrate deploy
```

This applies all pending migrations without prompts.

### Reset Database (Development Only!)

**⚠️ WARNING: This deletes all data!**

```bash
npx prisma migrate reset
```

This will:
- Drop database
- Recreate database
- Apply all migrations
- Run seed script (if configured)

---

## Seeding the Database

### 1. Configure Seed Script

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 2. Run Seed Script

```bash
npx prisma db seed
```

This creates sample data:
- 3 users (Alice, Bob, Charlie)
- 1 organization (Acme Corp)
- 5 integrations (GitHub, Vercel, Figma, Slack, Twitter)
- 2 repositories with pull requests
- 3 deployments
- 2 Figma files with components
- 2 social accounts with posts
- 4 agents with tasks
- Events and metrics

### 3. Custom Seed Data

Edit `prisma/seed.ts` to customize sample data for your needs.

---

## Database Schema Overview

### Core Tables

- **users** - User accounts and authentication
- **organizations** - Company/team workspaces
- **organization_members** - User-organization relationships

### Integration Tables

- **integrations** - Third-party service connections (GitHub, Vercel, etc.)
- **webhooks** - Webhook configurations for event notifications

### Development Tables

- **repositories** - GitHub repository metadata
- **pull_requests** - Pull request tracking and agent reviews
- **deployments** - Vercel deployment monitoring

### Design Tables

- **figma_files** - Figma design file metadata
- **design_components** - Component tracking and code generation

### Social Tables

- **social_accounts** - Twitter/LinkedIn account connections
- **social_posts** - Post scheduling and engagement tracking

### Agent Tables

- **agents** - AI agent configurations and status
- **agent_tasks** - Task queue and execution history
- **agent_collaborations** - Multi-agent coordination

### Analytics Tables

- **events** - Event stream for all system activities
- **metrics** - Time-series metrics and KPIs

### Key Features

- **UUID Primary Keys** - All tables use UUID for scalability
- **JSONB Fields** - Flexible metadata storage
- **Timestamps** - Automatic `created_at` and `updated_at`
- **Indexes** - Optimized for common query patterns
- **Foreign Keys** - Referential integrity with cascade deletes
- **Soft Deletes** - None (use cascade deletes instead)

---

## Common Operations

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Opens browser GUI at http://localhost:5555 to view and edit data.

### Database Introspection

Generate Prisma schema from existing database:

```bash
npx prisma db pull
```

### Format Schema

```bash
npx prisma format
```

### Validate Schema

```bash
npx prisma validate
```

### Check Migration Status

```bash
npx prisma migrate status
```

---

## Redis Usage Examples

### Basic Cache Operations

```typescript
import { getCache, setCache, cacheKey, CACHE_TTL } from './config/redis.config';

// Get from cache
const user = await getCache<User>(cacheKey('API', 'user', userId));

// Set to cache with TTL
await setCache(cacheKey('API', 'user', userId), userData, CACHE_TTL.API_RESPONSE);

// Delete from cache
await deleteCache(cacheKey('API', 'user', userId));
```

### Pub/Sub Events

```typescript
import { publishEvent, subscribeChannel, PUBSUB_CHANNELS } from './config/redis.config';

// Publish event
await publishEvent(PUBSUB_CHANNELS.DEPLOYMENT_READY, {
  deploymentId: 'dpl_123',
  url: 'https://example.com',
  healthScore: 95,
});

// Subscribe to events
await subscribeChannel(PUBSUB_CHANNELS.DEPLOYMENT_READY, (data) => {
  console.log('Deployment ready:', data);
  // Send notification, update UI, etc.
});
```

### Distributed Locks

```typescript
import { acquireLock, releaseLock } from './config/redis.config';

// Acquire lock
const locked = await acquireLock('deployment:deploy-123', 30); // 30s TTL

if (locked) {
  try {
    // Critical section - only one process can execute
    await performDeployment();
  } finally {
    // Always release lock
    await releaseLock('deployment:deploy-123');
  }
}
```

---

## Database Connection Pooling

### Prisma Configuration

In `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}
```

### Connection String Parameters

```
postgresql://user:password@host:5432/database?schema=public&connection_limit=10&pool_timeout=10&connect_timeout=10
```

Parameters:
- `connection_limit` - Max connections in pool (default: 10)
- `pool_timeout` - Connection acquisition timeout in seconds
- `connect_timeout` - Initial connection timeout in seconds

### Production Best Practices

1. **Use Connection Pooling**: PgBouncer or AWS RDS Proxy
2. **Limit Connections**: Set `connection_limit` based on available connections
3. **Read Replicas**: Configure for analytics/reporting queries
4. **Monitoring**: Track connection pool saturation

---

## Troubleshooting

### Migration Errors

**Issue**: Migration fails with "relation already exists"

**Solution**:
```bash
# Option 1: Reset (development only)
npx prisma migrate reset

# Option 2: Mark as applied
npx prisma migrate resolve --applied <migration_name>
```

### Connection Issues

**Issue**: "Can't reach database server"

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` in `.env`
3. Verify firewall/network settings
4. Check PostgreSQL logs

**Issue**: Redis connection timeout

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Verify Redis password if set

### Performance Issues

**Issue**: Slow queries

**Solution**:
1. Check query execution plan: `EXPLAIN ANALYZE <query>`
2. Add appropriate indexes
3. Use Prisma's query optimization features
4. Enable connection pooling

**Issue**: High memory usage

**Solution**:
1. Reduce `connection_limit` in DATABASE_URL
2. Use pagination for large datasets
3. Optimize JSONB queries
4. Consider read replicas for heavy reads

### Data Integrity

**Issue**: Orphaned records after deletion

**Solution**:
- Ensure foreign keys have `onDelete: Cascade` in schema
- Run cleanup script if needed

```sql
-- Example: Find orphaned records
SELECT * FROM agent_tasks 
WHERE agent_id NOT IN (SELECT id FROM agents);
```

---

## Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection pooling enabled
- [ ] SSL/TLS enabled for database connection
- [ ] Redis password set and TLS enabled
- [ ] All migrations applied (`npx prisma migrate deploy`)
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Connection limits tuned for workload
- [ ] Read replicas configured (if needed)
- [ ] Indexes optimized for production queries

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [CompanyOS Architecture](./ARCHITECTURE.md)

---

## Support

For issues or questions:
1. Check this guide and ARCHITECTURE.md
2. Review Prisma logs: `DEBUG="*" npx prisma migrate dev`
3. Check PostgreSQL logs
4. Check Redis logs: `redis-cli monitor`

**Need help?** Open an issue in the project repository.
