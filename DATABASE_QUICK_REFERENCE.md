# Database Quick Reference

Fast lookup guide for common database operations in CompanyOS.

---

## 🚀 Quick Start

```bash
# One-command setup
./scripts/setup-database.sh

# Manual setup
cp .env.example .env          # Configure environment
npm install                   # Install dependencies
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations
npx prisma db seed          # Seed with sample data
```

---

## 📝 Common Commands

### Prisma CLI

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev --name <migration_name>

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (⚠️  deletes all data!)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Check migration status
npx prisma migrate status

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Seed database
npx prisma db seed

# Pull schema from database
npx prisma db pull

# Push schema to database (without migrations)
npx prisma db push
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name add_user_settings

# Apply pending migrations
npx prisma migrate deploy

# Mark migration as applied (without running)
npx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 💻 Code Examples

### Prisma Client Usage

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    role: 'member',
  },
});

// Find one
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Find many with filters
const users = await prisma.user.findMany({
  where: {
    role: 'admin',
    createdAt: {
      gte: new Date('2024-01-01'),
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Update
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' },
});

// Delete
await prisma.user.delete({
  where: { id: userId },
});

// Count
const count = await prisma.user.count({
  where: { role: 'admin' },
});

// Relations
const org = await prisma.organization.findUnique({
  where: { slug: 'acme-corp' },
  include: {
    members: true,
    agents: true,
  },
});

// Transactions
await prisma.$transaction([
  prisma.user.create({ data: { ... } }),
  prisma.organization.update({ where: { ... }, data: { ... } }),
]);

// Raw SQL
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// Cleanup
await prisma.$disconnect();
```

### Redis Operations

```typescript
import {
  redisClient,
  getCache,
  setCache,
  deleteCache,
  cacheKey,
  CACHE_TTL,
  publishEvent,
  subscribeChannel,
  PUBSUB_CHANNELS,
} from './config/redis.config';

// Cache operations
const user = await getCache<User>(cacheKey('API', 'user', userId));

await setCache(
  cacheKey('API', 'user', userId),
  userData,
  CACHE_TTL.API_RESPONSE
);

await deleteCache(cacheKey('API', 'user', userId));

// Pub/Sub
await publishEvent(PUBSUB_CHANNELS.DEPLOYMENT_READY, {
  deploymentId: 'xyz',
  url: 'https://example.com',
});

await subscribeChannel(PUBSUB_CHANNELS.DEPLOYMENT_READY, (data) => {
  console.log('Deployment ready:', data);
});

// Low-level operations
await redisClient.set('key', 'value', 'EX', 3600);
const value = await redisClient.get('key');
await redisClient.del('key');

// Counters
await redisClient.incr('page:views');
const views = await redisClient.get('page:views');

// Lists
await redisClient.lpush('notifications', JSON.stringify(notification));
const items = await redisClient.lrange('notifications', 0, 9);

// Sets
await redisClient.sadd('online:users', userId);
const isOnline = await redisClient.sismember('online:users', userId);

// Hashes
await redisClient.hset('user:123', 'name', 'John');
const name = await redisClient.hget('user:123', 'name');

// Cleanup
await redisClient.quit();
```

---

## 🔍 Query Patterns

### Filtering

```typescript
// Equals
where: { email: 'user@example.com' }

// Not equals
where: { role: { not: 'admin' } }

// In array
where: { status: { in: ['active', 'pending'] } }

// Not in array
where: { status: { notIn: ['deleted', 'banned'] } }

// Contains (case-sensitive)
where: { name: { contains: 'John' } }

// Case-insensitive contains
where: { email: { contains: 'gmail', mode: 'insensitive' } }

// Starts with
where: { name: { startsWith: 'A' } }

// Ends with
where: { email: { endsWith: '@company.com' } }

// Greater than
where: { createdAt: { gt: new Date('2024-01-01') } }

// Greater than or equal
where: { createdAt: { gte: new Date('2024-01-01') } }

// Less than
where: { age: { lt: 18 } }

// Between
where: {
  createdAt: {
    gte: new Date('2024-01-01'),
    lte: new Date('2024-12-31'),
  }
}

// AND
where: {
  AND: [
    { role: 'admin' },
    { status: 'active' }
  ]
}

// OR
where: {
  OR: [
    { email: { contains: '@company.com' } },
    { role: 'admin' }
  ]
}

// NOT
where: {
  NOT: { status: 'deleted' }
}

// Relation filters
where: {
  organization: {
    slug: 'acme-corp'
  }
}

// Some (at least one)
where: {
  members: {
    some: {
      role: 'owner'
    }
  }
}

// Every (all)
where: {
  agents: {
    every: {
      status: 'active'
    }
  }
}

// None
where: {
  tasks: {
    none: {
      status: 'failed'
    }
  }
}
```

### Sorting

```typescript
// Single field
orderBy: { createdAt: 'desc' }

// Multiple fields
orderBy: [
  { priority: 'desc' },
  { createdAt: 'desc' }
]

// Relation field
orderBy: {
  organization: {
    name: 'asc'
  }
}
```

### Pagination

```typescript
// Offset-based
const users = await prisma.user.findMany({
  skip: 20,
  take: 10,  // page 3 (0-indexed)
});

// Cursor-based
const users = await prisma.user.findMany({
  cursor: { id: lastId },
  take: 10,
  skip: 1,  // Skip the cursor
});
```

### Aggregation

```typescript
// Count
const count = await prisma.user.count();

// Sum
const total = await prisma.metric.aggregate({
  _sum: { value: true },
  where: { metricType: 'revenue' }
});

// Average
const avg = await prisma.metric.aggregate({
  _avg: { value: true }
});

// Min/Max
const stats = await prisma.deployment.aggregate({
  _min: { createdAt: true },
  _max: { createdAt: true }
});

// Group by
const results = await prisma.event.groupBy({
  by: ['eventType'],
  _count: true,
  where: {
    createdAt: { gte: new Date('2024-01-01') }
  }
});
```

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart postgres

# Execute command in container
docker-compose exec postgres psql -U companyos -d companyos_dev

# Check service health
docker-compose ps

# Rebuild and start
docker-compose up -d --build

# Remove volumes (⚠️  deletes data!)
docker-compose down -v
```

---

## 🔧 PostgreSQL Commands

```bash
# Connect to database
psql -U companyos -d companyos_dev

# List databases
\l

# Connect to database
\c companyos_dev

# List tables
\dt

# Describe table
\d users

# List indexes
\di

# Run SQL file
\i /path/to/file.sql

# Export query to CSV
\copy (SELECT * FROM users) TO '/tmp/users.csv' CSV HEADER

# Exit
\q
```

### Useful SQL Queries

```sql
-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT * FROM pg_stat_activity;

-- Kill connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Slow queries (requires pg_stat_statements)
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🛠️ Redis Commands

```bash
# Connect to Redis
redis-cli

# Test connection
PING

# Get all keys (⚠️  slow on large databases)
KEYS *

# Get keys matching pattern
KEYS user:*

# Get value
GET key

# Set value with expiration
SETEX key 3600 value

# Delete key
DEL key

# Check key exists
EXISTS key

# Get TTL
TTL key

# List all databases
INFO keyspace

# Select database
SELECT 1

# Flush current database (⚠️  deletes all data!)
FLUSHDB

# Flush all databases (⚠️  deletes all data!)
FLUSHALL

# Monitor commands in real-time
MONITOR

# Get server info
INFO

# Exit
EXIT
```

---

## 📊 Monitoring

### Prisma Metrics

```typescript
// Query performance
const start = Date.now();
const result = await prisma.user.findMany();
console.log(`Query took ${Date.now() - start}ms`);

// Connection pool status
const metrics = await prisma.$metrics.json();
console.log(metrics);

// Query events
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration, 'ms');
});
```

### Redis Monitoring

```bash
# Monitor all commands
redis-cli MONITOR

# Get stats
redis-cli INFO stats

# Get memory usage
redis-cli INFO memory

# Get slow log
redis-cli SLOWLOG GET 10

# Get client list
redis-cli CLIENT LIST
```

---

## 🚨 Emergency Commands

### Database Issues

```bash
# Reset database (development only!)
npx prisma migrate reset -f

# Force unlock migrations
npx prisma migrate resolve --applied <migration_name>

# Repair migrations
rm -rf prisma/migrations
npx prisma migrate dev --name init

# Backup database
pg_dump -U companyos companyos_dev > backup.sql

# Restore database
psql -U companyos companyos_dev < backup.sql
```

### Redis Issues

```bash
# Flush all cache
redis-cli FLUSHALL

# Restart Redis (Docker)
docker-compose restart redis

# Check Redis logs
docker-compose logs redis

# Kill all connections
redis-cli CLIENT KILL TYPE normal
```

---

## 📚 Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/docs/)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Full setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

**Tip**: Add these as npm scripts in `package.json` for easier access!

```json
{
  "scripts": {
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:generate": "prisma generate"
  }
}
```
