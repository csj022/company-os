# Company OS Integrations Setup Checklist

Print this checklist and check off items as you complete them.

## Prerequisites ✓

- [ ] Node.js v18+ installed (`node --version`)
- [ ] PostgreSQL installed and running (`pg_isready`)
- [ ] GitHub account created
- [ ] Git installed (`git --version`)
- [ ] Code editor (VS Code recommended)

## Environment Setup ✓

### 1. Database
- [ ] PostgreSQL running on port 5432
- [ ] Database created: `createdb companyos`
- [ ] DATABASE_URL in `.env`

### 2. Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- [ ] Copy output to `ENCRYPTION_KEY` in `.env`
- [ ] Saved securely (don't commit!)

### 3. JWT Secret
```bash
openssl rand -base64 32
```
- [ ] Copy output to `JWT_SECRET` in `.env`

## GitHub OAuth Setup ✓

### 1. Create OAuth App
- [ ] Go to https://github.com/settings/developers
- [ ] Click "New OAuth App"
- [ ] Fill in form:
  - Name: `Company OS Dev`
  - Homepage: `http://localhost:3000`
  - Callback: `http://localhost:3000/api/integrations/github/callback`
- [ ] Click "Register application"

### 2. Configure Environment
- [ ] Copy Client ID to `GITHUB_CLIENT_ID` in `.env`
- [ ] Copy Client Secret to `GITHUB_CLIENT_SECRET` in `.env`
- [ ] Set `GITHUB_REDIRECT_URI=http://localhost:3000/api/integrations/github/callback`

## AI Assistant Setup (Optional) ✓

### 1. Get Anthropic API Key
- [ ] Go to https://console.anthropic.com/
- [ ] Create account / Sign in
- [ ] Generate API key
- [ ] Copy to `ANTHROPIC_API_KEY` in `.env`

**Note:** Skip this if you don't want AI features yet.

## Installation ✓

### 1. Backend Dependencies
```bash
cd backend
npm install
```
- [ ] Dependencies installed successfully
- [ ] No errors in output

### 2. Frontend Dependencies
```bash
cd frontend
npm install
```
- [ ] Dependencies installed successfully
- [ ] No errors in output

### 3. Database Migration
```bash
# From project root
npx prisma migrate dev
npx prisma generate
```
- [ ] Migrations applied
- [ ] Prisma client generated
- [ ] No errors

## Verify Installation ✓

### 1. Environment Variables
- [ ] `.env` file exists in project root
- [ ] All required variables set:
  - [ ] `DATABASE_URL`
  - [ ] `ENCRYPTION_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `GITHUB_CLIENT_ID`
  - [ ] `GITHUB_CLIENT_SECRET`
  - [ ] `GITHUB_REDIRECT_URI`
  - [ ] `ANTHROPIC_API_KEY` (optional)

### 2. Database Connection
```bash
npx prisma studio
```
- [ ] Prisma Studio opens at http://localhost:5555
- [ ] Can see tables (users, organizations, etc.)
- [ ] Close when verified

## Start Services ✓

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
- [ ] Server starts on port 3000
- [ ] No errors
- [ ] See "Server listening on port 3000"

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
- [ ] Dev server starts on port 5173
- [ ] No errors
- [ ] See "Local: http://localhost:5173"

## First Run Verification ✓

### 1. Access Application
- [ ] Open http://localhost:5173
- [ ] Page loads successfully
- [ ] See login screen

### 2. Create Account
- [ ] Click "Sign up"
- [ ] Create account with email/password
- [ ] Successfully logged in
- [ ] See dashboard

### 3. Navigate to Integrations
- [ ] Click "Integrations" in sidebar
- [ ] Page loads
- [ ] See 6 integration cards
- [ ] GitHub shows "Not Connected"

## GitHub Connection Test ✓

### 1. Connect GitHub
- [ ] Click "Connect GitHub" button
- [ ] Redirected to GitHub
- [ ] See authorization screen
- [ ] Click "Authorize"

### 2. Verify Connection
- [ ] Redirected back to Company OS
- [ ] GitHub card shows "Connected"
- [ ] See "Last Sync" timestamp
- [ ] No errors in console

### 3. View Repositories
- [ ] Click "Dev Hub" in sidebar
- [ ] Click "Repositories" tab
- [ ] See your GitHub repositories
- [ ] Can search repositories
- [ ] Click a repo to select it

## Pull Requests Test ✓

- [ ] Go to Dev Hub → Pull Requests
- [ ] See your open PRs (if any)
- [ ] Can filter by status
- [ ] Can view PR details
- [ ] "Request AI Review" button visible

## Deployments Test (If Vercel Connected) ✓

- [ ] Connect Vercel at `/integrations` (optional)
- [ ] Go to Dev Hub → Deployments
- [ ] See deployment history (if any)
- [ ] "Deploy" buttons work
- [ ] Can view deployment details

## Code Editor Test ✓

### 1. Open Editor
- [ ] Go to Dev Hub → Editor
- [ ] Select a repository from dropdown
- [ ] See file tree on left
- [ ] Click a file to open

### 2. Edit File
- [ ] File content loads in editor
- [ ] Can type and edit
- [ ] "Unsaved Changes" badge appears
- [ ] Click "Save" to commit

## AI Assistant Test ✓

### 1. Open AI Panel
- [ ] In Editor view, see AI panel on right
- [ ] See quick action buttons
- [ ] See chat interface

### 2. Test Quick Action
- [ ] Click "Review Code" button
- [ ] AI response appears in chat
- [ ] No errors

### 3. Test Chat
- [ ] Type question: "What is React?"
- [ ] Press Enter or click Send
- [ ] AI responds
- [ ] Conversation history visible

## Health Check ✓

### 1. API Health
```bash
curl http://localhost:3000/api/health
```
- [ ] Returns `{"status":"healthy","timestamp":"..."}`

### 2. Browser Console
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] No red errors
- [ ] Only info/debug messages (if any)

### 3. Network Tab
- [ ] Open DevTools → Network
- [ ] Navigate to Dev Hub
- [ ] All API calls return 200 status
- [ ] No 404 or 500 errors

## Advanced Features (Optional) ✓

### 1. Webhooks
- [ ] Go to GitHub repo → Settings → Webhooks
- [ ] Add webhook URL (requires public URL)
- [ ] Set secret
- [ ] Test delivery

### 2. Monaco Editor
```bash
cd frontend
npm install @monaco-editor/react
```
- [ ] Package installed
- [ ] Update CodeEditor.tsx (see guide)
- [ ] Restart frontend
- [ ] Editor has better features

### 3. WebSocket
- [ ] Follow guide to enable WebSocket
- [ ] Real-time updates working
- [ ] Deployment status auto-updates

## Troubleshooting ✓

If you checked NO on any item above:

### Database Issues
- [ ] PostgreSQL is running: `pg_isready`
- [ ] Database exists: `psql -l | grep companyos`
- [ ] Run migrations: `npx prisma migrate dev`

### Backend Won't Start
- [ ] Check .env file exists
- [ ] All environment variables set
- [ ] Port 3000 not in use: `lsof -ti:3000`
- [ ] Check backend logs for errors

### Frontend Won't Start
- [ ] Dependencies installed: `npm install`
- [ ] Port 5173 not in use
- [ ] Check frontend logs for errors

### GitHub OAuth Fails
- [ ] Redirect URI matches exactly
- [ ] Client ID/Secret correct
- [ ] GitHub OAuth app is active
- [ ] Check browser network tab

### AI Not Working
- [ ] ANTHROPIC_API_KEY is set
- [ ] API key is valid
- [ ] Not rate limited
- [ ] Check backend logs

## Success! 🎉

If all items are checked, you have:

✅ Fully working Company OS installation  
✅ GitHub integration connected  
✅ Can browse repositories  
✅ Can manage pull requests  
✅ Can deploy projects (with Vercel)  
✅ Can edit code in browser  
✅ AI assistant helping you code  

## Next Steps

Now that setup is complete:

1. **Explore Features**
   - Try different views in Dev Hub
   - Request an AI code review
   - Deploy a test project
   - Edit some code

2. **Add More Integrations**
   - Connect Vercel for deployments
   - Connect Figma for design
   - Connect Slack for notifications

3. **Customize**
   - Install Monaco Editor
   - Set up webhooks
   - Enable WebSocket
   - Add custom workflows

4. **Learn More**
   - Read complete guide
   - Explore API documentation
   - Check out AI capabilities
   - Build custom features

## Quick Reference

### Start Development
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

### Access Points
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Database GUI:** http://localhost:5555 (run `npx prisma studio`)

### Important URLs
- **Integrations:** http://localhost:5173/integrations
- **Dev Hub:** http://localhost:5173/development-hub
- **Dashboard:** http://localhost:5173/dashboard

### Documentation
- Quick Start: `INTEGRATIONS_QUICKSTART.md`
- Complete Guide: `INTEGRATIONS_DEV_HUB_GUIDE.md`
- What Was Built: `INTEGRATIONS_COMPLETION_REPORT.md`

## Support

Stuck on something?
1. Check the documentation
2. Review troubleshooting section
3. Check browser/backend logs
4. Verify all checklist items

---

**Setup completed on:** ________________  
**Total setup time:** _______ minutes  
**Ready to code!** 🚀
