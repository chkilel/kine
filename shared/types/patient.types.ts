import { z } from 'zod'
import { fr } from 'zod/locales'

z.config(fr())

// Base schemas
export const genderSchema = z.enum(['male', 'female'])
export const patientStatusSchema = z.enum(['active', 'inactive', 'discharged', 'archived'])
export const documentCategorySchema = z.enum([
  'referral',
  'imaging',
  'lab_results',
  'treatment_notes',
  'prescriptions',
  'other'
])
export const relationshipSchema = z.enum([
  'husband',
  'wife',
  'mother',
  'father',
  'daughter',
  'son',
  'sister',
  'brother',
  'grandmother',
  'grandfather',
  'granddaughter',
  'grandson',
  'aunt',
  'uncle',
  'female_cousin',
  'male_cousin',
  'female_friend',
  'male_friend',
  'female_neighbor',
  'male_neighbor',
  'colleague',
  'acquaintance',
  'other'
])
// Insurance Coverage Configuration
export const insuranceCoverageSchema = z.enum([
  'not_required',
  'not_provided',
  'to_verify',
  'awaiting_agreement',
  'covered',
  'partially_covered',
  'refused',
  'expired',
  'cancelled'
])

export const noteSchema = z.object({
  date: z.coerce.date(),
  author: z.string(),
  content: z.string().min(1)
})

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string(),
  relationship: relationshipSchema.optional()
})

// Patient schemas
export const patientCreateSchema = z.object({
  organizationId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.coerce.date(),
  gender: genderSchema,
  email: z.email().optional(),
  phone: z.string().min(10),
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

export const patientUpdateSchema = patientCreateSchema.partial()

export const patientSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.coerce.date(),
  gender: genderSchema,
  phone: z.string(),
  email: z.string().nullable(),
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
  status: patientStatusSchema,
  notes: z.array(noteSchema).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable()
})

// Treatment Plan schemas
export const treatmentPlanStatusSchema = z.enum(['planned', 'ongoing', 'completed', 'paused', 'cancelled'])

export const treatmentPlanCreateSchema = z.object({
  patientId: z.string().min(1),
  organizationId: z.string().min(1),
  therapistId: z.string().min(1),
  title: z.string().min(3),
  diagnosis: z.string().min(3),
  objective: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  numberOfSessions: z.number().min(1).optional(),
  sessionFrequency: z.number().optional(),
  status: treatmentPlanStatusSchema.default('planned'),
  prescribingDoctor: z.string().optional(),
  prescriptionDate: z.coerce.date().optional(),
  painLevel: z.number().min(0).max(10).optional(),
  coverageStatus: z
    .enum([
      'not_required',
      'not_provided',
      'to_verify',
      'awaiting_agreement',
      'covered',
      'partially_covered',
      'refused',
      'expired',
      'cancelled'
    ])
    .optional(),
  insuranceInfo: z.string().optional(),
  notes: z.array(noteSchema).nullable()
})

export const treatmentPlanUpdateSchema = treatmentPlanCreateSchema.partial()

export const treatmentPlanSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  patientId: z.string(),
  therapistId: z.string(),
  title: z.string(),
  diagnosis: z.string(),
  objective: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  numberOfSessions: z.number().nullable(),
  sessionFrequency: z.number().nullable(),
  status: treatmentPlanStatusSchema,
  prescribingDoctor: z.string().nullable(),
  prescriptionDate: z.coerce.date().nullable(),
  painLevel: z.number().nullable(),
  coverageStatus: z
    .enum([
      'not_required',
      'not_provided',
      'to_verify',
      'awaiting_agreement',
      'covered',
      'partially_covered',
      'refused',
      'expired',
      'cancelled'
    ])
    .nullable(),
  insuranceInfo: z.string().nullable(),
  notes: z.array(noteSchema).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable()
})

// Consultation schemas
export const consultationLocationSchema = z.enum(['clinic', 'home', 'telehealth'])
export const consultationSessionTypeSchema = z.enum([
  'initial',
  'follow_up',
  'evaluation',
  'discharge',
  'mobilization',
  'reinforcement',
  'reeducation'
])
export const consultationStatusSchema = z.enum([
  'confirmed',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
])

export const consultationCreateSchema = z.object({
  patientId: z.string(),
  organizationId: z.string().min(1),
  treatmentPlanId: z.string().optional(),
  therapistId: z.string().optional(),
  date: z.coerce.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().min(1).optional(),
  type: consultationSessionTypeSchema.optional(),
  location: consultationLocationSchema.default('clinic'),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  treatmentSummary: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional(),
  painLevelBefore: z.number().min(0).max(10).optional(),
  painLevelAfter: z.number().min(0).max(10).optional(),
  progressNotes: z.string().optional(),
  status: consultationStatusSchema.default('scheduled'),
  billed: z.boolean().default(false),
  insuranceClaimed: z.boolean().default(false),
  cost: z.number().min(0).optional()
})

export const consultationUpdateSchema = consultationCreateSchema.partial()

export const consultationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  patientId: z.string(),
  treatmentPlanId: z.string().nullable(),
  date: z.coerce.date(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  duration: z.number().nullable(),
  type: consultationSessionTypeSchema,
  location: consultationLocationSchema,
  chiefComplaint: z.string().nullable(),
  notes: z.string().nullable(),
  treatmentSummary: z.string().nullable(),
  observations: z.string().nullable(),
  nextSteps: z.string().nullable(),
  painLevelBefore: z.number().nullable(),
  painLevelAfter: z.number().nullable(),
  progressNotes: z.string().nullable(),
  therapistId: z.string().nullable(),
  status: consultationStatusSchema,
  billed: z.boolean(),
  insuranceClaimed: z.boolean(),
  cost: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

// Patient Document schemas
export const patientDocumentCreateSchema = z.object({
  patientId: z.string(),
  organizationId: z.string().min(1),
  uploadedById: z.string(),
  treatmentPlanId: z.string().optional(),
  fileName: z.string().min(1),
  originalFileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().min(0),
  storageKey: z.string().min(1),
  category: documentCategorySchema,
  description: z.string().optional()
})

export const patientDocumentUpdateSchema = patientDocumentCreateSchema.partial().omit({
  patientId: true,
  uploadedById: true,
  fileName: true,
  originalFileName: true,
  mimeType: true,
  fileSize: true,
  storageKey: true
})

export const patientDocumentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  organizationId: z.string(),
  uploadedById: z.string(),
  treatmentPlanId: z.string().nullable(),
  fileName: z.string(),
  originalFileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  storageKey: z.string(),
  category: documentCategorySchema,
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable()
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

export const treatmentPlanQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  status: treatmentPlanStatusSchema.optional()
})

export const consultationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  status: consultationStatusSchema.optional(),
  type: consultationSessionTypeSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
})

export const patientDocumentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().optional(),
  category: documentCategorySchema.optional(),
  uploadedById: z.string().optional()
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

export type TreatmentPlan = z.infer<typeof treatmentPlanSchema>
export type TreatmentPlanCreate = z.infer<typeof treatmentPlanCreateSchema>
export type TreatmentPlanUpdate = z.infer<typeof treatmentPlanUpdateSchema>
export type TreatmentPlanQuery = z.infer<typeof treatmentPlanQuerySchema>
export type TreatmentPlanStatus = z.infer<typeof treatmentPlanStatusSchema>

export type Consultation = z.infer<typeof consultationSchema>
export type ConsultationCreate = z.infer<typeof consultationCreateSchema>
export type ConsultationUpdate = z.infer<typeof consultationUpdateSchema>
export type ConsultationSessionType = z.infer<typeof consultationSessionTypeSchema>
export type ConsultationLocation = z.infer<typeof consultationLocationSchema>
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>
export type ConsultationQuery = z.infer<typeof consultationQuerySchema>

export type PatientDocument = z.infer<typeof patientDocumentSchema>
export type PatientDocumentCreate = z.infer<typeof patientDocumentCreateSchema>
export type PatientDocumentUpdate = z.infer<typeof patientDocumentUpdateSchema>
export type PatientDocumentQuery = z.infer<typeof patientDocumentQuerySchema>

export type Gender = z.infer<typeof genderSchema>
export type PatientStatus = z.infer<typeof patientStatusSchema>
export type DocumentCategory = z.infer<typeof documentCategorySchema>
export type EmergencyContact = z.infer<typeof emergencyContactSchema>
export type Note = z.infer<typeof noteSchema>
export type InsuranceCoverage = z.infer<typeof insuranceCoverageSchema>
export type Relationship = z.infer<typeof relationshipSchema>

// Planning types
export interface PlanningSettings {
  sessionsToPlan: number
  frequency: number
  duration: number
  startDate: string
  preferredDays: string[]
  location: ConsultationLocation
}

// Extended types/interfaces
export type TreatmentPlanWithProgress = TreatmentPlan & {
  therapist: {
    id: string
    firstName?: string
    lastName?: string | null
    email?: string
  } | null
  progress: number
  completedConsultations: number
}
