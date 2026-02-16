# CompanyOS Backend Deployment Guide

## Quick Start

### 1. Prerequisites

- Node.js v20 or higher
- PostgreSQL 16
- Redis 7
- npm or yarn

### 2. Database Setup

```bash
# Create database
createdb companyos

# Run migrations
psql companyos < migrations/001_initial_schema.sql
```

### 3. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/companyos

# Redis
REDIS_URL=redis://localhost:6379

# JWT secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Encryption key (32 characters)
ENCRYPTION_KEY=your-32-character-key-here-1234
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server runs on `http://localhost:3001`

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

### 2. Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "Admin User",
    "password": "SecurePass123!"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` from response.

### 4. Create Organization

```bash
curl -X POST http://localhost:3001/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Company",
    "slug": "my-company"
  }'
```

### 5. Test GraphQL

Visit `http://localhost:3001/graphql` in your browser (development mode only).

Example query:

```graphql
query {
  organizations {
    id
    name
    slug
  }
}
```

### 6. Test WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('subscribe', { channel: 'events' });
});

socket.on('event.created', (event) => {
  console.log('Event:', event);
});
```

## Production Deployment

### Docker Setup (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/companyos
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=companyos
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

Run:

```bash
docker-compose up -d
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3001

# Strong secrets
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
ENCRYPTION_KEY=<32-character-key>

# Production database
DATABASE_URL=postgresql://user:pass@host:5432/companyos
REDIS_URL=redis://host:6379

# Integration secrets
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_WEBHOOK_SECRET=...

# And so on...
```

### SSL/TLS (Production)

Use a reverse proxy like Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name api.companyos.com;

    ssl_certificate /etc/ssl/certs/companyos.crt;
    ssl_certificate_key /etc/ssl/private/companyos.key;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start src/server.js --name companyos-api

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

### Monitoring

**Health Checks:**

- Endpoint: `GET /api/health`
- Expected: `200 OK` with `{"status": "healthy"}`

**Logs:**

```bash
# PM2 logs
pm2 logs companyos-api

# Docker logs
docker-compose logs -f api
```

**Metrics:**

- Application logs in `logs/combined.log`
- Error logs in `logs/error.log`

## Troubleshooting

### Database Connection Failed

Check:
- PostgreSQL is running
- DATABASE_URL is correct
- Database exists
- User has permissions

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### Redis Connection Failed

Check:
- Redis is running
- REDIS_URL is correct

```bash
# Test connection
redis-cli -u $REDIS_URL ping
```

### JWT Token Errors

- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set
- Tokens expire (access: 15min, refresh: 7 days)
- Use refresh token to get new access token

### CORS Errors

- Check FRONTEND_URL in .env matches your frontend origin
- Update CORS middleware in `src/middleware/cors.js` if needed

### Rate Limit Exceeded

- Standard: 100 requests per 15 minutes
- Auth: 5 requests per 15 minutes
- Wait for rate limit window to reset

## Performance Tips

1. **Database Connection Pool**: Adjust DB_POOL_MIN and DB_POOL_MAX
2. **Redis Caching**: Cache frequently accessed data
3. **Horizontal Scaling**: Run multiple instances behind load balancer
4. **CDN**: Serve static assets via CDN
5. **Database Indexes**: Ensure all queries use indexes (already set up)

## Security Checklist

- [ ] Change all default secrets in production
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS/TLS
- [ ] Set NODE_ENV=production
- [ ] Configure firewall (only expose necessary ports)
- [ ] Regular security updates (npm audit, npm update)
- [ ] Monitor logs for suspicious activity
- [ ] Set up rate limiting
- [ ] Validate all webhook signatures
- [ ] Encrypt sensitive data at rest

## Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240120.sql
```

### Redis Backup

```bash
# Redis persists to disk automatically
# Backup RDB file
cp /var/lib/redis/dump.rdb /backup/dump_$(date +%Y%m%d).rdb
```

---

**Backend successfully deployed! 🚀**

For API documentation, see `BACKEND_API.md`.
