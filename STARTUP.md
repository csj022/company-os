# Company OS - Startup Guide

## 🚀 Quick Start

This guide will help you get the complete Company OS stack running locally.

---

## Prerequisites

### Required Software
- **Node.js** v20+ (currently using v25.5.0)
- **PostgreSQL** 16 (via Homebrew)
- **Redis** 7+ (via Homebrew)
- **npm** (comes with Node.js)

### Installing Prerequisites (macOS via Homebrew)

```bash
# Install PostgreSQL 16
brew install postgresql@16

# Install Redis
brew install redis

# Start services (they'll auto-start on login)
brew services start postgresql@16
brew services start redis
```

---

## 📁 Project Structure

```
company-os/
├── backend/          # Express + GraphQL + WebSocket API
├── frontend/         # React + TypeScript + Vite
├── prisma/          # Database schema & migrations
├── .env             # Root environment variables
├── backend/.env     # Backend-specific config
└── frontend/.env    # Frontend-specific config
```

---

## 🗄️ Database Setup

### 1. Start PostgreSQL & Redis

```bash
# Check if services are running
brew services list | grep -E '(postgres|redis)'

# If not running, start them:
brew services start postgresql@16
brew services start redis
```

### 2. Create Database & User

```bash
# Add PostgreSQL to PATH (or add to ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Create database and user
psql postgres -c "CREATE DATABASE companyos_dev;"
psql postgres -c "CREATE USER companyos WITH PASSWORD 'companyos_dev_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE companyos_dev TO companyos;"
psql postgres -c "ALTER DATABASE companyos_dev OWNER TO companyos;"

# Verify connection
psql "postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev" -c "SELECT NOW();"
```

### 3. Install Dependencies & Run Migrations

```bash
# Install Prisma at root level
npm install -D prisma@^5.0.0
npm install @prisma/client@^5.0.0

# Grant CREATEDB permission (needed for Prisma migrations)
psql postgres -c "ALTER USER companyos CREATEDB;"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with sample data
npm install -D tsx
npx tsx prisma/seed.ts
```

---

## 🔧 Environment Configuration

### Root `.env` (already configured)
```bash
DATABASE_URL="postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Backend `.env` (located in `backend/.env`)
```bash
DATABASE_URL=postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev
NODE_ENV=development
PORT=3002

# GitHub OAuth (placeholder - configure later)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5174/auth/callback?provider=github

# Encryption & Session
ENCRYPTION_KEY=your_64_character_hex_encryption_key
SESSION_SECRET=your_session_secret_key

# Optional features
AGENT_SPAWN_ENABLED=true
LOG_LEVEL=info
```

### Frontend `.env` (located in `frontend/.env`)
```bash
VITE_API_URL=http://localhost:3002/api
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_REAL_TIME=true
```

---

## 🏃 Starting the Stack

### Option 1: Start Everything (Recommended for Development)

Open 2 terminal windows and run:

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # First time only
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only (already done)
npm run dev
```

### Option 2: Production Build

```bash
# Build backend
cd backend
npm install
npm start

# Build frontend
cd frontend
npm install
npm run build
npm run preview
```

---

## 🌐 Access Points

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5174 | React app (Vite dev server) |
| **Backend API** | http://localhost:3002/api | REST API endpoints |
| **GraphQL** | http://localhost:3002/graphql | GraphQL playground |
| **WebSocket** | ws://localhost:3002 | Real-time WebSocket |
| **Health Check** | http://localhost:3002/api/health | Backend health status |
| **PostgreSQL** | localhost:5432 | Database (use psql or pgAdmin) |
| **Redis** | localhost:6379 | Cache & pub/sub |

---

## 🧪 Testing the Integration

### 1. Test Backend Health
```bash
curl http://localhost:3002/api/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### 2. Test GraphQL
```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
# Expected: {"data":{"__typename":"Query"}}
```

### 3. Test Database Connection
```bash
psql "postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev" \
  -c "SELECT COUNT(*) FROM users;"
# Expected: count of seeded users (3)
```

### 4. Test Redis
```bash
redis-cli ping
# Expected: PONG
```

### 5. Test Frontend
Open browser to http://localhost:5174 and verify the app loads.

---

## 🐛 Troubleshooting

### Port Conflicts

If you see `EADDRINUSE` errors:

```bash
# Find process using port 3002
lsof -i :3002

# Kill the process (replace PID)
kill -9 <PID>

# Or change port in backend/.env
PORT=3003
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@16

# Check logs
tail -f /opt/homebrew/var/log/postgresql@16.log
```

### Redis Connection Issues

```bash
# Verify Redis is running
brew services list | grep redis

# Restart Redis
brew services restart redis

# Test connection
redis-cli ping
```

### Prisma Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Frontend Not Loading

```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 📊 Seeded Data

The database includes sample data:

- **3 Users:** alice@companyos.dev (admin), bob@companyos.dev (member), charlie@companyos.dev (viewer)
- **1 Organization:** CompanyOS with all users as members
- **4 Integrations:** GitHub, Vercel, Figma, Slack (need OAuth configuration)
- **2 Repositories:** company-os/frontend, company-os/backend
- **3 Pull Requests:** Sample PRs across repos
- **3 Deployments:** Sample deployments to staging/production
- **2 Figma Files:** Design System, Marketing Site
- **3 Design Components:** Button, Card, Modal
- **2 Social Accounts:** @companyos (Twitter), CompanyOS (LinkedIn)
- **4 Social Posts:** Various status posts
- **4 Agents:** Deployment Agent, Code Review Agent, Social Media Agent, Design Sync Agent
- **4 Agent Tasks:** Sample tasks across agents

---

## 🔐 Next Steps

### Required for Full Functionality

1. **GitHub OAuth Setup**
   - Create GitHub OAuth app at https://github.com/settings/developers
   - Update `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in backend/.env
   - Configure callback URL: http://localhost:5174/auth/callback

2. **Other OAuth Integrations** (Optional)
   - Vercel, Figma, Slack, Twitter, LinkedIn
   - See `.env.example` for required credentials

3. **Production Deployment**
   - Set `NODE_ENV=production`
   - Use secure secrets (not dev passwords)
   - Configure CORS for production domain
   - Set up SSL/TLS certificates
   - Use managed PostgreSQL & Redis services

---

## 🎯 Development Workflow

### Starting Your Day
```bash
# Ensure services are running
brew services list | grep -E '(postgres|redis)'

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

### Making Changes

- **Database schema changes:** Edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <migration_name>`
- **Backend changes:** Edit files in `backend/src/`, nodemon will auto-reload
- **Frontend changes:** Edit files in `frontend/src/`, Vite will hot-reload

### Stopping Services

```bash
# Stop backend/frontend: Ctrl+C in each terminal

# Stop PostgreSQL & Redis (optional)
brew services stop postgresql@16
brew services stop redis
```

---

## 📚 Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Docs](https://expressjs.com/)
- [GraphQL Docs](https://graphql.org/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vite.dev/)

---

## ✅ Success Checklist

- [ ] PostgreSQL & Redis installed and running
- [ ] Database created and user configured
- [ ] Dependencies installed (root, backend, frontend)
- [ ] Prisma migrations applied
- [ ] Database seeded with sample data
- [ ] Backend running on port 3002
- [ ] Frontend running on port 5173
- [ ] Health check endpoint returns 200 OK
- [ ] GraphQL endpoint responds
- [ ] Frontend loads in browser

---

**Last Updated:** 2026-02-12

**Status:** ✅ All core services operational
