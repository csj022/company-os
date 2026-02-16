# Quick Start: Integrations & Development Hub

Get up and running with Company OS's powerful development integrations in 5 minutes.

## ⚡ Prerequisites

- Node.js v18+ installed
- PostgreSQL running
- GitHub account
- (Optional) Vercel account
- (Optional) Anthropic API key for AI features

## 🚀 Quick Setup

### 1. Environment Variables

Create or update `.env` in the project root:

```bash
# Required for GitHub Integration
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/api/integrations/github/callback

# Required for AI Assistant
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Database (should already be set)
DATABASE_URL=postgresql://user:pass@localhost:5432/companyos

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_32_byte_hex_key_here
```

### 2. Create GitHub OAuth App

**Quick link:** https://github.com/settings/developers

1. Click "New OAuth App"
2. Fill in:
   - **Name:** `Company OS Dev`
   - **Homepage:** `http://localhost:3000`
   - **Callback:** `http://localhost:3000/api/integrations/github/callback`
3. Click "Register application"
4. Copy **Client ID** and **Client Secret** to your `.env`

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Database Migration

```bash
# From project root
npx prisma migrate dev
npx prisma generate
```

### 5. Start the Application

```bash
# Terminal 1 - Backend (from backend/)
npm run dev

# Terminal 2 - Frontend (from frontend/)
npm run dev
```

Frontend will be at: **http://localhost:5173**  
Backend will be at: **http://localhost:3000**

## 🎯 First Steps

### Connect GitHub

1. **Login** to Company OS (create account if needed)
2. Navigate to **Integrations** page (sidebar)
3. Click **"Connect GitHub"** on the GitHub card
4. Authorize the application
5. You'll be redirected back - GitHub is now connected! ✅

### View Your Repositories

1. Go to **Dev Hub** page (sidebar)
2. Click **"Repositories"** tab
3. Your GitHub repos will appear automatically
4. Click any repo to select it

### Create Your First PR

1. In **Dev Hub**, click **"Pull Requests"** tab
2. See all your open PRs
3. Click **"Request AI Review"** on any PR
4. Watch as AI analyzes your code!

### Deploy a Project

1. Connect **Vercel** (same process as GitHub)
2. Go to **Deployments** tab
3. Click **"Deploy"** on any project
4. Watch the deployment progress in real-time

## 🔧 Troubleshooting

### "GitHub integration not found"
→ Connect GitHub first at `/integrations`

### Backend won't start
→ Check PostgreSQL is running: `pg_isready`
→ Verify `DATABASE_URL` in `.env`

### Frontend can't reach backend
→ Ensure backend is running on port 3000
→ Check CORS settings in `backend/src/middleware/cors.js`

### OAuth callback fails
→ Verify redirect URI matches in GitHub OAuth app settings
→ Check `GITHUB_REDIRECT_URI` in `.env`

## 📚 What's Available

### Pages
- `/integrations` - Manage all service connections
- `/development-hub` - Full development workspace
- `/development` - Original development page (legacy)

### Features Ready to Use

✅ **Repository Browser** - Browse all your GitHub repos  
✅ **Pull Request Manager** - View, filter, merge PRs  
✅ **AI Code Review** - Automated PR reviews  
✅ **Code Editor** - Edit files directly in browser  
✅ **AI Assistant** - Chat with Claude for code help  
✅ **Deployment Controls** - Deploy and monitor with Vercel  
✅ **Real-time Updates** - Live status changes  

## 🤖 Using the AI Assistant

The AI assistant is available in the **Editor** view:

### Quick Actions
- **Review Code** - Get best practices feedback
- **Find Bugs** - Detect potential issues
- **Suggest Improvements** - Optimization ideas
- **Add Comments** - Generate documentation

### Chat
Type any question:
- "How can I refactor this function?"
- "Explain what this code does"
- "Generate a React component for a login form"
- "Find security vulnerabilities in this code"

### Apply Suggestions
1. AI provides code suggestions
2. Review the suggestion
3. Click **"Apply"** to insert into your code
4. Or click **"Copy"** to use elsewhere

## 🎨 Navigation

### Sidebar Menu
- **Command Center** - Dashboard overview
- **Development** - Legacy dev page
- **Dev Hub** - ⭐ New full-featured hub
- **Design System** - Design files
- **Team** - Team management
- **Social** - Social media
- **Agents** - AI agents
- **Intelligence** - Analytics
- **Integrations** - ⭐ Service connections

## ⚡ Power User Tips

### Keyboard Shortcuts (Editor)
- `Ctrl+S` - Save file
- `Ctrl+F` - Find in file
- `Ctrl+/` - Toggle comment

### Quick Deploy
In Dev Hub → Deployments:
- Use **Quick Deploy** cards for instant one-click deployment
- Select environment before deploying
- Production requires confirmation

### AI Code Review
Automatically triggered when:
- New PR opened (webhook)
- Manual via "Request AI Review" button

### Real-time Updates
All views auto-refresh:
- Deployments: every 10 seconds
- PRs: on webhook events
- Integrations: every 30 seconds

## 🔐 Security Notes

- **Never commit `.env`** - Already in `.gitignore`
- **Encryption key** - Generate a new one for production
- **OAuth secrets** - Rotate regularly
- **API keys** - Use separate keys for dev/production

## 📖 Next Steps

### Learn More
- Read `INTEGRATIONS_DEV_HUB_GUIDE.md` for complete documentation
- Check `GITHUB_INTEGRATION.md` for GitHub-specific details
- Review `ARCHITECTURE.md` for system design

### Add More Integrations
1. Vercel (for deployments)
2. Figma (for design sync)
3. Slack (for notifications)
4. Twitter/LinkedIn (for social posting)

### Extend Functionality
- Add custom AI agent tasks
- Create workflow automations
- Build custom integrations
- Add deployment pipelines

## 🆘 Need Help?

**Check Logs:**
```bash
# Backend logs
cd backend
npm run dev  # Watch console output

# Frontend logs
Open browser DevTools → Console
```

**Common Issues:**
- Database connection → Verify PostgreSQL running
- GitHub OAuth → Check redirect URI exactly matches
- AI not responding → Verify Anthropic API key
- No repositories → Sync integration manually

**Still stuck?**
- Review the detailed documentation
- Check GitHub issues
- Enable debug logging

## ✅ Success Checklist

After setup, you should be able to:

- [ ] Login to Company OS
- [ ] See Integrations page
- [ ] Connect GitHub successfully
- [ ] View your repositories in Dev Hub
- [ ] See your pull requests
- [ ] Request an AI code review
- [ ] Edit a file in the code editor
- [ ] Chat with the AI assistant
- [ ] (Optional) Deploy to Vercel

If you can do all of these, you're ready to go! 🎉

## 🚀 What's Next?

Now that you're set up, explore:

1. **Create a PR** → Get AI code review
2. **Deploy a project** → Watch it build live
3. **Edit code** → Use AI suggestions
4. **Set up webhooks** → Real-time updates
5. **Explore automation** → Let AI help you code

---

**Time to first value: ~5 minutes** ⚡  
**Full setup time: ~15 minutes** 🚀  

Happy coding! 🎉
