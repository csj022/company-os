# ⚡ Company OS - Quick Deploy Reference

**Status:** ✅ Ready for Production  
**Time:** 30-45 minutes  
**Cost:** Free

---

## 🎯 Start Here

1. **Read this file** (2 min) ← You are here
2. **Push to GitHub** (5 min) - See below
3. **Deploy Backend** (15 min) - Railway
4. **Deploy Frontend** (10 min) - Vercel
5. **Setup OAuth** (5 min) - GitHub
6. **Test & Done!** (5 min)

---

## 📖 Documentation Quick Links

| File | What It's For | When to Use |
|------|---------------|-------------|
| `README_DEPLOYMENT.md` | **Start here!** Quick overview | First time reading |
| `DEPLOYMENT_GUIDE.md` | Detailed step-by-step | During deployment |
| `DEPLOY_CHECKLIST.md` | Track your progress | During deployment |
| `DEPLOYMENT_STATUS.md` | Technical details | Reference |
| `deploy.sh` | Automated script | If CLIs work |

---

## 🔐 Production Secrets (COPY THESE!)

```env
JWT_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
ENCRYPTION_KEY=i3vpEkzmnGisyEq3ie5M/JQerfwxnMvSMVGo38uX7gI=
SESSION_SECRET=WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs=
```

---

## 🚀 5-Minute Quick Start

### Step 1: Push to GitHub
```bash
cd /Users/camjohnson/.openclaw/workspace/company-os

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR-USERNAME/company-os.git
git push -u origin main
```

### Step 2: Railway (Backend)
1. Go to https://railway.app/new
2. Connect GitHub repo
3. Add PostgreSQL + Redis
4. Copy/paste from `backend/.env.production.template`
5. Deploy ✅

### Step 3: Vercel (Frontend)
1. Go to https://vercel.com/new
2. Import GitHub repo
3. Set `VITE_API_URL=<your-railway-url>`
4. Deploy ✅

### Step 4: GitHub OAuth
1. Go to https://github.com/settings/developers
2. Create OAuth App
3. Add Client ID/Secret to Railway
4. Done! ✅

---

## 📝 URLs to Fill In

```
Frontend:  https://________________________________.vercel.app
Backend:   https://________________________________.railway.app
GraphQL:   https://________________________________.railway.app/graphql
```

---

## ✅ Success Check

- [ ] Frontend loads (no errors)
- [ ] Backend health: `curl <backend-url>/api/health`
- [ ] Can create account
- [ ] Can log in
- [ ] GitHub OAuth works

---

## 🆘 Help!

| Problem | Solution |
|---------|----------|
| Railway CLI won't login | Use web dashboard method |
| Frontend build fails | Already built! Use `dist/` folder |
| Backend won't start | Check Railway logs, verify env vars |
| CORS errors | Set `FRONTEND_URL` in Railway backend |
| OAuth fails | Check callback URL matches exactly |

**Detailed help:** See `DEPLOYMENT_GUIDE.md`

---

## 🎯 What's Already Done

✅ Frontend built (384KB, no errors)  
✅ Backend ready (all dependencies)  
✅ Secrets generated (see above)  
✅ Config files created  
✅ Git committed (322 files)  
✅ Documentation complete  

**You just need to:** Deploy it! 🚀

---

## 💡 Pro Tips

- Use **web dashboard** if CLI login fails
- **Copy secrets** from above (don't generate new ones)
- **Test** each step before moving to next
- **Save URLs** as you get them
- **Check logs** if anything fails

---

## 🔗 Platform Links

- Railway: https://railway.app/
- Vercel: https://vercel.com/
- GitHub OAuth: https://github.com/settings/developers

---

**Ready?** Start with Step 1 above! 👆

**Questions?** Read `README_DEPLOYMENT.md` for more details.

---

*All technical prep work complete. Just needs manual deployment!*
