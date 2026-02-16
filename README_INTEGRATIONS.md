# Integrations & Development Hub - README

Welcome to the Company OS Integrations and Development Hub system!

## 📚 Documentation Index

Choose your path based on what you need:

### 🚀 **Just Getting Started?**
→ Read [`INTEGRATIONS_QUICKSTART.md`](./INTEGRATIONS_QUICKSTART.md)
- 5-minute setup guide
- Environment setup
- First steps
- Troubleshooting

### 📖 **Want Complete Details?**
→ Read [`INTEGRATIONS_DEV_HUB_GUIDE.md`](./INTEGRATIONS_DEV_HUB_GUIDE.md)
- Full feature documentation
- API reference
- Architecture details
- Advanced usage
- Security guidelines

### ✅ **Need to Know What Was Built?**
→ Read [`INTEGRATIONS_COMPLETION_REPORT.md`](./INTEGRATIONS_COMPLETION_REPORT.md)
- Complete feature list
- Technical specifications
- Requirements checklist
- Known limitations
- Next steps

### 🔧 **GitHub Integration Specifics?**
→ Read [`GITHUB_INTEGRATION.md`](./GITHUB_INTEGRATION.md)
- GitHub OAuth setup
- Webhook configuration
- API usage
- Event handling

## 🎯 What This System Does

Company OS now has a complete development workflow system:

### 1. **Integrations Management** (`/integrations`)
Connect and manage external services:
- GitHub (code repositories)
- Vercel (deployments)
- Figma (design files)
- Slack (notifications)
- Twitter & LinkedIn (social media)

### 2. **Development Hub** (`/development-hub`)
Your complete development workspace:
- Browse repositories
- Manage pull requests
- Deploy projects
- Edit code with AI assistance

### 3. **AI Coding Assistant**
Powered by Claude 3.5 Sonnet:
- Code review
- Bug detection
- Refactoring suggestions
- Code generation
- Explanations

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│ Integrations │ Dev Hub      │ Repositories │ PRs        │
│ Page         │ Dashboard    │ Browser      │ Manager    │
├──────────────┴──────────────┴──────────────┴────────────┤
│ Deployments  │ Code Editor  │ AI Assistant │ UI Comps   │
└──────────────┴──────────────┴──────────────┴────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express)                      │
├──────────────┬──────────────┬──────────────┬────────────┤
│ GitHub       │ Deployments  │ AI Assistant │ Auth       │
│ Routes       │ Routes       │ Routes       │ Middleware │
├──────────────┴──────────────┴──────────────┴────────────┤
│ Integration  │ Event Bus    │ WebSocket    │ Services   │
│ Service      │              │              │            │
└──────────────┴──────────────┴──────────────┴────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│             External Services & Database                 │
├──────────────┬──────────────┬──────────────┬────────────┤
│ GitHub API   │ Vercel API   │ Claude API   │ PostgreSQL │
│ (Octokit)    │              │ (Anthropic)  │ (Prisma)   │
└──────────────┴──────────────┴──────────────┴────────────┘
```

## 🗂️ File Organization

### Frontend Components
```
frontend/src/
├── pages/
│   ├── Integrations.tsx           # Integrations management
│   ├── DevelopmentHub.tsx         # Development workspace
│   └── Development.tsx            # Legacy page
├── components/
│   └── development/
│       ├── RepositoryBrowser.tsx  # Repo browser
│       ├── PullRequestManager.tsx # PR management
│       ├── DeploymentControls.tsx # Deployments
│       ├── CodeEditor.tsx         # Code editor
│       └── AIAssistantPanel.tsx   # AI assistant
```

### Backend Routes
```
backend/src/routes/
├── github.js              # GitHub API endpoints
├── deployments.js         # Deployment endpoints
├── ai-assistant.js        # AI assistant endpoints
├── integrations.js        # Integration management
└── index.js              # Route registration
```

### Documentation
```
project-root/
├── INTEGRATIONS_QUICKSTART.md        # Quick start guide
├── INTEGRATIONS_DEV_HUB_GUIDE.md     # Complete guide
├── INTEGRATIONS_COMPLETION_REPORT.md # What was built
├── GITHUB_INTEGRATION.md             # GitHub specifics
└── README_INTEGRATIONS.md            # This file
```

## ⚡ Quick Commands

```bash
# Start everything
cd backend && npm run dev          # Terminal 1
cd frontend && npm run dev         # Terminal 2

# Database
npx prisma migrate dev            # Run migrations
npx prisma studio                 # Open DB GUI

# Install Monaco Editor (optional enhancement)
cd frontend
npm install @monaco-editor/react

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check API health
curl http://localhost:3000/api/health
```

## 🔑 Environment Variables

Required in `.env`:

```bash
# GitHub (get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/api/integrations/github/callback

# AI Assistant (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/companyos

# Security
ENCRYPTION_KEY=  # Generate with command above
JWT_SECRET=
```

## 📍 Routes & Pages

### Frontend Routes
- `/integrations` - Manage service connections
- `/development-hub` - Main development workspace
- `/development` - Legacy development page (kept for compatibility)

### API Routes
- `/api/integrations/*` - Integration management
- `/api/github/*` - GitHub operations
- `/api/deployments/*` - Deployment operations
- `/api/ai/assistant/*` - AI assistant

## 🎓 Learning Path

**New to the system?**
1. Start with `INTEGRATIONS_QUICKSTART.md` (5 min)
2. Follow setup instructions
3. Connect GitHub
4. Explore Dev Hub
5. Try AI assistant

**Want to extend it?**
1. Read `INTEGRATIONS_DEV_HUB_GUIDE.md`
2. Review component architecture
3. Check API documentation
4. Follow existing patterns
5. Add your features!

**Need to integrate a new service?**
1. Review `GITHUB_INTEGRATION.md` as example
2. Add OAuth flow in `backend/src/routes/integrations.js`
3. Create service client (like `github/client.js`)
4. Add UI card in `Integrations.tsx`
5. Update integration config object

## 🔧 Common Tasks

### Add a New Integration
1. Create service client in `backend/src/integrations/{service}/`
2. Add OAuth endpoints in `backend/src/routes/integrations.js`
3. Add service to `integrationConfig` in `Integrations.tsx`
4. Test OAuth flow
5. Add service-specific routes as needed

### Add a New Dev Hub View
1. Create component in `frontend/src/components/development/`
2. Import in `DevelopmentHub.tsx`
3. Add to view type union
4. Add button in navigation
5. Add conditional render in main content

### Extend AI Assistant
1. Add new endpoint in `backend/src/routes/ai-assistant.js`
2. Add quick action in `AIAssistantPanel.tsx`
3. Update suggestion types
4. Test with Claude API

## 🐛 Troubleshooting

**Problem: Can't connect to GitHub**
- Check OAuth app settings match exactly
- Verify redirect URI
- Check environment variables

**Problem: AI not responding**
- Verify `ANTHROPIC_API_KEY` is set
- Check API quota
- Review backend logs

**Problem: Deployments not showing**
- Connect Vercel integration first
- Check Vercel API token
- Verify database connection

**Problem: Code editor not loading files**
- Check GitHub integration is connected
- Verify repository exists in database
- Check API permissions

## 📊 Features by Status

### ✅ Production Ready
- Integrations management UI
- GitHub OAuth flow
- Repository browser
- Pull request manager
- Deployment controls
- AI code review
- AI chat assistant
- Code editor (basic)
- Real-time updates

### ⚠️ Needs Enhancement
- Monaco Editor (currently textarea)
- Commit history UI
- Inline AI suggestions
- WebSocket connection
- Additional service integrations

### 📋 Planned
- CI/CD visualization
- Code quality metrics
- Test runners
- Branch management UI
- Release automation

## 🚀 Performance Tips

- Enable WebSocket for real-time updates
- Use Redis for caching frequently accessed data
- Implement database connection pooling
- Add rate limiting for AI endpoints
- Optimize bundle size (code splitting)

## 🔒 Security Checklist

- [x] OAuth state verification
- [x] Encrypted credential storage
- [x] HMAC webhook verification
- [x] JWT authentication
- [x] Role-based authorization
- [x] Input validation
- [x] SQL injection protection
- [x] XSS protection
- [ ] Rate limiting (add in production)
- [ ] CSRF tokens (add for sensitive actions)
- [ ] Audit logging (add for compliance)

## 📞 Getting Help

1. **Check Documentation**
   - Quick Start for setup issues
   - Complete Guide for feature questions
   - Completion Report for what's available

2. **Check Logs**
   - Backend: Watch `npm run dev` output
   - Frontend: Browser DevTools Console
   - Database: `npx prisma studio`

3. **Common Issues**
   - See Troubleshooting sections in guides
   - Check GitHub issues
   - Review API response errors

## 🎉 Success Metrics

After setup, you should achieve:
- **< 5 min** - First GitHub connection
- **< 10 min** - First deployment
- **< 15 min** - AI code review
- **< 20 min** - Full system exploration

## 📈 Next Steps

**Immediate:**
1. Complete Quick Start guide
2. Connect GitHub
3. Explore Dev Hub
4. Try AI assistant

**Short-term:**
1. Connect Vercel
2. Deploy a project
3. Set up webhooks
4. Install Monaco Editor

**Long-term:**
1. Add more integrations
2. Build custom workflows
3. Extend AI capabilities
4. Add team features

## 🤝 Contributing

When adding features:
- Follow existing component patterns
- Match Salesforce design system
- Add TypeScript types
- Include error handling
- Update documentation
- Test thoroughly

## 📄 License

Part of Company OS - See main project LICENSE file.

---

**Version:** 1.0.0  
**Last Updated:** February 12, 2026  
**Status:** Production Ready ✅  

**Questions?** Start with the Quick Start guide!
