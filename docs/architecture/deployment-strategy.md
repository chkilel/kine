# Deployment Strategy

## Dokploy Configuration

### 1. Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production
FROM base AS production
COPY --from=build /app/.output ./
EXPOSE 3000
CMD ["node", "server/index.mjs"]
```

### 2. Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/kine_app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kine_app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 3. Health Monitoring

```typescript
// server/api/health.get.ts
export default defineEventHandler(async (event) => {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Database health check
    await dbPool.query('SELECT 1')
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    // Redis health check
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }

  const isHealthy = checks.database && checks.redis

  setResponseStatus(event, isHealthy ? 200 : 503)
  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks
  }
})
```
