# 🚀 Company OS Deployment Checklist

## Pre-Deployment Status
- ✅ Frontend builds successfully
- ✅ Backend dependencies installed
- ✅ Production secrets generated
- ✅ Configuration files created
- ✅ Railway CLI installed
- ✅ Vercel CLI installed

---

## Deployment Steps

### 1️⃣ Railway Backend Setup (15 min)

**Website:** https://railway.app/new

- [ ] Create Railway account
- [ ] Create new project
- [ ] Add PostgreSQL database
  - Copy `DATABASE_URL`
- [ ] Add Redis database
  - Copy `REDIS_URL`
- [ ] Deploy backend service
  - Connect GitHub repo OR use CLI: `cd backend && railway up`
  - Set root directory to `backend`
- [ ] Configure environment variables
  - Use template: `backend/.env.production.template`
  - Add all variables from template
  - Use DATABASE_URL and REDIS_URL from above
- [ ] Run migrations
  - CLI: `railway run npx prisma migrate deploy`
  - OR add to build command in Railway dashboard
- [ ] Get backend URL
  - Copy deployment URL (e.g., `https://xxx.railway.app`)

**Backend URL:** `___________________________________`

---

### 2️⃣ Vercel Frontend Setup (10 min)

**Website:** https://vercel.com/new

- [ ] Create Vercel account
- [ ] Import project from GitHub
- [ ] Configure build settings:
  - Framework: Vite
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] Set environment variable:
  - `VITE_API_URL` = your Railway backend URL
- [ ] Deploy
- [ ] Get frontend URL
  - Copy deployment URL (e.g., `https://xxx.vercel.app`)

**Frontend URL:** `___________________________________`

---

### 3️⃣ Update Cross-References (5 min)

- [ ] Update Railway backend env var:
  - `FRONTEND_URL` = your Vercel frontend URL
- [ ] Redeploy backend (if needed)

---

### 4️⃣ GitHub OAuth Setup (5 min)

**Website:** https://github.com/settings/developers

- [ ] Create new OAuth App
  - Name: Company OS Production
  - Homepage: `<your-vercel-url>`
  - Callback: `<your-railway-url>/api/auth/github/callback`
- [ ] Copy Client ID and Secret
- [ ] Add to Railway backend env vars:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_CALLBACK_URL`

**OAuth App:** https://github.com/settings/developers

---

### 5️⃣ Testing (10 min)

- [ ] Test frontend loads: `<your-vercel-url>`
- [ ] Test backend health: `<your-railway-url>/api/health`
- [ ] Test GraphQL: `<your-railway-url>/graphql`
- [ ] Create test account
- [ ] Test login/logout
- [ ] Test GitHub OAuth login
- [ ] Check browser console for errors
- [ ] Check Railway logs for errors

---

## Production URLs

Document your deployed URLs here:

```
Frontend:  https://___________________________________
Backend:   https://___________________________________
GraphQL:   https://___________________________________ /graphql
Database:  Railway internal (check dashboard)
Redis:     Railway internal (check dashboard)
GitHub:    https://github.com/settings/developers
```

---

## Quick Commands

### Check Railway Status
```bash
railway status
railway logs
```

### Check Vercel Status
```bash
vercel ls
vercel logs
```

### Redeploy Backend
```bash
cd backend
railway up
```

### Redeploy Frontend
```bash
cd frontend
vercel --prod
```

### View Logs
```bash
# Railway
railway logs --follow

# Vercel
vercel logs <deployment-url> --follow
```

---

## Troubleshooting

### Backend Issues
1. Check Railway logs in dashboard
2. Verify DATABASE_URL is set
3. Verify REDIS_URL is set
4. Check if migrations ran

### Frontend Issues
1. Check Vercel build logs
2. Verify VITE_API_URL is correct
3. Check browser console
4. Verify CORS settings in backend

### Database Issues
1. Run migrations: `railway run npx prisma migrate deploy`
2. Check DATABASE_URL format
3. Test connection from backend logs

### OAuth Issues
1. Verify callback URL matches exactly
2. Check CLIENT_ID and SECRET
3. Ensure production URLs use HTTPS

---

## Success Criteria

✅ All checks must pass:

- [ ] Frontend loads without errors
- [ ] Backend API responds
- [ ] Database connected
- [ ] Can create account
- [ ] Can log in/out
- [ ] GitHub OAuth works
- [ ] No console errors
- [ ] No backend errors in logs

---

## Post-Deployment

Optional but recommended:

- [ ] Set up custom domain on Vercel
- [ ] Configure monitoring (Sentry, Datadog)
- [ ] Set up CI/CD pipelines
- [ ] Enable automatic deployments from main branch
- [ ] Configure backup strategy
- [ ] Set up error alerting
- [ ] Document API endpoints
- [ ] Share URLs with team

---

## Need Help?

- **Railway Docs:** https://docs.railway.app/
- **Vercel Docs:** https://vercel.com/docs
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Check logs** in both Railway and Vercel dashboards
