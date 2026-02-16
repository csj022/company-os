# CompanyOS Database Layer

Complete database implementation for CompanyOS using PostgreSQL, Prisma ORM, and Redis.

## 📁 Structure

```
company-os/
├── prisma/
│   ├── schema.prisma          # Complete database schema (14 models)
│   ├── seed.ts                # Sample data seeding script
│   └── migrations/            # Database migrations (auto-generated)
├── config/
│   └── redis.config.ts        # Redis configuration & utilities
├── scripts/
│   ├── setup-database.sh      # Automated setup script
│   ├── init-db.sql           # PostgreSQL initialization
│   └── pgadmin-servers.json  # pgAdmin auto-configuration
├── docker-compose.yml         # PostgreSQL + Redis + Tools
├── .env.example              # Environment template
├── DATABASE_SETUP.md         # Detailed setup guide
├── DATABASE_QUICK_REFERENCE.md  # Quick command reference
└── DATABASE_DEPENDENCIES.md  # npm packages & versions
```

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
./scripts/setup-database.sh
```

This script will:
- ✅ Check prerequisites (Node.js, PostgreSQL, Redis)
- ✅ Install dependencies
- ✅ Create environment file
- ✅ Start Docker services (if using Docker)
- ✅ Test database connections
- ✅ Generate Prisma client
- ✅ Run migrations
- ✅ Seed sample data

### Option 2: Manual Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your credentials
nano .env

# 3. Start Docker services (or use local PostgreSQL/Redis)
docker-compose up -d

# 4. Install dependencies
npm install

# 5. Generate Prisma client
npx prisma generate

# 6. Run migrations
npx prisma migrate dev --name init

# 7. Seed database
npx prisma db seed

# 8. Open Prisma Studio (optional)
npx prisma studio
```

---

## 📊 Database Schema

### Overview

14 models across 6 categories:

#### Core Tables
- **users** - User accounts (3 sample users)
- **organizations** - Workspaces (1 sample org)
- **organization_members** - User-org relationships

#### Integration Tables
- **integrations** - Third-party connections (GitHub, Vercel, Figma, Slack, Twitter)
- **webhooks** - Webhook configurations

#### Development Tables
- **repositories** - GitHub repos (2 sample repos)
- **pull_requests** - PR tracking (3 sample PRs)
- **deployments** - Vercel deployments (3 sample deployments)

#### Design Tables
- **figma_files** - Design files (2 sample files)
- **design_components** - Component library (3 sample components)

#### Social Tables
- **social_accounts** - Social media accounts (Twitter, LinkedIn)
- **social_posts** - Post scheduling (4 sample posts)

#### Agent Tables
- **agents** - AI agents (4 sample agents)
- **agent_tasks** - Task queue (4 sample tasks)
- **agent_collaborations** - Multi-agent coordination

#### Analytics Tables
- **events** - Event stream (5 sample events)
- **metrics** - Time-series metrics (5 sample metrics)

### Key Features

- ✅ UUID primary keys
- ✅ Automatic timestamps (`created_at`, `updated_at`)
- ✅ JSONB fields for flexible metadata
- ✅ Optimized indexes
- ✅ Foreign keys with cascade deletes
- ✅ Type-safe Prisma client

---

## 🔧 Common Operations

### Development Workflow

```bash
# 1. Modify prisma/schema.prisma
# (add/change models)

# 2. Create migration
npx prisma migrate dev --name add_feature

# 3. Generate client
npx prisma generate

# 4. Use in code
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

### Database Management

```bash
# View database in GUI
npx prisma studio

# Reset database (⚠️  deletes all data!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Redis Operations

```bash
# Test Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli MONITOR

# View all keys (dev only!)
redis-cli KEYS "*"

# Clear all cache (⚠️  use carefully!)
redis-cli FLUSHALL
```

---

## 🐳 Docker Services

### Start Services

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Start with GUI tools (pgAdmin + RedisInsight)
docker-compose --profile tools up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | User: `companyos`, Password: `companyos_dev_password` |
| Redis | `localhost:6379` | No password (dev mode) |
| pgAdmin | http://localhost:5050 | Email: `admin@companyos.dev`, Password: `admin` |
| RedisInsight | http://localhost:5540 | No login required |
| Prisma Studio | http://localhost:5555 | Run `npx prisma studio` |

---

## 📚 Documentation

### Full Guides

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete setup instructions, troubleshooting, production deployment
- **[DATABASE_QUICK_REFERENCE.md](./DATABASE_QUICK_REFERENCE.md)** - Fast command lookup, code examples, SQL queries
- **[DATABASE_DEPENDENCIES.md](./DATABASE_DEPENDENCIES.md)** - npm packages, versions, installation

### Architecture

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system architecture, database design rationale

---

## 🛠️ Configuration

### Environment Variables

Key variables in `.env`:

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Application
NODE_ENV=development
```

See `.env.example` for complete template.

### Prisma Schema

Located at `prisma/schema.prisma`. Key sections:

```prisma
// Database connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Client generation
generator client {
  provider = "prisma-client-js"
}

// Models (14 total)
model User { ... }
model Organization { ... }
// ... etc
```

### Redis Configuration

Located at `config/redis.config.ts`. Features:

- ✅ Connection pooling
- ✅ Pub/Sub channels
- ✅ Cache layers (L1-L4)
- ✅ Distributed locks
- ✅ Helper functions

---

## 📦 Sample Data

The seed script (`prisma/seed.ts`) creates:

- **3 users**: Alice (admin), Bob (member), Charlie (member)
- **1 organization**: Acme Corp
- **5 integrations**: GitHub, Vercel, Figma, Slack, Twitter
- **2 repositories**: acme-frontend, acme-backend
- **3 pull requests**: Various states (open, merged)
- **3 deployments**: Production and preview
- **2 Figma files**: Design system + mockups
- **3 design components**: Button, Input, Card
- **2 social accounts**: Twitter + LinkedIn
- **4 social posts**: Published, scheduled, draft
- **4 agents**: Code Review, Deployment, Content, Analytics
- **4 agent tasks**: Various states
- **5 events**: Deployment, PR, agent activities
- **5 metrics**: Performance indicators

Perfect for development and testing!

---

## 🔐 Security

### Development

- Default passwords are **NOT secure**
- Only use on local machine
- Do not expose ports publicly

### Production

- ✅ Use strong passwords
- ✅ Enable SSL/TLS for PostgreSQL
- ✅ Enable TLS for Redis
- ✅ Use environment-specific `.env` files
- ✅ Enable connection pooling (PgBouncer)
- ✅ Configure backups
- ✅ Monitor with Datadog/Sentry
- ✅ Use secrets management (Vault)

See [DATABASE_SETUP.md](./DATABASE_SETUP.md#production-deployment-checklist) for full checklist.

---

## 🚨 Troubleshooting

### Common Issues

**Can't connect to PostgreSQL**
```bash
# Check if running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Can't connect to Redis**
```bash
# Test connection
redis-cli ping

# View logs
docker-compose logs redis
```

**Prisma migration failed**
```bash
# Check status
npx prisma migrate status

# Reset (⚠️  deletes data!)
npx prisma migrate reset
```

**Seed script errors**
```bash
# Clear database and re-seed
npx prisma migrate reset --skip-generate --skip-seed
npx prisma db seed
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md#troubleshooting) for detailed troubleshooting.

---

## 🧪 Testing

### Database Testing

```typescript
// tests/db.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database', () => {
  test('create user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    
    expect(user.email).toBe('test@example.com');
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

### Redis Testing

```typescript
// tests/redis.test.ts
import { redisClient, getCache, setCache } from '../config/redis.config';

describe('Redis', () => {
  test('cache operations', async () => {
    await setCache('test:key', { value: 123 }, 60);
    const result = await getCache('test:key');
    
    expect(result).toEqual({ value: 123 });
  });
  
  afterAll(async () => {
    await redisClient.quit();
  });
});
```

---

## 📈 Performance

### Indexes

All tables have optimized indexes for:
- Primary keys (UUID)
- Foreign keys
- Common query patterns (email, slug, status, timestamps)
- Full-text search fields

### Caching Strategy

Redis cache layers (configured in `redis.config.ts`):

| Layer | TTL | Purpose |
|-------|-----|---------|
| L1 | 24h | User sessions |
| L2 | 5min | API responses |
| L3 | 1h | Agent results |
| L4 | 15min | Analytics |

### Connection Pooling

Recommended settings:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
```

---

## 🔄 Migration Strategy

### Development

```bash
# Create migration
npx prisma migrate dev --name description

# Reset if needed
npx prisma migrate reset
```

### Production

```bash
# Generate migration (don't apply)
npx prisma migrate dev --create-only

# Review generated SQL
cat prisma/migrations/*/migration.sql

# Deploy to production
npx prisma migrate deploy
```

---

## 📞 Support

Need help?

1. Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) and [DATABASE_QUICK_REFERENCE.md](./DATABASE_QUICK_REFERENCE.md)
2. Review logs: `docker-compose logs`
3. Test connections: `./scripts/setup-database.sh` (re-run)
4. Open issue in repository

---

## ✅ Checklist

Before starting development:

- [ ] Docker installed (or local PostgreSQL + Redis)
- [ ] Node.js 20+ installed
- [ ] `.env` file configured
- [ ] `npm install` completed
- [ ] Migrations applied (`npx prisma migrate dev`)
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Prisma Studio works (`npx prisma studio`)
- [ ] Redis connection tested (`redis-cli ping`)

Before deploying to production:

- [ ] Review [DATABASE_SETUP.md](./DATABASE_SETUP.md#production-deployment-checklist)
- [ ] Strong passwords configured
- [ ] SSL/TLS enabled
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Connection pooling configured
- [ ] Migrations tested
- [ ] Performance optimized

---

## 🎯 Next Steps

1. **Run setup**: `./scripts/setup-database.sh`
2. **Explore data**: `npx prisma studio`
3. **Read architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Start coding**: Import `@prisma/client` and build!

---

**Ready to build! 🚀**
