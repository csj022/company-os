#!/bin/bash
# Company OS Production Deployment Script
# 
# This script attempts to deploy Company OS to Railway and Vercel via CLI.
# If interactive login is required, it will provide instructions.
#
# Prerequisites:
# - Railway CLI installed (npm i -g @railway/cli)
# - Vercel CLI installed (npm i -g vercel)
# - GitHub repository created and pushed
#
# Usage: ./deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Company OS Production Deployment Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if CLIs are installed
echo -e "${YELLOW}→ Checking prerequisites...${NC}"

if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo "  Install: npm i -g @railway/cli"
    exit 1
fi
echo -e "${GREEN}✓ Railway CLI installed${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not found${NC}"
    echo "  Install: npm i -g vercel"
    exit 1
fi
echo -e "${GREEN}✓ Vercel CLI installed${NC}"
echo ""

# Step 1: Check if logged into Railway
echo -e "${BLUE}═══ Step 1: Railway Authentication ═══${NC}"
if railway whoami &> /dev/null; then
    RAILWAY_USER=$(railway whoami)
    echo -e "${GREEN}✓ Logged in to Railway as: $RAILWAY_USER${NC}"
else
    echo -e "${YELLOW}→ Not logged in to Railway${NC}"
    echo ""
    echo "Please log in to Railway:"
    echo "  railway login"
    echo ""
    echo "Then run this script again."
    exit 1
fi
echo ""

# Step 2: Deploy Backend to Railway
echo -e "${BLUE}═══ Step 2: Deploy Backend to Railway ═══${NC}"
cd "$BACKEND_DIR"

# Check if railway.json exists
if [ ! -f "railway.json" ]; then
    echo -e "${RED}✗ railway.json not found${NC}"
    exit 1
fi

echo -e "${YELLOW}→ Initializing Railway project...${NC}"
railway init -n company-os-backend || true

echo -e "${YELLOW}→ Adding PostgreSQL database...${NC}"
railway add -d postgresql

echo -e "${YELLOW}→ Adding Redis database...${NC}"
railway add -d redis

echo -e "${YELLOW}→ Deploying backend...${NC}"
railway up

echo -e "${GREEN}✓ Backend deployed to Railway${NC}"

echo -e "${YELLOW}→ Getting backend URL...${NC}"
BACKEND_URL=$(railway domain)
echo -e "${GREEN}✓ Backend URL: $BACKEND_URL${NC}"
echo ""

# Step 3: Set environment variables
echo -e "${BLUE}═══ Step 3: Configure Backend Environment ═══${NC}"
echo -e "${YELLOW}→ Setting environment variables...${NC}"

railway variables set JWT_SECRET="WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs="
railway variables set JWT_EXPIRATION="7d"
railway variables set SESSION_SECRET="WPIyo9BEJrYOWZ1odiy1MYv3rmqQYo5XOFzTO3qhZLs="
railway variables set NODE_ENV="production"
railway variables set PORT="3000"

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Step 4: Run database migrations
echo -e "${BLUE}═══ Step 4: Run Database Migrations ═══${NC}"
echo -e "${YELLOW}→ Running Prisma migrations...${NC}"
cd "$PROJECT_ROOT"
railway run npx prisma migrate deploy

echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Step 5: Deploy Frontend to Vercel
echo -e "${BLUE}═══ Step 5: Deploy Frontend to Vercel ═══${NC}"
cd "$FRONTEND_DIR"

# Check if logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}→ Not logged in to Vercel${NC}"
    echo ""
    echo "Please log in to Vercel:"
    echo "  vercel login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

VERCEL_USER=$(vercel whoami)
echo -e "${GREEN}✓ Logged in to Vercel as: $VERCEL_USER${NC}"

echo -e "${YELLOW}→ Setting environment variable...${NC}"
vercel env add VITE_API_URL production <<< "$BACKEND_URL"

echo -e "${YELLOW}→ Deploying frontend to production...${NC}"
vercel --prod --yes

echo -e "${GREEN}✓ Frontend deployed to Vercel${NC}"

echo -e "${YELLOW}→ Getting frontend URL...${NC}"
FRONTEND_URL=$(vercel ls --prod | grep -oE 'https://[^ ]+' | head -1)
echo -e "${GREEN}✓ Frontend URL: $FRONTEND_URL${NC}"
echo ""

# Step 6: Update cross-references
echo -e "${BLUE}═══ Step 6: Update Cross-References ═══${NC}"
cd "$BACKEND_DIR"

echo -e "${YELLOW}→ Updating FRONTEND_URL in Railway...${NC}"
railway variables set FRONTEND_URL="$FRONTEND_URL"
railway variables set API_URL="$BACKEND_URL"

echo -e "${GREEN}✓ Cross-references updated${NC}"
echo ""

# Step 7: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Deployment Complete! 🎉                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Production URLs:${NC}"
echo -e "  Frontend:  ${BLUE}$FRONTEND_URL${NC}"
echo -e "  Backend:   ${BLUE}$BACKEND_URL${NC}"
echo -e "  GraphQL:   ${BLUE}$BACKEND_URL/graphql${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Set up GitHub OAuth:"
echo "     → Go to: https://github.com/settings/developers"
echo "     → Create new OAuth App"
echo "     → Homepage: $FRONTEND_URL"
echo "     → Callback: $BACKEND_URL/api/auth/github/callback"
echo "     → Copy Client ID and Secret"
echo "     → Run: railway variables set GITHUB_CLIENT_ID=<id>"
echo "     → Run: railway variables set GITHUB_CLIENT_SECRET=<secret>"
echo ""
echo "  2. Test your deployment:"
echo "     → Open: $FRONTEND_URL"
echo "     → Create test account"
echo "     → Test GitHub OAuth login"
echo ""
echo "  3. Monitor logs:"
echo "     → Railway: railway logs"
echo "     → Vercel: vercel logs $FRONTEND_URL"
echo ""
echo -e "${GREEN}For detailed documentation, see:${NC}"
echo "  • DEPLOYMENT_GUIDE.md"
echo "  • DEPLOY_CHECKLIST.md"
echo "  • DEPLOYMENT_STATUS.md"
echo ""
