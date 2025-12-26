# Design: Database Seeding Endpoint

## Overview

The database seeding functionality will be implemented as a backend API endpoint (`POST /api/db/seed`) that populates the local Cloudflare D1 database with realistic test data. The endpoint will use a hybrid approach:

- **Better Auth Server-side API**: For all Better Auth-related entities (users, organizations, memberships) - used directly, no HTTP calls
- **Drizzle ORM**: For application-specific entities (availability templates/exceptions, patients, treatment plans)

Using an API endpoint approach eliminates environment compatibility issues since it runs within the same application runtime context.

## Architecture

### Endpoint Structure

```
server/api/db/seed.post.ts
├── Development environment check
├── Database connection (via Drizzle event context)
├── Configuration constants (seed data quantities)
├── Database reset (clear all existing data)
├── Seed Functions (separate functions for each entity type)
└── Response (summary of seeded data)
```

### Data Flow

```
1. Development environment check (refuse if not development)
2. Initialize database connection (via H3Event's Drizzle instance)
3. Reset database (delete all existing data)
4. Seed organizations (via Better Auth server-side API)
5. Seed users (via Better Auth server-side API)
6. Create user-organization memberships (via Better Auth server-side API)
7. For each user:
   a. Seed weekly availability templates (via Drizzle with conflict checks)
   b. Seed availability exceptions (via Drizzle with conflict checks)
8. Seed patients across organizations (via Drizzle)
9. For each patient:
   a. Seed treatment plans with mixed statuses (via Drizzle)
10. Return summary response
```

## Component Design

### 1. Development Environment Check

The endpoint must refuse any requests that are not in development environment:

```typescript
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const isDevelopment = config.env === 'development' || config.env === undefined

  if (!isDevelopment) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seeding is only allowed in development environment'
    })
  }

  // Continue with seeding logic...
})
```

**Rationale**: Protects production database from accidental or malicious seeding requests.

### 2. Database Connection (via H3Event)

The endpoint will use the existing Drizzle instance from the H3Event context:

```typescript
const db = useDrizzle(event)
```

**Rationale**: Uses the same database connection as the rest of the application, ensuring consistency and avoiding connection management issues.

### 3. Better Auth Server-side API Usage

Better Auth entities will be created using the server-side Better Auth API directly (not HTTP calls). This requires investigating Better Auth's server-side methods.

```typescript
import { betterAuth } from '~~/server/utils/auth'

async function createUserViaBetterAuth(email: string, password: string, userData: UserData) {
  // Use Better Auth server-side API directly
  // TODO: Need to verify exact Better Auth server-side methods
  // This is a placeholder - actual implementation depends on Better Auth API

  const auth = createAuth(event)

  // Hypothetical approach - may vary based on Better Auth API
  const result = await auth.api.signUp.email({
    email,
    password,
    name: `${userData.firstName} ${userData.lastName}`,
    firstName: userData.firstName,
    lastName: userData.lastName,
    licenseNumber: userData.licenseNumber,
    specialization: userData.specialization,
    phoneNumbers: userData.phoneNumbers
  })

  return result.user.id
}
```

**Investigation Needed**: Need to determine the exact Better Auth server-side API methods for:

- User creation (`auth.api.signUp.email` or similar)
- Organization creation (organization plugin methods)
- Membership creation (organization plugin methods)

**Rationale**: Using server-side Better Auth API within the same runtime context eliminates HTTP overhead, authentication complexity, and environment compatibility issues.

### 4. Organization Creation via Better Auth Server-side API

Organizations will be created using Better Auth server-side API:

```typescript
async function createOrganizationViaBetterAuth(name: string, slug: string) {
  const auth = createAuth(event)

  // TODO: Need to verify exact Better Auth organization plugin methods
  // This is a placeholder - actual implementation depends on Better Auth API

  const result = await auth.api.createOrganization({
    name,
    slug,
    metadata: {}
  })

  return result.organization.id
}
```

**Note**: Exact method names and signatures need verification from Better Auth documentation.

### 5. User-Organization Membership Creation via Better Auth Server-side API

Memberships will be created using Better Auth server-side API:

```typescript
async function createMembershipViaBetterAuth(userId: string, organizationId: string, role: string) {
  const auth = createAuth(event)

  // TODO: Need to verify exact Better Auth organization plugin methods
  // This is a placeholder - actual implementation depends on Better Auth API

  const result = await auth.api.addMember({
    userId,
    organizationId,
    role
  })

  return result.member.id
}
```

**Note**: Exact method names and signatures need verification from Better Auth documentation.

### 6. Conflict Detection for Availability Data

The endpoint must replicate the conflict detection logic from the application's API endpoints:

**Weekly Availability Templates**:

- Prevent duplicate templates for same user + org + day + time combination
- Maintain 15-minute minimum gap between time slots (MINIMUM_CONSULTATION_GAP_MINUTES)

**Availability Exceptions**:

- Prevent duplicate exceptions for same user + org + date + time combination
- Full-day exceptions conflict with anything on the same date
- Partial-day exceptions must maintain 15-minute gap from existing exceptions

**Implementation Strategy**:

1. Query existing entries before insertion
2. Reuse the `hasTimeConflict` helper function from `date-utils.ts`
3. Skip or throw on conflicts based on configuration

```typescript
function validateTemplateConflict(existingTemplates: any[], newTemplate: any) {
  for (const existing of existingTemplates) {
    if (existing.dayOfWeek === newTemplate.dayOfWeek) {
      // Check time overlap with 15-minute gap
      if (
        hasTimeConflict(
          existing.startTime,
          existing.endTime,
          newTemplate.startTime,
          newTemplate.endTime,
          15 // MINIMUM_CONSULTATION_GAP_MINUTES
        )
      ) {
        throw new Error('Time conflict detected')
      }
    }
  }
}
```

### 7. Treatment Plan Status Distribution

Each patient will have 3+ treatment plans with different statuses, ensuring exactly one is `ongoing`:

```typescript
const treatmentPlanStatuses: TreatmentPlanStatus[] = ['planned', 'ongoing', 'completed', 'paused', 'cancelled']

function generateTreatmentPlans(patientId: string, organizationId: string, therapistId: string) {
  // Shuffle statuses and pick 3
  const shuffled = shuffleArray([...treatmentPlanStatuses])
  const selectedStatuses = shuffled.slice(0, 3)

  // Ensure 'ongoing' is one of them
  if (!selectedStatuses.includes('ongoing')) {
    selectedStatuses[0] = 'ongoing'
  }

  return selectedStatuses.map((status, index) => ({
    patientId,
    organizationId,
    therapistId,
    status,
    title: `Treatment Plan ${index + 1}`,
    diagnosis: generateDiagnosis()
    // ... other fields
  }))
}
```

**Rationale**: Guarantees the requirement of exactly one active treatment plan per patient.

### 8. Data Distribution Strategy

**Users to Organizations**:

- 10 users distributed across 3 organizations
- Distribution: Org 1 (4 users), Org 2 (3 users), Org 3 (3 users)

**Patients to Organizations**:

- 20 patients distributed: Org 1 (8), Org 2 (6), Org 3 (6)
- Each patient is assigned to a therapist from the same organization

**Availability Data**:

- Each user gets 3-5 weekly templates covering different days
- Each user gets 2-4 exceptions (mix of available/unavailable) over the next 3 months

### 9. Configurable Seed Data

**Decision**: Use configuration constants at the top of the endpoint file for easy customization

**Rationale**:

- Simple to modify without changing logic
- No need for external config files or environment variables
- Clear visibility of what's being seeded

**Implementation**:

```typescript
// Seed configuration constants
const SEED_CONFIG = {
  users: {
    count: 10,
    password: 'Password123',
    adminEmail: 'admin@seed.local'
  },
  organizations: {
    count: 3,
    names: [
      { name: 'Kine Clinic A', slug: 'kine-clinic-a' },
      { name: 'Kine Clinic B', slug: 'kine-clinic-b' },
      { name: 'Kine Clinic C', slug: 'kine-clinic-c' }
    ],
    userDistribution: [4, 3, 3] // Org 1: 4 users, Org 2: 3 users, Org 3: 3 users
  },
  patients: {
    count: 20,
    distribution: [8, 6, 6] // Org 1: 8 patients, Org 2: 6 patients, Org 3: 6 patients
  },
  availability: {
    templatesPerUser: { min: 3, max: 5 },
    exceptionsPerUser: { min: 2, max: 4 },
    exceptionDaysRange: 90 // Generate exceptions over next 90 days
  },
  treatmentPlans: {
    minPerPatient: 3,
    statuses: ['planned', 'ongoing', 'completed', 'paused', 'cancelled'] as const
  }
} as const
```

## Technology Decisions

### 1. Better Auth Server-side API

**Decision**: Use Better Auth server-side API methods directly within the endpoint

**Rationale**:

- No HTTP overhead or authentication complexity
- Runs within the same runtime context as the application
- Eliminates environment compatibility issues
- Can leverage Better Auth's internal database connections

**Alternative**: Standalone script making HTTP calls
**Rejected**: Server-side approach is simpler, more reliable, and avoids all HTTP-related issues.

### 2. Password

**Decision**: Hardcoded constant password: `Password123`

**Rationale**:

- Easy to remember for testing
- Strong enough to pass validation (if any)
- Consistent across all users

### 3. Date Generation

**Decision**: Use `date-fns` (already a project dependency) for realistic date generation

```typescript
import { addDays, addMonths, startOfWeek, format } from 'date-fns'

// Generate exceptions over next 3 months
const exceptionDates = []
for (let i = 0; i < 4; i++) {
  exceptionDates.push(format(addDays(new Date(), Math.random() * 90), 'yyyy-MM-dd'))
}
```

**Rationale**: Uses existing dependency, familiar API for the team.

### 4. Database Reset Before Seeding

**Decision**: Reset (clear) database before running seeding logic

**Rationale**:

- Clean slate for each seed run ensures consistency
- Simpler implementation than idempotent behavior
- Prevents conflicts with existing data

**Implementation**:

- Use DELETE statements to clear all tables
- Must respect foreign key constraints (delete child tables before parent tables)
- Delete order: treatment_plans → patients → availability_exceptions → weekly_availability_templates → members → accounts → sessions → users → organizations → verifications

```typescript
async function resetDatabase(db: DrizzleDB) {
  // Clear tables in reverse dependency order
  await db.delete(treatmentPlans)
  await db.delete(patients)
  await db.delete(availabilityExceptions)
  await db.delete(weeklyAvailabilityTemplates)
  await db.delete(members)
  await db.delete(accounts)
  await db.delete(sessions)
  await db.delete(users)
  await db.delete(organizations)
  await db.delete(verifications)
}
```

### 5. Response Format

**Decision**: Return JSON response with summary of seeded data and any errors

**Rationale**:

- Clear feedback to the caller
- Can be consumed by scripts or tools
- Includes error information for debugging

```typescript
return {
  success: {
    users: 10,
    organizations: 3,
    memberships: 10,
    patients: 20,
    treatmentPlans: 60,
    weeklyTemplates: 40,
    availabilityExceptions: 30
  },
  errors: [] // Array of errors encountered
}
```

## Error Handling Strategy

1. **Continue on non-critical errors**: If one user creation fails, continue with others
2. **Fail fast on critical errors**: If database connection fails, stop immediately
3. **Log all errors**: Detailed logging for debugging
4. **Return summary**: JSON response with created counts and errors

```typescript
const results = {
  success: { users: 0, organizations: 0, patients: 0, ... },
  errors: []
}

try {
  await createOrganization(org1Data)
  results.success.organizations++
} catch (error) {
  results.errors.push({ type: 'organization', data: org1Data, error })
}
```

## File Placement

```
server/api/db/seed.post.ts
```

**Rationale**: Follows Nitro API endpoint conventions (`server/api/`), clearly indicates it's a database management operation.

## Usage

**Development**:

```bash
# Start the development server
npm run dev

# Call the seed endpoint (in another terminal)
curl -X POST http://localhost:3000/api/db/seed

# Or use any HTTP client
fetch('http://localhost:3000/api/db/seed', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log(data))
```

**Production**:

- Endpoint will refuse all requests with 403 Forbidden status
- Clear error message: "Seeding is only allowed in development environment"

## Security Considerations

1. **Development-Only Check**: Strict environment check at the start of endpoint refuses all production requests
2. **No Authentication**: Endpoint is intentionally open for development convenience, but protected by environment check
3. **Database Reset Safety**: Immediate check for development environment prevents accidental production data loss
4. **Password Disclosure**: The known password (`Password123`) is documented for developers, but should not be used in production
5. **Better Auth Session Management**: No external session management needed since we use server-side API

```typescript
// Safety check at the start
const isDevelopment = useRuntimeConfig().env === 'development'

if (!isDevelopment) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Seeding is only allowed in development environment'
  })
}
```

## Future Enhancements

1. **Data Variation**: Use Faker library for more realistic randomized data
2. **Relationships**: Add consultations, documents, and other entities to seed
3. **Selective Seeding**: Query parameters to seed specific entity types
4. **Cleanup Endpoint**: Separate `/api/db/cleanup` endpoint for cleaning seeded data without full reset
5. **Data Export**: Endpoint to export seed data as fixtures for testing
