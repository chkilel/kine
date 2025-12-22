import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { patients } from '~~/server/database/schema'
import {
  calendarDateSchema,
  emailSchema,
  emergencyContactSchema,
  genderSchema,
  nameSchema,
  noteSchema,
  patientStatusSchema,
  phoneNumberSchema
} from './base.types'

z.config(fr())

// =============================================================================
// Patient Schemas and Types
// =============================================================================
export const patientCreateSchema = createInsertSchema(patients, {
  organizationId: z.string().min(1),
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: calendarDateSchema,
  gender: genderSchema,
  email: emailSchema.optional(),
  phone: phoneNumberSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContacts: z.array(emergencyContactSchema).optional(),
  medicalConditions: z.array(z.string()).optional(),
  surgeries: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referralSource: z.string().optional(),
  status: patientStatusSchema.default('active'),
  notes: z.array(noteSchema).optional()
})

export const patientUpdateSchema = patientCreateSchema.partial().extend({
  organizationId: z.string().min(1)
})
export const patientSchema = createSelectSchema(patients)

// Query schemas
export const patientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: patientStatusSchema.optional(),
  gender: genderSchema.optional(),
  insuranceProvider: z.string().optional()
})

// Paginated response type
export const patientPaginatedResponseSchema = z.object({
  data: z.array(patientSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
})

// Type inference
export type Patient = z.infer<typeof patientSchema>
export type PatientCreate = z.infer<typeof patientCreateSchema>
export type PatientUpdate = z.infer<typeof patientUpdateSchema>
export type PatientQuery = z.infer<typeof patientQuerySchema>
export type PatientPaginatedResponse = z.infer<typeof patientPaginatedResponseSchema>
