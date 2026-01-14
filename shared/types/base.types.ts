import { z } from 'zod'
import { fr } from 'zod/locales'

import { VALID_DOCUMENT_TYPES } from '../utils/constants.document'
import { VALID_PATIENT_STATUSES, VALID_RELATIONSHIP_TYPES, VALID_SEX_VALUES } from '../utils/constants.patient'
import { VALID_COVERAGE_STATUSES, VALID_TREATMENT_PLAN_STATUSES } from '../utils/constants.treatement-plan'
import { VALID_SCHEDULE_DAYS, VALID_SCHEDULE_EXCEPTION_TYPES } from '../utils/constants.availability'
import { VALID_CONSULTATION_LOCATIONS } from '../utils/constants.location'
import { VALID_PHONE_CATEGORIES } from '../utils/constants.user'
import { VALID_CONSULTATION_STATUSES, VALID_CONSULTATION_TYPES } from '../utils/constants.consultation'

z.config(fr())

// Regex pattern for validating time in HH:MM:SS format
export const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/

// Regex pattern for validating phone numbers with optional country code
export const PHONE_REGEX = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{7,}$/

// Basic validation schemas
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

//  Date string schema for calendar dates (YYYY-MM-DD) with validation
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(d.getTime())
  }, 'Invalid calendar date')

// Common schemas
export const genderSchema = z.enum(VALID_SEX_VALUES)
export type Gender = z.infer<typeof genderSchema>

export const patientStatusSchema = z.enum(VALID_PATIENT_STATUSES)
export type PatientStatus = z.infer<typeof patientStatusSchema>

export const documentCategorySchema = z.enum(VALID_DOCUMENT_TYPES)
export type DocumentCategory = z.infer<typeof documentCategorySchema>

export const relationshipSchema = z.enum(VALID_RELATIONSHIP_TYPES)
export type Relationship = z.infer<typeof relationshipSchema>

export const insuranceCoverageSchema = z.enum(VALID_COVERAGE_STATUSES)
export type InsuranceCoverageStatus = z.infer<typeof insuranceCoverageSchema>

export const dayOfWeekSchema = z.enum(VALID_SCHEDULE_DAYS)
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

export const locationSchema = z.enum(VALID_CONSULTATION_LOCATIONS)
export type ConsultationLocation = z.infer<typeof locationSchema>

export const timeFormatSchema = z.string().regex(TIME_FORMAT_REGEX, "Format d'heure invalide (HH:MM:SS)")
export type TimeFormat = z.infer<typeof timeFormatSchema>

export const reasonSchema = z.enum(VALID_SCHEDULE_EXCEPTION_TYPES)
export type Reason = z.infer<typeof reasonSchema>

export const consultationTypeSchema = z.enum(VALID_CONSULTATION_TYPES)
export type ConsultationType = z.infer<typeof consultationTypeSchema>

export const consultationStatusSchema = z.enum(VALID_CONSULTATION_STATUSES)
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>

export const treatmentPlanStatusSchema = z.enum(VALID_TREATMENT_PLAN_STATUSES)
export type TreatmentPlanStatus = z.infer<typeof treatmentPlanStatusSchema>

// Note schema
export const noteSchema = z.object({
  author: z.string(),
  date: z.coerce.date(),
  content: z.string().min(1)
})
export type Note = z.infer<typeof noteSchema>

// Phone number schemas
export const phoneNumberSchema = z
  .string()
  .min(1, 'Le numéro est requis')
  .regex(
    PHONE_REGEX,
    'Format de numéro de téléphone invalide. \n Entrez un numéro de téléphone avec ou sans indicatif international, les espaces et tirets sont autorisés.'
  )
  .transform((val) => val.replace(/\s+/g, '')) // Normalize phone numbers

// Phone category schema
export const phoneCategorySchema = z.enum(VALID_PHONE_CATEGORIES, { message: 'La catégorie est requise' })
export type PhoneCategory = z.infer<typeof phoneCategorySchema>

// Phone entry schema, combining number and category
export const phoneEntrySchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  number: phoneNumberSchema,
  category: phoneCategorySchema
})
export type PhoneEntry = z.infer<typeof phoneEntrySchema>

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  number: z.string(),
  relationship: relationshipSchema.optional()
})
export type EmergencyContact = z.infer<typeof emergencyContactSchema>
