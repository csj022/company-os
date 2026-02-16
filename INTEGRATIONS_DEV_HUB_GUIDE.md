# Company OS: Integrations & Development Hub Complete Guide

## Overview

This guide covers the comprehensive Integrations Management System and Development Hub built for Company OS. The system enables full GitHub integration, deployment controls, AI-powered code editing, and seamless workflow automation.

## 🎯 Features Delivered

### 1. **Integrations Management Page**

**Location:** `/integrations`

**Features:**
- Visual dashboard for all service integrations
- OAuth connection flow for GitHub, Vercel, Figma, Slack, Twitter, LinkedIn
- Status indicators (Connected, Error, Inactive)
- Last sync timestamps
- Configuration panels for each service
- Connect/Disconnect actions
- Manual sync triggers
- Real-time status updates

**Components:**
- `frontend/src/pages/Integrations.tsx` - Main integrations page
- `backend/src/routes/integrations.js` - Integration API endpoints

**API Endpoints:**
```
GET    /api/integrations              - List all integrations
GET    /api/integrations/:service     - Get specific integration
POST   /api/integrations/:service/connect     - Initiate OAuth
DELETE /api/integrations/:service/disconnect  - Remove integration
POST   /api/integrations/:service/sync        - Manual sync
GET    /api/integrations/:service/status      - Health check
```

### 2. **Enhanced Development Hub**

**Location:** `/development-hub`

**Features:**
- Multi-view interface (Overview, Repositories, PRs, Deployments, Editor)
- Real-time statistics dashboard
- Activity feed with recent events
- Seamless navigation between views
- WebSocket support for live updates

**Components:**
- `frontend/src/pages/DevelopmentHub.tsx` - Main hub page
- Multiple specialized sub-components

### 3. **Repository Browser**

**Features:**
- List all connected GitHub repositories
- Search and filter capabilities
- Repository metadata display:
  - Stars, forks, language
  - Visibility (public/private)
  - Last update time
  - Default branch
- Direct links to GitHub
- Repository selection for editing

**Component:** `frontend/src/components/development/RepositoryBrowser.tsx`

**API Endpoints:**
```
GET /api/github/repositories           - List all repos
GET /api/github/repositories/:repoId   - Get repo details
```

### 4. **Pull Request Manager**

**Features:**
- View all pull requests (open, merged, closed)
- Filter by status
- PR details:
  - Title, description, author
  - Branch information (head → base)
  - Review status (approved, changes requested, pending)
  - AI review status (not started, in progress, completed)
  - Comments and reviews count
  - Code changes (+/-lines)
- Actions:
  - Merge PR (with approval check)
  - Request AI code review
  - View on GitHub
- Real-time status updates

**Component:** `frontend/src/components/development/PullRequestManager.tsx`

**API Endpoints:**
```
GET  /api/github/pull-requests                  - List PRs
POST /api/github/pull-requests/:prId/merge      - Merge PR
POST /api/github/pull-requests/:prId/request-review - Request AI review
```

### 5. **Deployment Controls**

**Features:**
- Quick deploy buttons (Production, Preview, Development)
- Deployment history with details:
  - State (queued, building, ready, error, canceled)
  - Environment (production, preview, development)
  - Branch and commit SHA
  - Build duration
  - Health score (0-100)
  - Creator information
- Actions:
  - Deploy to any environment
  - Rollback to previous deployment
  - View deployment logs
  - Visit live deployment
- Real-time deployment status updates
- Auto-refresh every 10 seconds

**Component:** `frontend/src/components/development/DeploymentControls.tsx`

**API Endpoints:**
```
GET  /api/deployments                        - List deployments
GET  /api/deployments/:deploymentId          - Get deployment details
POST /api/deployments/deploy                 - Trigger deployment
POST /api/deployments/:deploymentId/rollback - Rollback
GET  /api/deployments/:deploymentId/logs     - Get logs
GET  /api/deployments/stats                  - Deployment statistics
```

### 6. **Code Editor with Monaco**

**Features:**
- Full-featured code editor (Monaco Editor ready)
- File tree browser
- Branch selector
- File operations:
  - View file contents
  - Edit and save files
  - Syntax highlighting
  - Line/character count
- Git integration:
  - Commit changes
  - Branch switching
- AI assistant integration
- Fullscreen mode
- Unsaved changes indicator

**Component:** `frontend/src/components/development/CodeEditor.tsx`

**API Endpoints:**
```
GET /api/github/repositories/:repoId/tree       - Get file tree
GET /api/github/repositories/:repoId/contents/* - Get file contents
PUT /api/github/repositories/:repoId/contents/* - Update file
```

**Setup for Production:**
To enable full Monaco Editor:
```bash
npm install @monaco-editor/react
```

Then replace the textarea in `CodeEditor.tsx` with:
```tsx
import Editor from '@monaco-editor/react';

<Editor
  height="600px"
  language={language}
  value={fileContent}
  onChange={handleContentChange}
  theme="vs-dark"
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
  }}
/>
```

### 7. **AI Coding Assistant**

**Features:**
- Real-time chat with AI
- Quick action buttons:
  - Review Code
  - Find Bugs
  - Suggest Improvements
  - Add Comments
- AI-powered suggestions panel:
  - Refactoring suggestions
  - Bug fixes
  - Optimizations
  - Documentation improvements
- One-click apply suggestions
- Code snippet support
- Context-aware responses
- Conversation history

**Component:** `frontend/src/components/development/AIAssistantPanel.tsx`

**API Endpoints:**
```
POST /api/ai/assistant/chat           - Chat with assistant
POST /api/ai/assistant/code-review    - Request code review
POST /api/ai/assistant/generate-code  - Generate code
POST /api/ai/assistant/refactor       - Get refactoring suggestions
POST /api/ai/assistant/explain        - Explain code
POST /api/ai/assistant/apply-suggestion - Apply AI suggestion
```

**Powered by Claude 3.5 Sonnet:**
- Uses Anthropic API
- Requires `ANTHROPIC_API_KEY` in environment variables
- Supports code generation, review, refactoring, and explanation
- Context-aware based on current file and selection

### 8. **Workflow Automation** (Foundation)

**Built-in Automation:**
- PR opened → Trigger AI code review
- Push to main → Trigger deployment
- Deployment ready → Health check
- PR merged → Record metrics
- Integration errors → Send alerts

**Event System:**
- `backend/src/events/eventBus.js` - Event bus implementation
- `backend/src/events/handlers/github.js` - GitHub event handlers
- WebSocket support for real-time UI updates

## 🗂️ File Structure

### Frontend
```
frontend/src/
├── pages/
│   ├── Integrations.tsx            # Integrations management
│   ├── DevelopmentHub.tsx          # Main dev hub
│   └── Development.tsx             # Legacy dev page
├── components/
│   ├── development/
│   │   ├── RepositoryBrowser.tsx   # Repo list
│   │   ├── PullRequestManager.tsx  # PR management
│   │   ├── DeploymentControls.tsx  # Deployment UI
│   │   ├── CodeEditor.tsx          # Code editor
│   │   └── AIAssistantPanel.tsx    # AI assistant
│   ├── ui/
│   │   ├── Badge.tsx               # Status badges
│   │   ├── Button.tsx              # Buttons
│   │   ├── Card.tsx                # Card component
│   │   └── Input.tsx               # Input fields
│   └── layout/
│       ├── Sidebar.tsx             # Nav sidebar
│       └── Header.tsx              # Top header
└── lib/
    └── api.ts                      # API client
```

### Backend
```
backend/src/
├── routes/
│   ├── integrations.js             # Integration routes
│   ├── github.js                   # GitHub routes
│   ├── deployments.js              # Deployment routes
│   ├── ai-assistant.js             # AI assistant routes
│   └── index.js                    # Route registration
├── services/
│   └── integration.service.js      # Integration logic
├── integrations/
│   └── github/
│       ├── client.js               # GitHub API client
│       ├── oauth.js                # OAuth flow
│       ├── webhooks.js             # Webhook handling
│       ├── sync.js                 # Data sync
│       └── events.js               # Event handlers
└── events/
    ├── eventBus.js                 # Event system
    └── handlers/
        └── github.js               # GitHub events
```

## 🚀 Setup & Installation

### 1. Environment Variables

Add to `.env`:
```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/integrations/github/callback

# Vercel
VERCEL_CLIENT_ID=your_vercel_oauth_client_id
VERCEL_CLIENT_SECRET=your_vercel_oauth_client_secret

# AI Assistant (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/companyos

# Encryption
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# JWT
JWT_SECRET=your_jwt_secret
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install @octokit/rest @octokit/webhooks axios

# Frontend
cd frontend
npm install lucide-react
```

### 3. Database Setup

The Prisma schema already includes all necessary tables:
- `integrations` - Integration configurations
- `webhooks` - Webhook subscriptions
- `repositories` - GitHub repositories
- `pull_requests` - Pull requests
- `deployments` - Deployment records
- `agents` - AI agents
- `agent_tasks` - Agent tasks

Run migrations:
```bash
npx prisma migrate dev
```

### 4. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Name: `Company OS`
   - Homepage: `http://localhost:3000`
   - Callback: `http://localhost:3000/api/integrations/github/callback`
4. Copy Client ID and Client Secret to `.env`

### 5. Start Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📖 Usage Guide

### Connecting GitHub

1. Navigate to `/integrations`
2. Click "Connect GitHub"
3. Authorize on GitHub
4. You'll be redirected back with connection confirmed
5. Repositories will auto-sync

### Viewing Repositories

1. Go to `/development-hub`
2. Click "Repositories" tab
3. Search or browse repositories
4. Click a repository to select it
5. View details and open in GitHub

### Managing Pull Requests

1. Navigate to `/development-hub`
2. Click "Pull Requests" tab
3. Filter by status (Open, Merged, Closed)
4. Click "Request AI Review" for code analysis
5. Click "Merge" when approved and ready

### Deploying Projects

1. Go to `/development-hub`
2. Click "Deployments" tab
3. Use Quick Deploy for instant deployment
4. Select environment (Production, Preview, Development)
5. Monitor deployment status in real-time
6. View logs or rollback if needed

### Editing Code

1. Navigate to `/development-hub`
2. Click "Editor" tab
3. Select a repository from the file tree
4. Choose a branch
5. Click on a file to edit
6. Make changes (auto-detect unsaved)
7. Click "Save" to commit changes
8. Use "Ask AI Assistant" for help

### Using AI Assistant

1. Open the AI Assistant panel (right sidebar in Editor)
2. Use Quick Actions for common tasks:
   - Review Code
   - Find Bugs
   - Suggest Improvements
   - Add Comments
3. Or type a custom prompt in chat
4. Review suggestions and apply with one click

## 🔒 Security Considerations

### Credentials Storage
- All OAuth tokens encrypted using AES-256-GCM
- Encryption key stored in environment variables
- Never exposed to frontend

### Webhook Verification
- HMAC SHA256 signature verification
- Prevents unauthorized webhook events
- Validates event source

### Authorization
- Role-based access control (owner, admin, member)
- User authentication required for all routes
- Organization-scoped data access

### Rate Limiting
- Automatic throttling via Octokit
- Retry logic for rate limit errors
- Health monitoring for quota usage

## 🎨 Design System

All components follow Company OS Salesforce-style design:
- Dark theme (`#1A1F28` background)
- Accent color: `#0176D3` (Salesforce blue)
- Component library: Badge, Button, Card, Input
- Consistent spacing and typography
- Responsive grid layouts

## 🔄 Real-time Updates

### WebSocket Integration (Ready)
- Event bus publishes to WebSocket
- Frontend subscribes to relevant channels
- Auto-update UI on events:
  - PR status changes
  - Deployment progress
  - Integration sync completion

**To enable WebSocket:**
```javascript
// Frontend
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI based on event type
};
```

## 📊 Monitoring & Analytics

### Built-in Metrics
- Deployment frequency
- PR merge time
- Build success rate
- Integration health status

### Event Logging
All significant events logged to `events` table:
- PR opened/merged
- Deployment created/completed
- Integration connected/synced
- AI review requested/completed

## 🤖 AI Agent Integration

### Triggering Agents
```javascript
// Example: Trigger CodeReviewAgent on PR open
eventBus.subscribe('github.pull_request', async (payload) => {
  if (payload.action === 'opened') {
    await spawnAgent('CodeReviewAgent', {
      prId: payload.pull_request.id,
      repoName: payload.repository.full_name,
    });
  }
});
```

### Available Agent Types
- `CodeReviewAgent` - Automated code reviews
- `DeploymentMonitorAgent` - Deployment health checks
- `IssueTriageAgent` - Issue classification
- Custom agents can be added

## 🐛 Troubleshooting

### GitHub Integration Issues
- **"Not Found"**: Connect GitHub integration first at `/integrations`
- **"Unauthorized"**: Re-connect GitHub (token may have expired)
- **"Rate Limited"**: Wait for rate limit reset or reduce sync frequency

### Deployment Issues
- **"Vercel integration not found"**: Connect Vercel at `/integrations`
- **Deployment stuck in "building"**: Check Vercel dashboard for errors
- **Can't rollback**: Only production deployments support rollback

### AI Assistant Issues
- **No response**: Check `ANTHROPIC_API_KEY` is set correctly
- **Rate limit**: You've exceeded Claude API quota
- **Invalid response**: Check API response format in logs

## 🚀 Future Enhancements

### Planned Features
- [ ] GitHub Actions integration and visualization
- [ ] CI/CD pipeline builder
- [ ] Code quality metrics dashboard
- [ ] Automated testing integration
- [ ] Multi-repository operations
- [ ] Team collaboration features
- [ ] Advanced code search
- [ ] Git history visualization
- [ ] Merge conflict resolution UI
- [ ] Branch management (create, delete, merge)
- [ ] Release automation
- [ ] Dependency update tracking
- [ ] Security vulnerability scanning

### Monaco Editor Enhancements
- [ ] IntelliSense/autocomplete
- [ ] Git diff view
- [ ] Multi-file editing (tabs)
- [ ] Find and replace
- [ ] Code folding
- [ ] Minimap navigation
- [ ] Theme customization
- [ ] Vim/Emacs keybindings

### AI Assistant Enhancements
- [ ] Code completion (Copilot-style)
- [ ] Inline suggestions
- [ ] Test generation
- [ ] Documentation generation
- [ ] Code translation (language to language)
- [ ] Accessibility checks
- [ ] Performance profiling
- [ ] Security scanning

## 📝 API Documentation

Complete API documentation available at:
- `/api/health` - Health check endpoint
- Swagger/OpenAPI docs (to be added)

## 🤝 Contributing

When adding new features:
1. Follow existing component structure
2. Match Salesforce-style design system
3. Add proper TypeScript types
4. Handle errors gracefully
5. Add loading states
6. Update this documentation

## 📄 License

Part of Company OS - See main project LICENSE file.

---

**Built with:**
- React + TypeScript
- Express.js + Node.js
- PostgreSQL + Prisma
- Claude 3.5 Sonnet (Anthropic)
- GitHub API (Octokit)
- Vercel API
- WebSocket (real-time)

**Questions or issues?** Check the logs or create an issue in the repository.
