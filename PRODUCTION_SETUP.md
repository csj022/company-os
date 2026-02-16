# Production Setup Guide

## Database Strategy

**Development:** Seed script creates demo data for testing  
**Production:** Clean database, no seed data

## First User Setup

When you deploy to production:

1. **Database starts empty** (just schema, no data)
2. **First user to sign up** → automatically becomes admin
3. **They create the organization** → becomes owner
4. **They invite other users** → assign roles

This is cleaner and more secure than pre-seeded accounts.

## Environment Differences

### Development (.env)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://companyos:companyos_dev_password@localhost:5432/companyos_dev
# Seed script available: npx tsx prisma/seed.ts
```

### Production (Railway)
```bash
NODE_ENV=production
DATABASE_URL=<railway-provides-this>
# NO seed script - starts clean
```

## Deployment Checklist

- [ ] Push to GitHub
- [ ] Railway: Deploy backend + PostgreSQL + Redis
- [ ] Run migrations: `npx prisma migrate deploy` (NOT migrate dev)
- [ ] Verify: `curl <backend-url>/api/health`
- [ ] Vercel: Deploy frontend
- [ ] Create first user account (you become admin)
- [ ] Set up GitHub OAuth
- [ ] Invite team members

## Why No Seed in Production?

✅ **Security:** No demo accounts with known passwords  
✅ **Clean:** Your real data from day one  
✅ **Simple:** No cleanup needed  
✅ **Standard:** Industry best practice

## Seed File Location

For local dev only: `prisma/seed.ts`

To reset local dev database:
```bash
npx prisma migrate reset  # Drops, recreates, migrates, seeds
```

---

**Ready to deploy:** Follow `QUICK_DEPLOY.md`
