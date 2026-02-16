# 🚀 Deploy Company OS to Production

**Time:** 30 minutes  
**Cost:** $0 (free tier)  
**Result:** Live production app

---

## ✅ What's Ready

- Frontend built and tested locally
- Backend running and tested locally
- Database schema finalized
- First user auto-becomes admin
- All configs prepared

---

## 🎯 Deployment Steps

### Step 1: GitHub (5 min)

```bash
cd /Users/camjohnson/.openclaw/workspace/company-os

# Initialize if not done
git init
git add .
git commit -m "Initial commit: Company OS production ready"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/company-os.git
git branch -M main
git push -u origin main
```

**✓ Verify:** Repo shows up on GitHub

---

### Step 2: Railway Backend (15 min)

1. **Go to Railway:** https://railway.app/new

2. **Deploy from GitHub:**
   - Click "Deploy from GitHub repo"
   - Select your `company-os` repo
   - Select "Deploy backend only" (we'll do frontend separately)

3. **Add PostgreSQL:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway auto-provisions it

4. **Add Redis:**
   - Click "New" → "Database" → "Add Redis"
   - Railway auto-provisions it

5. **Configure Backend Service:**
   - Click on your backend service
   - Go to "Variables" tab
   - Add these (Railway provides DATABASE_URL and REDIS_URL automatically):

```bash
# Required
NODE_ENV=production
PORT=3002
FRONTEND_URL=https://YOUR-APP.vercel.app  # Update after Vercel deploy

# Secrets (from QUICK_DEPLOY.md)
JWT_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
ENCRYPTION_KEY=i3vpEkzmnGisyEq3ie5M/JQerfwxnMvSMVGo38uX7gI=
SESSION_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=

# GitHub OAuth (create these next)
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=https://YOUR-APP.vercel.app/auth/callback?provider=github

# Optional
LOG_LEVEL=info
AGENT_SPAWN_ENABLED=true
```

6. **Set Start Command:**
   - Settings → "Start Command"
   - Enter: `cd backend && npm start`

7. **Deploy:**
   - Click "Deploy"
   - Wait ~3-5 minutes

8. **Run Migrations:**
   - Once deployed, click "View Logs"
   - Or use Railway CLI: `railway run npx prisma migrate deploy`

9. **Get Backend URL:**
   - Click "Settings" → "Domains"
   - Copy the Railway URL (e.g., `https://company-os-production.up.railway.app`)

**✓ Verify:** Visit `https://YOUR-BACKEND-URL/api/health` → should return `{"status":"healthy"}`

---

### Step 3: Vercel Frontend (10 min)

1. **Go to Vercel:** https://vercel.com/new

2. **Import from GitHub:**
   - Select your `company-os` repo
   - Vercel auto-detects it's a Vite project

3. **Configure Build:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables:**
   - Add this variable:

```bash
VITE_API_URL=https://YOUR-BACKEND-URL/api
```

   Replace `YOUR-BACKEND-URL` with your Railway backend URL from Step 2.

5. **Deploy:**
   - Click "Deploy"
   - Wait ~2-3 minutes

6. **Get Frontend URL:**
   - Copy the Vercel URL (e.g., `https://company-os.vercel.app`)

**✓ Verify:** Visit your Vercel URL → should load Company OS UI

---

### Step 4: Update Backend with Frontend URL

**Important:** Now that you have the Vercel URL, update Railway:

1. Go back to Railway backend service
2. Update `FRONTEND_URL` variable with your Vercel URL
3. Redeploy backend

This enables CORS so frontend can talk to backend.

---

### Step 5: GitHub OAuth (5 min)

1. **Create OAuth App:**
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Fill in:**
   - Application name: `Company OS`
   - Homepage URL: `https://YOUR-VERCEL-URL`
   - Authorization callback URL: `https://YOUR-VERCEL-URL/auth/callback`

3. **Get Credentials:**
   - Copy Client ID
   - Generate and copy Client Secret

4. **Update Railway:**
   - Go to backend service → Variables
   - Update `GITHUB_CLIENT_ID` with your Client ID
   - Update `GITHUB_CLIENT_SECRET` with your Client Secret
   - Update `GITHUB_REDIRECT_URI` with: `https://YOUR-VERCEL-URL/auth/callback?provider=github`
   - Redeploy

**✓ Verify:** Frontend → Settings → Integrations → GitHub → should show "Connect" button

---

### Step 6: Create First Admin User (2 min)

1. **Visit your Vercel URL**
2. **Click "Sign Up"** (or Register)
3. **Enter:**
   - Your email
   - Your name
   - Strong password (min 8 chars)
4. **Submit**

**🎉 You're automatically the admin!** (first user)

**✓ Verify:** Log in → should see full admin access

---

## 🎉 Success Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL + Redis running
- [ ] Migrations ran successfully
- [ ] Health check returns healthy
- [ ] Frontend deployed to Vercel
- [ ] Frontend can reach backend API
- [ ] Created first admin account
- [ ] GitHub OAuth working (optional but recommended)

---

## 📊 What You Now Have

- **Frontend:** `https://YOUR-APP.vercel.app`
- **Backend API:** `https://YOUR-BACKEND.railway.app/api`
- **GraphQL:** `https://YOUR-BACKEND.railway.app/graphql`
- **WebSocket:** `wss://YOUR-BACKEND.railway.app`
- **Database:** Managed PostgreSQL on Railway
- **Cache:** Managed Redis on Railway

---

## 🔄 Future Updates

**To update backend:**
```bash
git add .
git commit -m "Update backend"
git push
```
Railway auto-deploys from GitHub.

**To update frontend:**
```bash
git add .
git commit -m "Update frontend"
git push
```
Vercel auto-deploys from GitHub.

---

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| Health check fails | Check Railway logs for errors |
| CORS errors | Verify FRONTEND_URL in Railway matches Vercel URL |
| Can't sign up | Check backend logs, verify DATABASE_URL is set |
| GitHub OAuth fails | Verify callback URL matches exactly (including https) |
| 500 errors | Check Railway logs: `railway logs` |

---

## 💡 Next Steps After Deployment

1. **Invite team members** (Settings → Team)
2. **Connect GitHub repos** (Integrations → GitHub)
3. **Set up other integrations** (Vercel, Figma, Slack)
4. **Create agents** (Agents → New Agent)
5. **Deploy your first project!**

---

**Questions?** Check Railway logs, Vercel logs, or browser console.

**Ready to deploy?** Start with Step 1! 👆
