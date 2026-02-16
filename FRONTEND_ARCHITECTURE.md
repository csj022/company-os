# Company OS Frontend Architecture

> Enterprise-grade React application for mission control platform

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Design System](#design-system)
4. [State Management](#state-management)
5. [Routing](#routing)
6. [API Integration](#api-integration)
7. [Authentication](#authentication)
8. [Component Library](#component-library)
9. [Development Workflow](#development-workflow)
10. [Build & Deployment](#build--deployment)

---

## Tech Stack

### Core Framework
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server

### Styling
- **TailwindCSS 4** - Utility-first CSS framework
- **@tailwindcss/vite** - Native Vite integration
- **Custom Design System** - Salesforce-inspired enterprise theme

### State Management
- **Zustand** - Lightweight state management
  - `authStore` - Authentication state
  - `uiStore` - UI preferences (sidebar, theme)

### Data Fetching
- **TanStack Query (React Query)** - Server state management
  - Caching, background updates, optimistic UI
  - 5-minute stale time by default

### Routing
- **React Router v6** - Declarative routing
  - Protected routes for authenticated pages
  - Public routes with auto-redirect

### Icons
- **Lucide React** - Modern, clean icon library

### Utilities
- **clsx** - Conditional classNames
- **tailwind-merge** - Smart Tailwind class merging

---

## Project Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/               # Reusable UI components
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── StatusIndicator.tsx
│   ├── lib/                   # Utilities and helpers
│   │   ├── api.ts            # API client
│   │   └── utils.ts          # Utility functions (cn)
│   ├── pages/                 # Page components
│   │   ├── auth/             # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── OAuthCallback.tsx
│   │   ├── Dashboard.tsx     # Command Center
│   │   ├── Development.tsx   # Development Hub
│   │   ├── Design.tsx        # Design System Manager
│   │   ├── Team.tsx          # Team Coordination
│   │   ├── Social.tsx        # Social Command Post
│   │   ├── Agents.tsx        # Agent Orchestration
│   │   └── Intelligence.tsx  # Intelligence Hub
│   ├── store/                 # Zustand stores
│   │   ├── authStore.ts      # Authentication state
│   │   └── uiStore.ts        # UI preferences
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── .env.example              # Environment variables template
├── index.html                # HTML entry point
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

---

## Design System

### Color Palette

#### Salesforce Blue (Primary)
```css
--salesforce-blue: #0176D3      /* Primary brand color */
--salesforce-blue-dark: #014F86 /* Hover/active states */
--salesforce-blue-light: #1A8FE3 /* Highlights */
```

#### Dark Theme Colors
```css
--dark-bg: #0F1419              /* Main background */
--dark-card: #1A1F28            /* Card background */
--dark-border: #3A4352          /* Borders */
--dark-hover: #232931           /* Hover states */
--dark-text-primary: #F1F5F9    /* Primary text */
--dark-text-secondary: #8B98AD  /* Secondary text */
--dark-text-tertiary: #64748B   /* Tertiary text */
```

#### Semantic Colors
```css
--success: #10B981 (emerald-500)
--warning: #F59E0B (amber-500)
--error: #EF4444 (red-500)
--info: #3B82F6 (blue-500)
```

### Typography

- **Font Family**: System font stack (SF Pro on macOS, Segoe UI on Windows)
- **Headings**: Bold, white (#F1F5F9)
- **Body Text**: Regular, slate-100 (#F1F5F9)
- **Secondary Text**: Medium, slate-400 (#8B98AD)

### Component Styles

#### Cards
- Background: `#1A1F28`
- Border: `#3A4352`
- Border radius: `0.75rem` (12px)
- Padding: `1.5rem` (24px)
- Hover: Border lightens to `#475569`

#### Buttons
- **Primary**: Salesforce blue background, white text, shadow on hover
- **Secondary**: Dark gray background, border, no shadow
- **Ghost**: Transparent background, hover shows dark gray
- **Danger**: Red background for destructive actions

#### Badges
- Small, rounded rectangles
- Color-coded by status (primary, success, warning, error, neutral)
- Transparent backgrounds with colored text and borders

#### Status Indicators
- Circular dots with glow effect
- **Online**: Green (`#10B981`) with subtle glow
- **Offline**: Gray (`#64748B`)
- **Connecting**: Amber (`#F59E0B`) with pulse animation
- **Error**: Red (`#EF4444`)

### Animations

```css
/* Float animation for decorative elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Pulse ring for status indicators */
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Slide animations for modals/panels */
@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
```

---

## State Management

### Zustand Stores

#### Auth Store (`authStore.ts`)
Manages authentication state with localStorage persistence.

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email, password) => Promise<void>;
  loginWithOAuth: (provider, code) => Promise<void>;
  logout: () => void;
  setUser: (user) => void;
  setToken: (token) => void;
}
```

**Usage:**
```typescript
const { user, login, logout } = useAuthStore();
```

#### UI Store (`uiStore.ts`)
Manages UI preferences and state.

```typescript
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed) => void;
  toggleTheme: () => void;
  setTheme: (theme) => void;
}
```

**Usage:**
```typescript
const { sidebarCollapsed, toggleSidebar } = useUIStore();
```

---

## Routing

### Route Structure

```typescript
/ (root)                → Redirect to /dashboard
/login                  → Login page (public)
/signup                 → Signup page (public)
/auth/callback          → OAuth callback handler
/dashboard              → Command Center (protected)
/development            → Development Hub (protected)
/design                 → Design System Manager (protected)
/team                   → Team Coordination (protected)
/social                 → Social Command Post (protected)
/agents                 → Agent Orchestration (protected)
/intelligence           → Intelligence Hub (protected)
```

### Protected Routes

All main pages are wrapped in `ProtectedRoute` component:
- Checks `isAuthenticated` from auth store
- Redirects to `/login` if not authenticated
- Wraps page in `DashboardLayout` (sidebar + header)

### Public Routes

Authentication pages are wrapped in `PublicRoute`:
- Redirects to `/dashboard` if already authenticated
- Prevents authenticated users from seeing login/signup

---

## API Integration

### API Client (`lib/api.ts`)

Centralized API client using native `fetch`:

```typescript
import api from './lib/api';

// GET request
const data = await api.get('/users');

// POST request
const user = await api.post('/users', { name: 'John' });

// With authentication token
const data = await api.get('/protected', { 
  token: authStore.getState().token 
});
```

**Features:**
- Automatic JSON parsing
- Authorization header injection
- Error handling
- TypeScript generics for type safety

### TanStack Query Setup

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

**Usage Example:**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users'),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (user) => api.post('/users', user),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

## Authentication

### Flow

1. **Login**: User enters email/password → `authStore.login()` → API call → Store token + user
2. **OAuth**: User clicks "GitHub" → Redirect to provider → Callback to `/auth/callback` → Exchange code → Store token
3. **Protected Access**: Route checks `isAuthenticated` → Allow or redirect to login
4. **Logout**: Clear token and user from store → Redirect to login

### Token Storage

- Stored in Zustand store with `persist` middleware
- Persisted to `localStorage` under key `auth-storage`
- Automatically loaded on app initialization
- Included in API requests via `Authorization` header

### Mock Authentication (Current)

For development, login accepts any credentials and returns a mock user.

**TODO**: Replace with real API calls:
```typescript
const response = await api.post('/auth/login', { email, password });
setUser(response.user);
setToken(response.token);
```

---

## Component Library

### UI Components

All components follow shadcn/ui patterns with Tailwind styling.

#### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `danger`  
**Sizes**: `sm`, `md`, `lg`

#### Card
```tsx
<Card>
  <CardHeader>
    <span>Title</span>
    <Badge variant="success">Status</Badge>
  </CardHeader>
  <p>Content goes here</p>
</Card>
```

#### Input
```tsx
<Input
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Badge
```tsx
<Badge variant="success">Online</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

#### StatusIndicator
```tsx
<StatusIndicator status="online" />
<StatusIndicator status="connecting" />
<StatusIndicator status="error" />
```

### Layout Components

#### Sidebar
- Fixed left navigation
- Collapsible (16px collapsed, 256px expanded)
- Active route highlighting
- Salesforce blue accent for active items

#### Header
- Fixed top bar
- Search input
- Notification bell
- Settings button
- User profile menu with logout

#### DashboardLayout
Wraps protected pages with Sidebar + Header:
```tsx
<DashboardLayout>
  <YourPage />
</DashboardLayout>
```

---

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

**Variables:**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000/api`)
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `VITE_ENABLE_ANALYTICS` - Enable analytics tracking
- `VITE_ENABLE_REAL_TIME` - Enable WebSocket real-time updates

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** configured for React best practices
- **Prettier** for consistent formatting (recommended)
- **Component naming**: PascalCase for components, camelCase for utilities
- **File naming**: PascalCase for components, camelCase for utilities

---

## Build & Deployment

### Production Build

```bash
npm run build
```

**Output:**
- Optimized bundle in `dist/` directory
- Code splitting for routes
- Minified CSS and JS
- Source maps for debugging

### Deployment Options

#### 1. Vercel (Recommended)
```bash
vercel
```

#### 2. Netlify
```bash
netlify deploy --prod
```

#### 3. Static Hosting
Upload `dist/` folder to any static hosting:
- AWS S3 + CloudFront
- GitHub Pages
- Cloudflare Pages

### Environment Variables for Production

Set these in your hosting platform:
- `VITE_API_URL` - Production API URL
- `VITE_GITHUB_CLIENT_ID` - Production OAuth client ID

---

## Next Steps & TODOs

### Immediate (MVP)

- [ ] Connect to real backend API
- [ ] Implement actual authentication endpoints
- [ ] Add OAuth flow for GitHub integration
- [ ] Real-time updates via WebSockets
- [ ] Error boundary components
- [ ] Loading skeletons for better UX

### Short-term

- [ ] Dark/light theme toggle (currently dark only)
- [ ] User profile page
- [ ] Settings page
- [ ] Notification system
- [ ] Search functionality
- [ ] Command palette (⌘K)

### Long-term

- [ ] PWA support (offline mode)
- [ ] Mobile responsive optimizations
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] E2E tests (Playwright)
- [ ] Component Storybook
- [ ] Analytics integration
- [ ] Feature flags system

---

## Performance Considerations

### Code Splitting

- Route-based code splitting via React Router
- Lazy load heavy components with `React.lazy()`
- Suspense boundaries for loading states

### Optimization Tips

```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Memoize expensive components
const MemoizedComponent = memo(ExpensiveComponent);

// Use TanStack Query for caching
// - Reduces API calls
// - Background refetching
// - Optimistic updates
```

### Bundle Size

Current production bundle (estimated):
- **Vendor**: ~150KB (React, Router, Zustand, TanStack Query)
- **App**: ~80KB (components, pages, styles)
- **Total (gzipped)**: ~230KB

**Optimizations:**
- Tree-shaking enabled
- No unused dependencies
- TailwindCSS purges unused styles
- Vite optimizes chunks automatically

---

## Troubleshooting

### Common Issues

**1. "Module not found" errors**
```bash
npm install
# or
rm -rf node_modules package-lock.json && npm install
```

**2. Tailwind styles not applying**
- Check `tailwind.config.js` content paths
- Verify `@tailwindcss/vite` is in `vite.config.ts`
- Restart dev server

**3. TypeScript errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

**4. Port already in use**
```bash
# Change port in vite.config.ts
server: {
  port: 5174, // Different port
}
```

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vite.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Router](https://reactrouter.com)

---

**Architecture Version**: 1.0  
**Last Updated**: February 12, 2025  
**Maintainer**: Company OS Team
