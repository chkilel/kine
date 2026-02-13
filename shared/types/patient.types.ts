import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { patients } from '~~/server/database/schema'
import {
  calendarDateSchema,
  emergencyContactSchema,
  genderSchema,
  nameSchema,
  noteSchema,
  patientStatusSchema,
  phoneNumberSchema
} from './base.types'

z.config(fr())

const stringArraySchema = z.array(z.string()).default([])

// =============================================================================
// Patient Schemas and Types
// =============================================================================

export const patientSchema = createSelectSchema(patients, {
  id: z.string(),
  organizationId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: calendarDateSchema,
  gender: genderSchema,
  email: z.email().nullable(),
  phone: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
  emergencyContacts: z.array(emergencyContactSchema),
  medicalConditions: z.array(z.string()),
  surgeries: z.array(z.string()),
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  insuranceProvider: z.string().nullable(),
  insuranceNumber: z.string().nullable(),
  referralSource: z.string().nullable(),
  status: patientStatusSchema,
  notes: z.array(noteSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable()
})

export const patientCreateSchema = createInsertSchema(patients, {
  organizationId: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: calendarDateSchema,
  gender: genderSchema,
  email: z.string().optional(),
  phone: phoneNumberSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContacts: z.array(emergencyContactSchema).default([]),
  medicalConditions: stringArraySchema,
  surgeries: stringArraySchema,
  allergies: stringArraySchema,
  medications: stringArraySchema,
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referralSource: z.string().optional(),
  status: patientStatusSchema,
  notes: z.array(noteSchema).default([])
})

export const patientUpdateSchema = patientCreateSchema.partial()

// Query schemas
export const patientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: patientStatusSchema.optional()
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
