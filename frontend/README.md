# Company OS Frontend

> Enterprise mission control platform - React frontend application

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173
```

## 📦 What's Included

- ✅ **React 19** with TypeScript
- ✅ **TailwindCSS 4** with Salesforce-inspired design system
- ✅ **React Router** for navigation
- ✅ **Zustand** for state management
- ✅ **TanStack Query** for API calls
- ✅ **Lucide Icons** for beautiful icons
- ✅ **Authentication** pages and flow
- ✅ **7 Main Sections**: Dashboard, Development, Design, Team, Social, Agents, Intelligence
- ✅ **Responsive Layout** with collapsible sidebar
- ✅ **Dark Theme** with Salesforce blue accent (#0176D3)

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, Header, DashboardLayout
│   └── ui/              # Button, Card, Input, Badge, StatusIndicator
├── pages/
│   ├── auth/            # Login, Signup, OAuthCallback
│   └── *.tsx            # Dashboard, Development, Design, Team, Social, Agents, Intelligence
├── store/               # Zustand stores (auth, UI)
├── lib/                 # API client, utilities
├── App.tsx              # Main app with routing
└── index.css            # Global styles + design system
```

## 🎨 Design System

### Colors
- **Primary**: #0176D3 (Salesforce blue)
- **Background**: #0F1419 (dark)
- **Card**: #1A1F28
- **Border**: #3A4352

### Components
All components are styled with TailwindCSS and follow shadcn/ui patterns:
- Button (primary, secondary, ghost, danger)
- Card with CardHeader
- Input fields
- Badge (success, warning, error, neutral)
- StatusIndicator (online, offline, connecting, error)

## 🔐 Authentication

Currently using **mock authentication** for development:
- Any email/password will work
- Token is stored in localStorage
- Protected routes check authentication status

**To implement real auth:**
Update `src/store/authStore.ts` to call your backend API.

## 🛠️ Available Scripts

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Lint code
```

## 🌐 API Integration

API calls are configured to proxy to `http://localhost:3000/api` in development.

Update `VITE_API_URL` in `.env` for different environments.

## 📚 Documentation

See [FRONTEND_ARCHITECTURE.md](../FRONTEND_ARCHITECTURE.md) for:
- Detailed architecture overview
- State management patterns
- API integration guide
- Component library reference
- Deployment instructions

## 🚢 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel

# Or deploy dist/ folder to any static hosting
```

## 🎯 Next Steps

1. **Connect to Backend**: Update API endpoints in `lib/api.ts`
2. **Real Authentication**: Implement OAuth flows
3. **WebSocket Integration**: Add real-time updates
4. **Data Integration**: Connect to GitHub, Vercel, Slack, etc.
5. **Error Handling**: Add error boundaries and toast notifications

## 📄 License

Private - Company OS Project
