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
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: calendarDateSchema,
  gender: genderSchema,
  phone: phoneNumberSchema,
})

export const patientUpdateSchema = patientCreateSchema.partial()
export const patientSchema = createSelectSchema(patients)

// Query schemas
export const patientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: patientStatusSchema.optional(),
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
