# Security & Compliance Framework

## Authentication & Authorization

### 1. better-auth Configuration

```typescript
// server/auth.ts
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'

export const auth = betterAuth({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false, // Admin-only org creation
      organizationLimit: 1 // Users belong to one org
    })
  ],
  session: {
    expiresIn: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60 * 2 // Update every 2 hours
  }
})
```

### 2. Role-Based Access Control

```typescript
// types/auth.ts
export enum UserRole {
  ADMIN = 'admin',
  PRACTITIONER = 'practitioner',
  RECEPTIONIST = 'receptionist',
  VIEWER = 'viewer'
}

export const permissions = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.PRACTITIONER]: [
    'patients:read',
    'patients:write',
    'appointments:read',
    'appointments:write',
    'treatments:read',
    'treatments:write'
  ],
  [UserRole.RECEPTIONIST]: [
    'patients:read',
    'patients:write',
    'appointments:read',
    'appointments:write'
  ],
  [UserRole.VIEWER]: ['patients:read', 'appointments:read']
}
```

## Data Protection & Privacy

### 1. Encryption at Rest

```typescript
// utils/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = 'aes-256-gcm'

export function encryptSensitiveData(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}
```

### 2. Audit Logging

```typescript
// server/middleware/audit.ts
export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  // Log request
  await logAuditEvent({
    userId: event.context.user?.id,
    organizationId: event.context.organizationId,
    action: `${event.node.req.method} ${event.node.req.url}`,
    ipAddress: getClientIP(event),
    userAgent: getHeader(event, 'user-agent'),
    timestamp: new Date()
  })

  // Continue processing...
})
```
