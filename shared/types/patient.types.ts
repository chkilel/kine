import { z } from 'zod'
import { fr } from 'zod/locales'

z.config(fr())

// Base schemas
export const genderSchema = z.enum(['male', 'female'])
export const patientStatusSchema = z.enum(['active', 'inactive', 'discharged'])
export const documentCategorySchema = z.enum(['referral', 'imaging', 'lab_results', 'treatment_notes', 'other'])

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string(),
  phone: z.string(),
  relationship: z.string()
})

// Patient schemas
export const patientCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.date(),
  gender: genderSchema.optional(),
  email: z.email().optional(),
  phone: z.string().min(1),
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
  referralDate: z.date().optional(),
  status: patientStatusSchema.default('active'),
  notes: z.string().optional()
})

export const patientUpdateSchema = patientCreateSchema.partial()

export const patientSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.date(),
  gender: genderSchema.nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).nullable(),
  medicalConditions: z.array(z.string()).nullable(),
  surgeries: z.array(z.string()).nullable(),
  allergies: z.array(z.string()).nullable(),
  medications: z.array(z.string()).nullable(),
  insuranceProvider: z.string().nullable(),
  insuranceNumber: z.string().nullable(),
  referralSource: z.string().nullable(),
  referralDate: z.date().nullable(),
  status: patientStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable()
})

// Consultation schemas
export const consultationCreateSchema = z.object({
  patientId: z.string(),
  date: z.date(),
  mainComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional()
})

export const consultationUpdateSchema = consultationCreateSchema.partial()

export const consultationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  patientId: z.string(),
  date: z.date(),
  mainComplaint: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Patient Document schemas
export const patientDocumentCreateSchema = z.object({
  patientId: z.string(),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().min(0),
  storageKey: z.string().min(1),
  category: documentCategorySchema,
  description: z.string().optional()
})

export const patientDocumentUpdateSchema = patientDocumentCreateSchema.partial().omit({
  patientId: true,
  fileName: true,
  originalName: true,
  mimeType: true,
  fileSize: true,
  storageKey: true
})

export const patientDocumentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  organizationId: z.string(),
  uploadedById: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  storageKey: z.string(),
  category: documentCategorySchema,
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable()
})

// Query schemas
export const patientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: patientStatusSchema.optional(),
  gender: genderSchema.optional(),
  insuranceProvider: z.string().optional()
})

export const consultationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional()
})

export const patientDocumentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  category: documentCategorySchema.optional(),
  uploadedById: z.string().optional()
})

// Type inference
export type Patient = z.infer<typeof patientSchema>
export type PatientCreate = z.infer<typeof patientCreateSchema>
export type PatientUpdate = z.infer<typeof patientUpdateSchema>
export type PatientQuery = z.infer<typeof patientQuerySchema>

export type Consultation = z.infer<typeof consultationSchema>
export type ConsultationCreate = z.infer<typeof consultationCreateSchema>
export type ConsultationUpdate = z.infer<typeof consultationUpdateSchema>
export type ConsultationQuery = z.infer<typeof consultationQuerySchema>

export type PatientDocument = z.infer<typeof patientDocumentSchema>
export type PatientDocumentCreate = z.infer<typeof patientDocumentCreateSchema>
export type PatientDocumentUpdate = z.infer<typeof patientDocumentUpdateSchema>
export type PatientDocumentQuery = z.infer<typeof patientDocumentQuerySchema>

export type Gender = z.infer<typeof genderSchema>
export type PatientStatus = z.infer<typeof patientStatusSchema>
export type DocumentCategory = z.infer<typeof documentCategorySchema>
export type EmergencyContact = z.infer<typeof emergencyContactSchema>
