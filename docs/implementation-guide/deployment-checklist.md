# Deployment Checklist

## 1. Production Environment Variables
```bash
# Production .env
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:secure_password@db:5432/kine_app_prod"
REDIS_URL="redis://redis:6379"
BETTER_AUTH_SECRET="production-secret-key-32-chars"
ENCRYPTION_KEY="production-encryption-key-32-chars"
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASS="your-mailgun-password"
```

## 2. Database Migration
```bash
# Generate and run migrations
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg
```

## 3. Docker Production Build
```bash
# Build and deploy
docker build -t kine-app:latest .
docker-compose -f docker-compose.prod.yml up -d
```

## 4. Health Checks
- Database connectivity: `/api/health`
- Redis connectivity: `/api/health`
- Authentication service: `/api/auth/session`
- Application metrics: `/api/metrics`
