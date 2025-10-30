import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import { patients, patientDocuments } from '~~/server/database/schema'
import { fr } from 'zod/locales'

z.config(fr())

// Medical history item interface
export interface MedicalHistoryItem {
  condition: string
  diagnosisDate?: string
  status: 'active' | 'resolved' | 'chronic'
  notes?: string
}

// Medication interface
export interface Medication {
  name: string
  dosage: string
  frequency: string
  startDate?: string
  endDate?: string
  prescribedBy?: string
  notes?: string
}

// Allergy interface
export interface Allergy {
  allergen: string
  severity: 'mild' | 'moderate' | 'severe'
  reaction: string
  notes?: string
}

// Patient interfaces
export interface Patient {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  medicalHistory?: MedicalHistoryItem[]
  medications?: Medication[]
  allergies?: Allergy[]
  insuranceProvider?: string
  insuranceNumber?: string
  referralSource?: string
  referralDate?: string
  status: 'active' | 'inactive' | 'discharged'
  notes?: string
  createdAt: string
  updatedAt: string
}

// Patient Document interface
export interface PatientDocument {
  id: string
  patientId: string
  organizationId: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  storageKey: string
  category: 'referral' | 'imaging' | 'lab_results' | 'treatment_notes' | 'other'
  description?: string
  uploadedBy: string
  uploadedAt: string
}

// Zod schemas for validation
export const patientInsertSchema = createInsertSchema(patients).extend({
  firstName: z.string().min(3, 'Le prénom doit contenir au moins 3 caractères').max(50),
  lastName: z.string().min(3, 'Le nom de famille doit contenir au moins 3 caractères').max(50),
  email: z.email('Adresse email invalide').optional().or(z.literal('')),
  phone: z.string().min(10, 'Le numéro de téléphone doit contenir au moins 10 caractères').optional(),
  // Accept ISO string/number and convert to Date
  dateOfBirth: z.preprocess((val) => {
    if (val instanceof Date) return val
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val as any)
      if (!isNaN(d.getTime())) return d
    }
    return undefined
  }, z.date().optional()),
  gender: z.enum(['male', 'female']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  medicalHistory: z.array(z.any()).optional(),
  medications: z.array(z.any()).optional(),
  allergies: z.array(z.any()).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referralSource: z.string().optional(),
  referralDate: z.preprocess((val) => {
    if (val instanceof Date) return val
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val as any)
      if (!isNaN(d.getTime())) return d
    }
    return undefined
  }, z.date().optional()),
  status: z.enum(['active', 'inactive', 'discharged']).default('active'),
  notes: z.string().optional(),

  mainComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  conditions: z.string().optional(),
  surgeries: z.string().optional(),
  insuranceDetails: z.string().optional(),
  billingNotes: z.string().optional()
})

export const patientUpdateSchema = createUpdateSchema(patients).extend({
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50).optional(),
  email: z.email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.preprocess((val) => {
    if (val instanceof Date) return val
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val as any)
      if (!isNaN(d.getTime())) return d
    }
    return undefined
  }, z.date().optional()),
  gender: z.enum(['male', 'female']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  medicalHistory: z.array(z.any()).optional(),
  medications: z.array(z.any()).optional(),
  allergies: z.array(z.any()).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referralSource: z.string().optional(),
  referralDate: z.preprocess((val) => {
    if (val instanceof Date) return val
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val as any)
      if (!isNaN(d.getTime())) return d
    }
    return undefined
  }, z.date().optional()),
  status: z.enum(['active', 'inactive', 'discharged']).optional(),
  notes: z.string().optional()
})

export const patientSelectSchema = createSelectSchema(patients)

// Patient Document schemas
export const patientDocumentInsertSchema = createInsertSchema(patientDocuments).extend({
  fileName: z.string().min(1, 'File name is required'),
  originalName: z.string().min(1, 'Original name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.number().min(1, 'File size is required'),
  storageKey: z.string().min(1, 'Storage key is required'),
  category: z.enum(['referral', 'imaging', 'lab_results', 'treatment_notes', 'other']),
  description: z.string().optional(),
  uploadedBy: z.string().min(1, 'Uploaded by is required')
})

export const patientDocumentSelectSchema = createSelectSchema(patientDocuments)

// Type exports
export type PatientInsertSchema = z.output<typeof patientInsertSchema>
export type PatientUpdateSchema = z.output<typeof patientUpdateSchema>
export type PatientSelectSchema = z.output<typeof patientSelectSchema>
export type PatientDocumentInsertSchema = z.output<typeof patientDocumentInsertSchema>
export type PatientDocumentSelectSchema = z.output<typeof patientDocumentSelectSchema>
