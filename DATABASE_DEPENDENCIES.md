# Database Layer Dependencies

This document lists all required npm packages for the CompanyOS database layer.

## Installation

```bash
npm install @prisma/client ioredis
npm install -D prisma ts-node typescript @types/node
```

Or with pnpm:

```bash
pnpm add @prisma/client ioredis
pnpm add -D prisma ts-node typescript @types/node
```

---

## Production Dependencies

Add these to `package.json` under `dependencies`:

```json
{
  "dependencies": {
    "@prisma/client": "^5.9.1",
    "ioredis": "^5.3.2"
  }
}
```

### Package Details

#### @prisma/client
- **Version**: ^5.9.1
- **Purpose**: Type-safe database client for PostgreSQL
- **Features**: Auto-generated types, query builder, migrations
- **Docs**: https://www.prisma.io/docs/concepts/components/prisma-client

#### ioredis
- **Version**: ^5.3.2
- **Purpose**: High-performance Redis client for Node.js
- **Features**: Clustering, pub/sub, Lua scripting, transactions
- **Docs**: https://github.com/redis/ioredis

---

## Development Dependencies

Add these to `package.json` under `devDependencies`:

```json
{
  "devDependencies": {
    "prisma": "^5.9.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "@types/node": "^20.11.5"
  }
}
```

### Package Details

#### prisma
- **Version**: ^5.9.1
- **Purpose**: Prisma CLI for migrations, schema management, and code generation
- **Usage**: `npx prisma migrate`, `npx prisma generate`, `npx prisma studio`

#### ts-node
- **Version**: ^10.9.2
- **Purpose**: TypeScript execution engine for Node.js
- **Usage**: Runs TypeScript files directly (seed scripts, migrations)

#### typescript
- **Version**: ^5.3.3
- **Purpose**: TypeScript compiler
- **Required**: For type checking and compilation

#### @types/node
- **Version**: ^20.11.5
- **Purpose**: TypeScript type definitions for Node.js
- **Required**: For Node.js API types

---

## Optional: Job Queue Dependencies

If you plan to use BullMQ for advanced job queuing:

```bash
npm install bullmq
```

```json
{
  "dependencies": {
    "bullmq": "^5.1.9"
  }
}
```

---

## Complete package.json Example

```json
{
  "name": "company-os",
  "version": "1.0.0",
  "description": "AI-powered company operating system",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:reset": "prisma migrate reset",
    "db:push": "prisma db push"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.9.1",
    "ioredis": "^5.3.2",
    "express": "^4.18.2",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "prisma": "^5.9.1",
    "ts-node": "^10.9.2",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

---

## TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "src/**/*",
    "prisma/seed.ts",
    "config/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

---

## Installation Commands Summary

### Full Setup (One Command)

```bash
# Install all dependencies
npm install @prisma/client ioredis express dotenv && \
npm install -D prisma ts-node tsx typescript @types/node @types/express

# Generate Prisma client
npx prisma generate

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

### Verify Installation

```bash
# Check Prisma version
npx prisma --version

# Test database connection
npx prisma db pull

# Open Prisma Studio
npx prisma studio
```

---

## Version Compatibility

| Package | Minimum Version | Tested Version | Notes |
|---------|----------------|----------------|-------|
| Node.js | 20.0.0 | 20.11.0 | LTS version required |
| PostgreSQL | 14.0 | 16.1 | Recommend 16+ for best features |
| Redis | 6.0 | 7.2 | Recommend 7+ for improved performance |
| TypeScript | 5.0.0 | 5.3.3 | Strict mode enabled |
| Prisma | 5.0.0 | 5.9.1 | Latest stable |

---

## Troubleshooting

### Prisma Client Generation Issues

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# Reinstall and regenerate
npm install
npx prisma generate
```

### Redis Connection Issues

```bash
# Test Redis connection
node -e "const Redis = require('ioredis'); const redis = new Redis(); redis.ping().then(console.log).catch(console.error).finally(() => redis.quit());"
```

### TypeScript Errors

```bash
# Clean build
rm -rf dist
tsc --build --clean
tsc
```

---

## Production Optimizations

### 1. Connection Pooling

Use PgBouncer for PostgreSQL connection pooling:

```bash
# Install PgBouncer (Ubuntu)
sudo apt install pgbouncer

# Configure connection string
DATABASE_URL="postgresql://user:password@localhost:6432/database"
```

### 2. Redis Cluster

For high availability, use Redis Cluster:

```typescript
import Redis from 'ioredis';

const redis = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);
```

### 3. Prisma Accelerate

Use Prisma Accelerate for global caching:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["accelerate"]
}
```

---

## Additional Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [ioredis Best Practices](https://github.com/redis/ioredis#best-practices)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Last Updated**: 2026-02-12
