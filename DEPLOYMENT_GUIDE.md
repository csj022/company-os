# Company OS - Production Deployment Guide

## 🎯 Deployment Overview

**Status:** Ready for deployment
- ✅ Frontend build verified
- ✅ Backend dependencies installed
- ✅ Production secrets generated
- 🔄 Manual deployment steps required

**Target Infrastructure:**
- Frontend: Vercel (free tier)
- Backend: Railway (free tier)
- Database: Railway PostgreSQL
- Cache: Railway Redis

---

## 🔐 Generated Production Secrets

**IMPORTANT:** Save these secrets securely - they're used below!

```env
JWT_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
ENCRYPTION_KEY=i3vpEkzmnGisyEq3ie5M/JQerfwxnMvSMVGo38uX7gI=
SESSION_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
```

---

## 📦 Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account & Project

1. Go to https://railway.app/
2. Sign up or log in (GitHub recommended)
3. Click **"New Project"**
4. Select **"Empty Project"**

### Step 2: Add PostgreSQL Database

1. In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will provision a PostgreSQL instance
3. Click on the PostgreSQL service → **"Variables"** tab
4. Copy the `DATABASE_URL` value (starts with `postgresql://`)

### Step 3: Add Redis Cache

1. Click **"New"** → **"Database"** → **"Add Redis"**
2. Railway will provision a Redis instance
3. Click on the Redis service → **"Variables"** tab
4. Copy the `REDIS_URL` value (starts with `redis://`)

### Step 4: Deploy Backend Service

1. Click **"New"** → **"GitHub Repo"** or **"Empty Service"**

#### Option A: GitHub Repository (Recommended)
- Connect your GitHub repository
- Select the `company-os` repository
- Railway will auto-detect Node.js
- Set **Root Directory:** `backend`
- Set **Build Command:** `npm install`
- Set **Start Command:** `npm start`

#### Option B: Railway CLI (Alternative)
```bash
cd /Users/camjohnson/.openclaw/workspace/company-os/backend
railway login
railway link
railway up
```

### Step 5: Configure Backend Environment Variables

In Railway, click on your backend service → **"Variables"** tab, and add:

```env
# Core Configuration
NODE_ENV=production
PORT=3000

# Database (use the DATABASE_URL from Step 2)
DATABASE_URL=<paste-from-postgresql-service>

# Redis (use the REDIS_URL from Step 3)
REDIS_URL=<paste-from-redis-service>

# Or if Railway provides separate Redis variables:
REDIS_HOST=<from-redis-service>
REDIS_PORT=<from-redis-service>
REDIS_PASSWORD=<from-redis-service>
REDIS_TLS=true

# Security (use generated secrets from above)
JWT_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
JWT_EXPIRATION=7d
SESSION_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=

# API URLs (update after backend deploys)
FRONTEND_URL=https://your-app.vercel.app
API_URL=https://your-backend.railway.app

# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>
GITHUB_CALLBACK_URL=https://your-backend.railway.app/api/auth/github/callback

# Optional: AI Services
ANTHROPIC_API_KEY=<your-anthropic-key-if-available>
OPENAI_API_KEY=<your-openai-key-if-available>
```

### Step 6: Get Backend URL

1. After deployment completes, Railway will provide a URL like:
   `https://company-os-backend-production-XXXX.up.railway.app`
2. Copy this URL - you'll need it for frontend configuration
3. Test it: `https://your-backend-url.railway.app/api/health`

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com/
2. Sign up or log in (GitHub recommended)

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Vercel will auto-detect the framework

### Step 3: Configure Build Settings

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### Step 4: Set Environment Variables

Click **"Environment Variables"** and add:

```env
VITE_API_URL=https://your-backend.railway.app
```

Replace `your-backend.railway.app` with your actual Railway backend URL from Part 1, Step 6.

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. You'll get a URL like: `https://company-os.vercel.app`

---

## 🔄 Part 3: Post-Deployment Configuration

### Step 1: Update Backend Environment Variables

Go back to Railway → Backend Service → Variables:

```env
FRONTEND_URL=https://your-actual-frontend.vercel.app
```

### Step 2: Run Database Migrations

#### Option A: Railway CLI
```bash
cd /Users/camjohnson/.openclaw/workspace/company-os
railway run npx prisma migrate deploy
```

#### Option B: Railway Dashboard
1. Go to Railway → Backend Service → **"Settings"** → **"Deploy"**
2. Add a **"Deploy Command"**:
   ```bash
   npx prisma migrate deploy && npm start
   ```

### Step 3: Set Up GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** Company OS Production
   - **Homepage URL:** `https://your-frontend.vercel.app`
   - **Authorization callback URL:** `https://your-backend.railway.app/api/auth/github/callback`
4. Copy **Client ID** and **Client Secret**
5. Add to Railway backend environment variables:
   ```env
   GITHUB_CLIENT_ID=<your-client-id>
   GITHUB_CLIENT_SECRET=<your-client-secret>
   GITHUB_CALLBACK_URL=https://your-backend.railway.app/api/auth/github/callback
   ```

### Step 4: Verify Deployment

Test these URLs:

1. **Frontend:** `https://your-frontend.vercel.app`
2. **Backend Health:** `https://your-backend.railway.app/api/health`
3. **GraphQL Playground:** `https://your-backend.railway.app/graphql`

### Step 5: Test Full Flow

1. Open the frontend URL
2. Try creating an account
3. Test login/logout
4. Try GitHub OAuth login
5. Verify API calls work

---

## 🛠️ Alternative: CLI Deployment (If Login Works)

If you can run `railway login` and `vercel login` successfully:

```bash
# Deploy Backend
cd /Users/camjohnson/.openclaw/workspace/company-os/backend
railway login
railway init
railway add -d postgresql
railway add -d redis
railway up

# Deploy Frontend
cd /Users/camjohnson/.openclaw/workspace/company-os/frontend
vercel login
vercel --prod
```

---

## 📝 Production URLs Checklist

Once deployed, document these URLs:

- [ ] **Frontend:** `https://_________________.vercel.app`
- [ ] **Backend:** `https://_________________.railway.app`
- [ ] **GraphQL:** `https://_________________.railway.app/graphql`
- [ ] **PostgreSQL:** (Railway internal, check dashboard)
- [ ] **Redis:** (Railway internal, check dashboard)
- [ ] **GitHub OAuth App:** https://github.com/settings/developers

---

## 🔒 Security Notes

1. ✅ JWT and encryption secrets generated
2. ⚠️ Update GitHub OAuth with production URLs
3. ⚠️ Set CORS properly (FRONTEND_URL in backend)
4. ⚠️ Use HTTPS only in production
5. ⚠️ Don't commit production .env files

---

## 🐛 Troubleshooting

### Backend won't start
- Check Railway logs: Railway Dashboard → Service → "Deployments" → Latest
- Verify DATABASE_URL is correct
- Ensure all required env vars are set

### Frontend can't reach backend
- Verify VITE_API_URL matches Railway backend URL
- Check CORS settings in backend (FRONTEND_URL)
- Look at browser console for errors

### Database connection fails
- Verify DATABASE_URL format
- Check if Prisma migrations ran
- Run migrations manually: `railway run npx prisma migrate deploy`

### GitHub OAuth fails
- Verify callback URL matches exactly
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure URLs use HTTPS in production

---

## 🚀 Quick Start After Deployment

Users can access your app at:
- **Public URL:** Your Vercel frontend URL
- **Login:** Email/password or GitHub OAuth
- **Features:** Full Company OS functionality

**Next Steps:**
- Set up monitoring (Sentry, etc.)
- Configure custom domain (optional)
- Set up CI/CD pipelines
- Add more integrations

---

## 📞 Support

If you need help:
- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs
- Check logs in both platforms for errors
