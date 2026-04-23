import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { patients } from '~~/server/database/schema'

z.config(fr())

import {
  nameSchema,
  calendarDateSchema,
  genderSchema,
  phoneNumberSchema,
  emergencyContactSchema,
  noteSchema,
  patientStatusSchema
} from './base.types'

// =============================================================================
// Patient Schemas and Types
// =============================================================================

// This is to fix the circular dependency between patient and other types
const patientSchemaShape = {
  emergencyContacts: z.array(emergencyContactSchema),
  medicalConditions: z.array(z.string()),
  surgeries: z.array(z.string()),
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  notes: z.array(noteSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable()
}

export const patientSchema = createSelectSchema(patients, patientSchemaShape)

const patientCreateShape = {
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
  medicalConditions: z.array(z.string()).default([]),
  surgeries: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referralSource: z.string().optional(),
  status: patientStatusSchema,
  notes: z.array(noteSchema).default([])
}

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
  medicalConditions: z.array(z.string()).default([]),
  surgeries: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referralSource: z.string().optional(),
  status: patientStatusSchema,
  notes: z.array(noteSchema).default([])
})

export const patientUpdateSchema = createInsertSchema(patients, {
  emergencyContacts: z.array(emergencyContactSchema).optional(),
  medicalConditions: z.array(z.string()).optional(),
  surgeries: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  notes: z.array(noteSchema).optional()
}).partial()

export const patientInformationUpdateSchema = z.object({
  address: z.string(),
  city: z.string(),
  postalCode: z.string().optional(),
  referralSource: z.string().optional(),
  insuranceProvider: z.string().optional(),
  emergencyContacts: z.array(emergencyContactSchema).optional()
})

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
export type PatientInformationUpdate = z.infer<typeof patientInformationUpdateSchema>
export type PatientQuery = z.infer<typeof patientQuerySchema>
export type PatientPaginatedResponse = z.infer<typeof patientPaginatedResponseSchema>
