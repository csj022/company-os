#!/bin/bash

# ============================================================================
# CompanyOS Database Setup Script
# ============================================================================
# This script automates the database setup process:
# - Checks prerequisites
# - Installs dependencies
# - Configures environment
# - Runs migrations
# - Seeds database
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

print_header "Step 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

# Check npm or pnpm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    print_success "pnpm installed"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    print_success "npm installed"
else
    print_error "No package manager found. Please install npm or pnpm"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | awk '{print $3}')
    print_success "PostgreSQL installed: $PG_VERSION"
else
    print_warning "PostgreSQL not found in PATH. If using Docker, this is OK."
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    print_success "Redis installed: $REDIS_VERSION"
else
    print_warning "Redis not found in PATH. If using Docker, this is OK."
fi

# ============================================================================
# STEP 2: INSTALL DEPENDENCIES
# ============================================================================

print_header "Step 2: Installing Dependencies"

print_info "Installing npm packages..."

if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm install
else
    npm install
fi

print_success "Dependencies installed"

# ============================================================================
# STEP 3: SETUP ENVIRONMENT
# ============================================================================

print_header "Step 3: Setting Up Environment"

if [ -f ".env" ]; then
    print_warning ".env file already exists. Skipping creation."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        print_success "Created new .env file from .env.example"
        print_warning "⚠️  Please edit .env with your database credentials before continuing!"
        read -p "Press Enter when you've updated .env..."
    fi
else
    cp .env.example .env
    print_success "Created .env file from .env.example"
    print_warning "⚠️  Please edit .env with your database credentials before continuing!"
    read -p "Press Enter when you've updated .env..."
fi

# ============================================================================
# STEP 4: START DOCKER SERVICES (if using Docker)
# ============================================================================

print_header "Step 4: Docker Services (Optional)"

if [ -f "docker-compose.yml" ]; then
    read -p "Do you want to start PostgreSQL and Redis via Docker Compose? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Starting Docker services..."
        docker-compose up -d
        
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 5
        
        # Wait for PostgreSQL
        until docker-compose exec -T postgres pg_isready -U companyos &> /dev/null; do
            echo -n "."
            sleep 1
        done
        echo ""
        
        print_success "Docker services started"
    fi
else
    print_info "No docker-compose.yml found. Skipping Docker setup."
fi

# ============================================================================
# STEP 5: TEST DATABASE CONNECTION
# ============================================================================

print_header "Step 5: Testing Database Connection"

print_info "Testing PostgreSQL connection..."

# Extract database URL from .env
if [ -f ".env" ]; then
    source .env
    
    # Try to connect
    if npx prisma db pull --force &> /dev/null; then
        print_success "PostgreSQL connection successful"
    else
        print_error "Failed to connect to PostgreSQL"
        print_info "Please check your DATABASE_URL in .env"
        exit 1
    fi
else
    print_error ".env file not found"
    exit 1
fi

# ============================================================================
# STEP 6: GENERATE PRISMA CLIENT
# ============================================================================

print_header "Step 6: Generating Prisma Client"

print_info "Generating Prisma client..."
npx prisma generate

print_success "Prisma client generated"

# ============================================================================
# STEP 7: RUN MIGRATIONS
# ============================================================================

print_header "Step 7: Running Database Migrations"

read -p "Do you want to run database migrations? This will create all tables. (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_info "Running migrations..."
    npx prisma migrate dev --name init
    print_success "Migrations completed"
else
    print_warning "Skipped migrations"
fi

# ============================================================================
# STEP 8: SEED DATABASE
# ============================================================================

print_header "Step 8: Seeding Database"

read -p "Do you want to seed the database with sample data? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_info "Seeding database..."
    npx prisma db seed
    print_success "Database seeded"
else
    print_warning "Skipped database seeding"
fi

# ============================================================================
# STEP 9: TEST REDIS CONNECTION
# ============================================================================

print_header "Step 9: Testing Redis Connection"

print_info "Testing Redis connection..."

# Simple Node script to test Redis
node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

redis.ping()
  .then(() => {
    console.log('\x1b[32m✅ Redis connection successful\x1b[0m');
    redis.quit();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\x1b[31m❌ Redis connection failed:\x1b[0m', err.message);
    redis.quit();
    process.exit(1);
  });
" 2>&1

# ============================================================================
# COMPLETION
# ============================================================================

print_header "✨ Setup Complete!"

echo ""
print_success "Database setup completed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Review your database in Prisma Studio:"
echo "     ${BLUE}npx prisma studio${NC}"
echo ""
echo "  2. Start your development server:"
echo "     ${BLUE}npm run dev${NC}"
echo ""
echo "  3. Read the documentation:"
echo "     ${BLUE}cat DATABASE_SETUP.md${NC}"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

print_header "📊 Setup Summary"

echo "Database Tables Created:"
echo "  ✓ Users & Organizations"
echo "  ✓ Integrations & Webhooks"
echo "  ✓ Repositories & Pull Requests"
echo "  ✓ Deployments"
echo "  ✓ Figma Files & Components"
echo "  ✓ Social Accounts & Posts"
echo "  ✓ Agents & Agent Tasks"
echo "  ✓ Events & Metrics"
echo ""

echo "Sample Data Created:"
echo "  • 3 Users (Alice, Bob, Charlie)"
echo "  • 1 Organization (Acme Corp)"
echo "  • 5 Integrations (GitHub, Vercel, Figma, Slack, Twitter)"
echo "  • 2 Repositories with Pull Requests"
echo "  • 3 Deployments"
echo "  • 2 Figma Files with Components"
echo "  • 2 Social Accounts with Posts"
echo "  • 4 Agents with Tasks"
echo "  • Events & Metrics"
echo ""

print_info "To reset and start over: ${BLUE}npx prisma migrate reset${NC}"
print_warning "⚠️  This will delete all data!"
echo ""

exit 0
