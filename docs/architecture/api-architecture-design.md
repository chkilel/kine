# API Architecture Design

## RESTful API Structure

### 1. Versioning Strategy
```
/api/organizations/{orgId}/patients
/api/organizations/{orgId}/appointments
/api/organizations/{orgId}/treatments
```

### 2. Middleware Stack
```typescript
// server/middleware/
├── 01.cors.ts          // CORS configuration
├── 02.auth.ts          // Authentication validation
├── 03.tenant.ts        // Tenant context setting
├── 04.validation.ts    // Request validation
├── 05.rateLimit.ts     // Rate limiting
└── 06.audit.ts         // Audit logging
```

### 3. API Route Structure
```typescript
// server/api/organizations/[orgId]/patients/
├── index.get.ts        // GET /patients (list with pagination)
├── index.post.ts       // POST /patients (create)
├── [id].get.ts         // GET /patients/:id
├── [id].put.ts         // PUT /patients/:id
├── [id].delete.ts      // DELETE /patients/:id
└── [id]/
    ├── appointments.get.ts    // GET /patients/:id/appointments
    └── medical-records.get.ts // GET /patients/:id/medical-records
```

### 4. Validation Schema Example
```typescript
// schemas/patient.ts
export const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  dateOfBirth: z.string().date().optional(),
  medicalHistory: z.object({
    conditions: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    medications: z.array(z.string()).default([])
  }).optional()
});
```
