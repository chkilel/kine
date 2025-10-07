# Performance Optimization

## 1. Database Indexes

```sql
-- Essential indexes for performance
CREATE INDEX CONCURRENTLY idx_patients_org_search ON patients USING gin(to_tsvector('french', first_name || ' ' || last_name));
CREATE INDEX CONCURRENTLY idx_appointments_org_date ON appointments(organization_id, appointment_date);
CREATE INDEX CONCURRENTLY idx_users_org_active ON users(organization_id) WHERE is_active = true;
```

## 2. Caching Strategy

```typescript
// server/utils/cache.ts
import Redis from 'redis'

const redis = Redis.createClient({ url: useRuntimeConfig().redisUrl })

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  },

  async set(key: string, value: any, ttl = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value))
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  }
}
```

This implementation guide provides a solid foundation for building the physiotherapy practice management application. Follow the checklist sequentially, and refer to the architecture document for detailed explanations of design decisions.
