# API Implementation

## 1. Base API Structure

```typescript
// server/api/organizations/[orgId]/patients/index.get.ts
import { z } from 'zod'
import { db } from '~/server/database/connection'
import { patients } from '~/server/database/schema/patients'
import { eq, and, ilike, desc } from 'drizzle-orm'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export default defineEventHandler(async (event) => {
  const orgId = getRouterParam(event, 'orgId')
  const query = await getValidatedQuery(event, querySchema.parse)

  // Verify organization access
  if (event.context.organizationId !== orgId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied to organization'
    })
  }

  // Set tenant context
  await setTenantContext(orgId)

  // Build query
  let whereClause = eq(patients.organizationId, orgId)

  if (query.search) {
    whereClause = and(whereClause, ilike(patients.firstName, `%${query.search}%`))
  }

  // Execute query with pagination
  const offset = (query.page - 1) * query.limit

  const [patientsData, totalCount] = await Promise.all([
    db
      .select()
      .from(patients)
      .where(whereClause)
      .orderBy(desc(patients[query.sortBy]))
      .limit(query.limit)
      .offset(offset),

    db.select({ count: count() }).from(patients).where(whereClause)
  ])

  return {
    data: patientsData,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / query.limit)
    }
  }
})
```

## 2. Validation Schemas

```typescript
// server/schemas/patient.ts
import { z } from 'zod'

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
    .optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional()
    })
    .optional(),
  medicalHistory: z
    .object({
      conditions: z.array(z.string()).default([]),
      allergies: z.array(z.string()).default([]),
      medications: z.array(z.string()).default([]),
      surgeries: z.array(z.string()).default([])
    })
    .optional()
})

export const updatePatientSchema = createPatientSchema.partial()

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
```
