import { z } from 'zod'
import { fr } from 'zod/locales'

z.config(fr())

// =============================================================================
// Regex Patterns
// =============================================================================

// Validating time in HH:MM:SS format
export const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
// Validating phone numbers with optional country code
export const PHONE_REGEX = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{7,}$/

// =============================================================================
// Basic Validation Schemas
// =============================================================================

export const nameSchema = z
  .string()
  .min(1, 'Ce champ est requis')
  .max(25, 'Ne peut pas dépasser 25 caractères')
  .trim()
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Caractères invalides dans le nom')

export const emailSchema = z.email('Adresse email invalide').toLowerCase().trim()

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

// =============================================================================
// Calendar Date Schema (YYYY-MM-DD)
// =============================================================================

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(d.getTime())
  }, 'Invalid calendar date')

// =============================================================================
// Time Format Schema
// =============================================================================

export const timeFormatSchema = z.string().regex(TIME_FORMAT_REGEX, "Format d'heure invalide (HH:MM:SS)")
export type TimeFormat = z.infer<typeof timeFormatSchema>

// =============================================================================
// Note Schema
// =============================================================================

export const noteSchema = z.object({
  author: z.string(),
  date: z.coerce.date(),
  content: z.string().min(1)
})
export type Note = z.infer<typeof noteSchema>

// =============================================================================
// Phone Category Constants
// =============================================================================

export const PHONE_CATEGORIES = ['personal', 'clinic', 'emergency', 'mobile', 'whatsapp'] as const
export const phoneCategorySchema = z.enum(PHONE_CATEGORIES)
export type PhoneCategory = z.infer<typeof phoneCategorySchema>

// =============================================================================
// Phone Number Schemas
// =============================================================================

export const phoneNumberSchema = z
  .string()
  .min(1, 'Le numéro est requis')
  .min(10, 'Le numéro doit avoir au moin 10 chiffres')
  .regex(
    PHONE_REGEX,
    'Format de numéro de téléphone invalide. \n Entrez un numéro de téléphone avec ou sans indicatif international, les espaces et tirets sont autorisés.'
  )
  .transform((val) => val.replace(/\s+/g, ''))

// =============================================================================
// Phone Entry Schema
// =============================================================================

export const phoneEntrySchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  number: phoneNumberSchema,
  category: phoneCategorySchema
})
export type PhoneEntry = z.infer<typeof phoneEntrySchema>

// =============================================================================
// Relationship Types Constants
// =============================================================================

export const RELATIONSHIP_TYPES = [
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
] as const
export const relationshipSchema = z.enum(RELATIONSHIP_TYPES)
export type Relationship = z.infer<typeof relationshipSchema>

// =============================================================================
// Sex Values Constants
// =============================================================================

export const SEX_VALUES = ['male', 'female'] as const
export const sexSchema = z.enum(SEX_VALUES)
export type Sex = z.infer<typeof sexSchema>

// =============================================================================
// Insurance Coverage Status Constants
// =============================================================================

export const COVERAGE_STATUSES = [
  'not_required',
  'not_provided',
  'to_verify',
  'awaiting_agreement',
  'covered',
  'partially_covered',
  'refused',
  'expired',
  'cancelled'
] as const
export const insuranceCoverageSchema = z.enum(COVERAGE_STATUSES)
export type InsuranceCoverageStatus = z.infer<typeof insuranceCoverageSchema>

// =============================================================================
// Treatment Plan Status Constants
// =============================================================================

export const TREATMENT_PLAN_STATUSES = ['planned', 'ongoing', 'completed', 'paused', 'cancelled'] as const
export const treatmentPlanStatusSchema = z.enum(TREATMENT_PLAN_STATUSES)
export type TreatmentPlanStatus = z.infer<typeof treatmentPlanStatusSchema>

// =============================================================================
// Location Constants
// =============================================================================

export const LOCATIONS = ['clinic', 'home', 'telehealth'] as const
export const locationSchema = z.enum(LOCATIONS)
export type Location = z.infer<typeof locationSchema>

// =============================================================================
// Organization Status Constants
// =============================================================================

export const ORGANIZATION_STATUS = ['active', 'inactive', 'suspended'] as const
export const organizationStatusSchema = z.enum(ORGANIZATION_STATUS)
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>

// =============================================================================
// Organization Types Constants
// =============================================================================

export const ORGANIZATION_TYPES = ['cabinet', 'medical-center', 'clinic', 'rehabilitation-center'] as const
export const organizationTypeSchema = z.string()
export type OrganizationType = z.infer<typeof organizationTypeSchema>

// =============================================================================
// Legal Forms Constants
// =============================================================================

export const LEGAL_FORMS = ['liberal-profession', 'civil-company', 'commercial-company', 'other'] as const
export const legalFormSchema = z.enum(LEGAL_FORMS)
export type LegalForm = z.infer<typeof legalFormSchema>

// =============================================================================
// Document Category Constants
// =============================================================================

export const DOCUMENT_TYPES = [
  'referral',
  'imaging',
  'lab_results',
  'treatment_notes',
  'prescriptions',
  'other'
] as const
export const documentCategorySchema = z.enum(DOCUMENT_TYPES)
export type DocumentCategory = z.infer<typeof documentCategorySchema>

// =============================================================================
// Appointment Types Constants
// =============================================================================

export const APPOINTMENT_TYPES: Omit<OrgAppointmentTypeItem, 'id'>[] = [
  { code: 'INITIAL', title: 'Évaluation initiale', isDefault: true },
  { code: 'FOLLOW_UP', title: 'Suivi', isDefault: true },
  { code: 'TREATMENT', title: 'Séance de traitement', isDefault: true },
  { code: 'MOBILIZATION', title: 'Mobilisation', isDefault: true },
  { code: 'REINFORCEMENT', title: 'Renforcement', isDefault: true },
  { code: 'REEDUCATION', title: 'Rééducation', isDefault: true },
  { code: 'EXERCISE_SUPERVISION', title: "Supervision d'exercices", isDefault: true },
  { code: 'POST_OP_FOLLOW_UP', title: 'Suivi post-opératoire', isDefault: true },
  { code: 'URGENT_VISIT', title: 'Consultation urgente', isDefault: true },
  { code: 'CONSULTATION', title: 'Consultation individuelle', isDefault: true },
  { code: 'DISCHARGE', title: 'Sortie', isDefault: true }
]

// =============================================================================
// Appointment Status Constants
// =============================================================================

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'in_progress',
  'finished',
  'cancelled',
  'no_show'
] as const
export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES)
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>

// =============================================================================
// Schedule Days Constants
// =============================================================================

export const SCHEDULE_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export const dayOfWeekSchema = z.enum(SCHEDULE_DAYS)
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

// =============================================================================
// Schedule Exception Types Constants
// =============================================================================

export const SCHEDULE_EXCEPTION_TYPES = [
  'vacation',
  'holiday',
  'sick',
  'training',
  'meeting',
  'personal',
  'reduced_hours',
  'other'
] as const
export const reasonSchema = z.enum(SCHEDULE_EXCEPTION_TYPES)
export type Reason = z.infer<typeof reasonSchema>

// =============================================================================
// Payment Methods Constants
// =============================================================================

export const PAYMENT_METHODS = ['cash', 'bank-card', 'check', 'bank-transfer', 'deposit'] as const
export const paymentMethodSchema = z.enum(PAYMENT_METHODS)
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const PAYMENT_FUNDING_METHODS = ['cash', 'bank-card', 'check', 'bank-transfer'] as const
export const paymentFundingMethodSchema = z.enum(PAYMENT_FUNDING_METHODS)
export type PaymentFundingMethod = z.infer<typeof paymentFundingMethodSchema>

// =============================================================================
// Payment Delays Constants
// =============================================================================

export const PAYMENT_DELAYS = ['immediate', '7', '15', '30', 'end-of-month'] as const
export const paymentDelaySchema = z.enum(PAYMENT_DELAYS)
export type PaymentDelay = z.infer<typeof paymentDelaySchema>

// =============================================================================
// Payment Types Constants
// =============================================================================

export const PAYMENT_TYPES = ['session_payment', 'session_refund', 'deposit_add', 'deposit_refund'] as const
export const paymentTypeSchema = z.enum(PAYMENT_TYPES)
export type PaymentType = z.infer<typeof paymentTypeSchema>

// =============================================================================
// Payment Status Constants
// =============================================================================

export const APPOINTMENT_PAYMENT_STATUSES = ['unpaid', 'copay_paid', 'partially_paid', 'paid'] as const
export const appointmentPaymentStatusSchema = z.enum(APPOINTMENT_PAYMENT_STATUSES)
export type AppointmentPaymentStatus = z.infer<typeof appointmentPaymentStatusSchema>

// =============================================================================
// Pricing Constants
// =============================================================================

export const rateCentSchema = z.object({
  clinic: z.number().min(1, 'Le tarif doit être positif'),
  home: z.number().min(1, 'Le tarif doit être positif'),
  telehealth: z.number().min(1, 'Le tarif doit être positif')
})
export type RateCent = z.infer<typeof rateCentSchema>

export const priceItemSchema = z.object({
  id: z.string(),
  code: z.string().min(1, 'Le code est requis'),
  description: z.string().min(1, 'La description est requise'),
  rateCent: rateCentSchema,
  isDefault: z.boolean().default(false)
})
export type PriceItem = z.infer<typeof priceItemSchema>

export const RESERVED_PRICE_ITEM_CODE = 'DEFAULT'

export const priceItemSnapshotSchema = priceItemSchema.omit({ id: true, isDefault: true })
export type PriceItemSnapshot = z.infer<typeof priceItemSnapshotSchema>

// =============================================================================
// Emergency Contact Schema
// =============================================================================

export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  number: z.string(),
  relationship: relationshipSchema.optional()
})
export type EmergencyContact = z.infer<typeof emergencyContactSchema>
