# Performance & Scalability Strategy

## Caching Strategy

### 1. Redis Configuration

```typescript
// utils/redis.ts
import Redis from 'redis'

export const redis = Redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused')
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted')
    }
    return Math.min(options.attempt * 100, 3000)
  }
})
```

### 2. Caching Layers

```typescript
// composables/useCache.ts
export const useCache = () => {
  const cachePatients = async (orgId: string, patients: Patient[]) => {
    await redis.setex(`patients:${orgId}`, 300, JSON.stringify(patients))
  }

  const getCachedPatients = async (orgId: string): Promise<Patient[] | null> => {
    const cached = await redis.get(`patients:${orgId}`)
    return cached ? JSON.parse(cached) : null
  }

  return { cachePatients, getCachedPatients }
}
```

## Database Optimization

### 1. Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_patients_org_id ON patients(organization_id);
CREATE INDEX CONCURRENTLY idx_appointments_org_date ON appointments(organization_id, appointment_date);
CREATE INDEX CONCURRENTLY idx_patients_search ON patients USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_active_appointments ON appointments(organization_id, appointment_date)
WHERE status IN ('scheduled', 'confirmed');
```

### 2. Connection Pooling

```typescript
// utils/db.ts
import { Pool } from 'pg'

export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500
})
```
