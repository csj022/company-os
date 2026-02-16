# Company OS - Quick Start Reference

## 🚀 Start Everything

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## 🌐 URLs

- Frontend: http://localhost:5174
- Backend API: http://localhost:3002/api
- GraphQL: http://localhost:3002/graphql
- Health: http://localhost:3002/api/health

## ⚡ Common Commands

```bash
# Check services
brew services list | grep -E '(postgres|redis)'

# Restart services
brew services restart postgresql@16
brew services restart redis

# View logs
cd backend && tail -f logs/app.log

# Database shell
psql "postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev"

# Redis shell
redis-cli

# Prisma Studio (DB GUI)
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name <name>
```

## 🐛 Troubleshooting

```bash
# Port already in use
lsof -i :3002
kill -9 <PID>

# Clear caches
rm -rf backend/node_modules
rm -rf frontend/node_modules/.vite
npm install

# Restart Node processes
killall node
```

## 📁 Key Files

- `backend/.env` - Backend config (PORT, DATABASE_URL)
- `frontend/.env` - Frontend config (VITE_API_URL)
- `prisma/schema.prisma` - Database schema
- `STARTUP.md` - Full documentation

## 🔐 Default Credentials

- **Database:** `companyos` / `companyos_dev_password`
- **Test Users:** 
  - alice@companyos.dev (admin)
  - bob@companyos.dev (member)
  - charlie@companyos.dev (viewer)

---

**Status:** ✅ All systems operational  
**Last Updated:** 2026-02-12
