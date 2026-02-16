# 🚀 Company OS - Production Deployment

**Status:** ✅ Ready to Deploy  
**Time Required:** 30-45 minutes  
**Cost:** Free (Railway + Vercel free tiers)

---

## Quick Start

Choose your deployment method:

### Option A: Automated CLI Deployment (Recommended if CLIs work)
```bash
cd /Users/camjohnson/.openclaw/workspace/company-os

# Ensure you're logged in
railway login
vercel login

# Run deployment script
./deploy.sh
```

### Option B: Manual Web Dashboard Deployment
1. Read `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Follow `DEPLOY_CHECKLIST.md` step-by-step
3. Estimated time: 30-45 minutes

---

## 📁 Deployment Documentation

| File | Purpose |
|------|---------|
| `DEPLOYMENT_STATUS.md` | Current status and what's been done |
| `DEPLOYMENT_GUIDE.md` | Comprehensive step-by-step guide (200+ lines) |
| `DEPLOY_CHECKLIST.md` | Interactive checklist with time estimates |
| `deploy.sh` | Automated CLI deployment script |
| `backend/.env.production.template` | Backend environment variables |
| `frontend/.env.production.template` | Frontend environment variables |

---

## ✅ What's Already Done

- ✅ **Frontend:** Built successfully (384KB JS, 38KB CSS)
- ✅ **Backend:** Dependencies installed, server ready
- ✅ **Database:** Prisma schema and migrations ready
- ✅ **Security:** Production secrets generated
- ✅ **Git:** Repository initialized and committed (322 files)
- ✅ **Config:** Railway and Vercel configuration files created
- ✅ **Tools:** Railway CLI and Vercel CLI installed

---

## 🎯 What You Need to Do

### 1. Push to GitHub (5 min)
```bash
# Create a new repo on GitHub, then:
cd /Users/camjohnson/.openclaw/workspace/company-os
git remote add origin https://github.com/YOUR-USERNAME/company-os.git
git push -u origin main
```

### 2. Deploy Backend to Railway (15 min)
- Go to https://railway.app/new
- Create account → New project → Connect GitHub repo
- Add PostgreSQL and Redis databases
- Configure environment variables (use template)
- Backend will auto-deploy

### 3. Deploy Frontend to Vercel (10 min)
- Go to https://vercel.com/new
- Import your GitHub repository
- Set `VITE_API_URL` to your Railway backend URL
- Deploy

### 4. Configure GitHub OAuth (5 min)
- Go to https://github.com/settings/developers
- Create new OAuth App with production URLs
- Add Client ID and Secret to Railway

### 5. Test Everything (5 min)
- Open frontend URL
- Create test account
- Test GitHub OAuth
- Verify API calls work

---

## 🔐 Production Secrets (SAVE THESE!)

These have been pre-generated and are in the environment templates:

```env
JWT_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
ENCRYPTION_KEY=i3vpEkzmnGisyEq3ie5M/JQerfwxnMvSMVGo38uX7gI=
SESSION_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
```

**Important:** These are already in your environment templates. Don't generate new ones unless you want to invalidate existing sessions.

---

## 📊 Tech Stack

### Frontend (Vercel)
- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zustand + React Query
- Build output: 384KB JS (111KB gzipped)

### Backend (Railway)
- Node.js 20+ + Express
- GraphQL + REST + WebSocket
- PostgreSQL + Prisma ORM
- Redis caching

---

## 🆘 Troubleshooting

### Railway CLI won't login interactively
→ Use web dashboard method (Option B above)

### Frontend build fails
→ Already built successfully, should work fine

### Backend won't start
→ Check Railway logs, verify DATABASE_URL is set

### CORS errors
→ Ensure FRONTEND_URL is set correctly in Railway backend

### Database connection fails
→ Run migrations: `railway run npx prisma migrate deploy`

---

## 📖 Detailed Help

- **Full Guide:** See `DEPLOYMENT_GUIDE.md`
- **Checklist:** See `DEPLOY_CHECKLIST.md`
- **Status:** See `DEPLOYMENT_STATUS.md`
- **Railway Docs:** https://docs.railway.app/
- **Vercel Docs:** https://vercel.com/docs

---

## 🎉 Success Criteria

All must pass:

- [ ] Frontend loads without errors
- [ ] Backend health check returns 200
- [ ] Can create account
- [ ] Can log in/out
- [ ] GitHub OAuth works
- [ ] No console errors

---

## 💰 Costs

### Free Tier Limits
- **Railway:** $5 credit/month, 500MB storage
- **Vercel:** 100GB bandwidth/month, unlimited deployments

### When to Upgrade
- Traffic exceeds free limits
- Need always-on backend (Railway Hobby: $5/mo)
- Need production SLA

---

## 🔄 Auto-Deployment (After Initial Setup)

Once connected to GitHub:
- **Railway:** Auto-deploys on push to `main`
- **Vercel:** Auto-deploys on push, preview for PRs

---

## 📝 Document Your URLs

After deployment, save these:

```
Frontend:  https://___________________________________
Backend:   https://___________________________________
GraphQL:   https://___________________________________ /graphql
Database:  (Railway Dashboard → PostgreSQL service)
Redis:     (Railway Dashboard → Redis service)
GitHub:    https://github.com/settings/developers
```

---

## 🚦 Next Steps After Deployment

1. **Monitor** - Check logs in first 24 hours
2. **Custom Domain** - Add in Vercel settings (optional)
3. **Monitoring** - Set up Sentry or Datadog
4. **Backups** - Configure PostgreSQL backups
5. **Team Access** - Invite collaborators
6. **Integrations** - Add Anthropic API key for AI features

---

## ⚡ Quick Commands

```bash
# Check status
railway status
vercel ls

# View logs
railway logs
vercel logs

# Redeploy
railway up
vercel --prod

# Run migrations
railway run npx prisma migrate deploy

# Open dashboards
railway open
vercel
```

---

## 🎯 Ready to Deploy?

1. **Read this file** (you are here)
2. **Choose deployment method** (CLI or Web)
3. **Follow the steps** in chosen guide
4. **Test everything**
5. **Document your URLs**
6. **Celebrate! 🎉**

**Questions?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Made with ❤️ by OpenClaw AI Agent**
