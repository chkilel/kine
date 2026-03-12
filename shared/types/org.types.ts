import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'
import { organizations } from '~~/server/database/schema'
import { phoneEntrySchema } from '~~/shared/types/base.types'
import {
  ORGANIZATION_TYPES,
  LEGAL_FORMS,
  PAYMENT_METHODS,
  PAYMENT_DELAYS,
  ORGANIZATION_STATUS
} from '~~/shared/utils/constants.location'

z.config(fr())

const orgNameSchema = z
  .string()
  .min(5, 'Le nom doit avoir au moins 5 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')

const orgSlugSchema = z
  .string()
  .min(5, 'Le slug doit avoir au moins 5 caractères')
  .max(50, 'Le slug ne peut pas dépasser 50 caractères')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (seulement lettres minuscules, chiffres et tirets)')

export const organizationTypeSchema = z.enum(ORGANIZATION_TYPES, { message: "Type d'établissement invalide" })
export type OrganizationType = z.infer<typeof organizationTypeSchema>

export const legalFormSchema = z.enum(LEGAL_FORMS, { message: 'Form juridique invalide' })
export type LegalForm = z.infer<typeof legalFormSchema>

export const paymentMethodSchema = z.enum(PAYMENT_METHODS, { message: 'Mode de paiement invalide' })
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const paymentDelaySchema = z.enum(PAYMENT_DELAYS, { message: 'Délai de paiement invalide' })
export type PaymentDelay = z.infer<typeof paymentDelaySchema>

export const orgContactSchema = z.object({
  email: z.email('Adresse email invalide'),
  website: z.url('URL invalide').optional(),
  phones: z.array(phoneEntrySchema).min(1, 'Au moins un numéro de téléphone requis')
})
export type OrgContact = z.infer<typeof orgContactSchema>

export const orgAddressSchema = z.object({
  street: z.string().min(1, 'Adresse requise'),
  postalCode: z.string().min(1, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise'),
  sector: z.string().optional(),
  country: z.string().default('Maroc')
})
export type OrgAddress = z.infer<typeof orgAddressSchema>

export const orgLegalRepSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  email: z.email('Email invalide').optional(),
  phone: z.string().optional(),
  idNumber: z.string().optional()
})
export type OrgLegalRep = z.infer<typeof orgLegalRepSchema>

export const orgFiscalSchema = z.object({
  ice: z.string().min(15, 'ICE doit avoir 15 chiffres').max(15, 'ICE doit avoir 15 chiffres'),
  rc: z.string().min(1, 'RC est requis'),
  if: z.string().optional(),
  license: z.string().optional(),
  legalForm: legalFormSchema,
  creationDate: z.string().optional(),
  vatRate: z.number().min(0, 'Taux de TVA doit être entre 0 et 100').max(100),
  vatSubject: z.boolean(),
  paymentDelay: paymentDelaySchema,
  paymentMethod: paymentMethodSchema,
  currency: z.string().default('MAD'),
  invoicePrefix: z.string().optional(),
  requirePurchaseOrder: z.boolean().optional()
})
export type OrgFiscal = z.infer<typeof orgFiscalSchema>

export const orgBankingSchema = z.object({
  bankName: z.string().min(1, 'Nom de la banque requis'),
  iban: z.string().min(1, 'IBAN requis'),
  rib: z.string().length(24, 'RIB doit avoir 24 chiffres'),
  agency: z.string().optional(),
  accountHolder: z.string().min(1, 'Titulaire du compte requis')
})
export type OrgBanking = z.infer<typeof orgBankingSchema>

export const orgPricingSchema = z.object({
  sessionRates: z.object({
    clinic: z.number().optional(),
    home: z.number().optional(),
    telehealth: z.number().optional()
  }),
  packages: z
    .array(
      z.object({
        name: z.string(),
        sessionCount: z.number(),
        price: z.number()
      })
    )
    .default([])
})
export type OrgPricing = z.infer<typeof orgPricingSchema>

export const orgSchedulingSchema = z.object({
  bookingWindowDays: z
    .number()
    .min(1, "La fenêtre doit être d'au moins 1 jour")
    .max(365, 'La fenêtre ne peut pas dépasser 365 jours')
    .default(30),
  cancellationHours: z
    .number()
    .min(0, "Les heures d'annulation doivent être positives")
    .max(168, 'Ne peut pas dépasser 168 heures (1 semaine)')
    .default(24),
  allowSameDay: z.boolean().default(false),
  requirePaymentUpfront: z.boolean().default(false),
  remindersEnabled: z.boolean().default(true),
  reminderIntervals: z.array(z.number()).default([24, 48])
})
export type OrgScheduling = z.infer<typeof orgSchedulingSchema>

export const orgClinicalSchema = z.object({
  defaultDurationMinutes: z
    .number()
    .min(15, "La durée doit être d'au moins 15 minutes")
    .max(120, 'La durée ne peut pas dépasser 120 minutes')
    .default(30),
  requirePainAssessment: z.boolean().default(true),
  requireGoals: z.boolean().default(true),
  requireNextSteps: z.boolean().default(true),
  noteTemplates: z.array(z.string()).default([])
})
export type OrgClinical = z.infer<typeof orgClinicalSchema>

export const orgNotificationsSchema = z.object({
  patient: z.object({
    appointmentConfirmation: z.boolean().default(true),
    appointmentReminder: z.boolean().default(true),
    paymentReminder: z.boolean().default(true)
  }),
  staff: z.object({
    newAppointment: z.boolean().default(true),
    cancellation: z.boolean().default(true)
  })
})
export type OrgNotifications = z.infer<typeof orgNotificationsSchema>

export const orgIntakeSchema = z.object({
  requiredFields: z.array(z.string()).default(['firstName', 'lastName', 'dateOfBirth', 'phone', 'email', 'address']),
  consents: z.object({
    privacy: z.boolean().default(true),
    treatment: z.boolean().default(true),
    financial: z.boolean().default(true),
    telehealth: z.boolean().default(false)
  })
})
export type OrgIntake = z.infer<typeof orgIntakeSchema>

export const orgBrandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur primaire invalide (format: #RRGGBB)')
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur secondaire invalide (format: #RRGGBB)')
    .optional(),
  customDomain: z.string().optional(),
  logoUrl: z.url('URL invalide').optional()
})
export type OrgBranding = z.infer<typeof orgBrandingSchema>

// ---------------------------------------- Org --------------------------------------
export const organizationResponseSchema = createSelectSchema(organizations, {
  id: z.string(),
  name: orgNameSchema,
  slug: orgSlugSchema,
  type: organizationTypeSchema,
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères'),
  logo: z.string().nullable(),
  contact: orgContactSchema.nullable(),
  address: orgAddressSchema.nullable(),
  legalRepresentative: orgLegalRepSchema.nullable(),
  fiscal: orgFiscalSchema.nullable(),
  banking: orgBankingSchema.nullable(),
  pricing: orgPricingSchema.nullable(),
  scheduling: orgSchedulingSchema.nullable(),
  clinical: orgClinicalSchema.nullable(),
  notifications: orgNotificationsSchema.nullable(),
  intake: orgIntakeSchema.nullable(),
  branding: orgBrandingSchema.nullable(),
  status: z.enum(ORGANIZATION_STATUS).nullable(),
  timezone: z.string(),
  metadata: z.any()
})

export const organizationInsertSchema = createInsertSchema(organizations, {
  name: orgNameSchema,
  slug: orgSlugSchema,
  type: organizationTypeSchema.optional(),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  logo: z.string().nullable(),
  contact: orgContactSchema,
  address: orgAddressSchema,
  legalRepresentative: orgLegalRepSchema.optional(),
  fiscal: orgFiscalSchema.optional(),
  banking: orgBankingSchema.optional(),
  pricing: orgPricingSchema.optional(),
  scheduling: orgSchedulingSchema.optional(),
  clinical: orgClinicalSchema.optional(),
  notifications: orgNotificationsSchema.optional(),
  intake: orgIntakeSchema.optional(),
  branding: orgBrandingSchema.optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  timezone: z.string().default('Africa/Casablanca'),
  metadata: z.any().optional()
}).extend({
  logoFile: z
    .any()
    .optional()
    .refine((file) => !file || (file instanceof File && file.size <= 2_000_000), 'Logo trop volumineux (2 Mo max)')
    .refine(
      (file) => !file || (file instanceof File && file.type?.startsWith?.('image/')),
      'Le fichier doit être une image'
    ),
  metadataText: z
    .string()
    .refine((val) => {
      if (!val.trim()) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    }, 'Métadonnées JSON invalide')
    .optional()
})

export const updateOrganizationSchema = organizationInsertSchema.partial()

export const orgGeneralesSchema = z.object({
  name: orgNameSchema,
  slug: orgSlugSchema,
  type: organizationTypeSchema.optional(),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  contact: orgContactSchema,
  address: orgAddressSchema,
  legalRepresentative: orgLegalRepSchema
})
export type OrgGenerales = z.infer<typeof orgGeneralesSchema>

export const orgLegalSchema = z.object({
  fiscal: orgFiscalSchema,
  banking: orgBankingSchema
})
export type OrgLegal = z.infer<typeof orgLegalSchema>

export const orgPricingSchedulingSchema = z.object({
  pricing: orgPricingSchema,
  scheduling: orgSchedulingSchema
})
export type OrgPricingScheduling = z.infer<typeof orgPricingSchedulingSchema>

export const orgClinicalIntakeNotificationsSchema = z.object({
  clinical: orgClinicalSchema,
  intake: orgIntakeSchema,
  notifications: orgNotificationsSchema
})
export type OrgClinicalIntakeNotifications = z.infer<typeof orgClinicalIntakeNotificationsSchema>

export const orgBrandingOnlySchema = z.object({
  branding: orgBrandingSchema
})
export type OrgBrandingOnly = z.infer<typeof orgBrandingOnlySchema>

export const orgMetadataSchema = z.object({
  metadataText: z.string().refine(
    (val) => {
      if (!val.trim()) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'Métadonnées JSON invalide' }
  )
})

//---------------------------- Onboarding --------------------------
const onboardingSessionRatesSchema = z.object({
  clinic: z.number().min(1, 'Le tarif doit être positif'),
  home: z.number().min(1, 'Le tarif doit être positif'),
  telehealth: z.number().min(1, 'Le tarif doit être positif')
})

export const stepSchemas = [
  // Step 0 — Identité
  z.object({
    name: orgNameSchema,
    slug: orgSlugSchema
  }),
  // Step 1 — Contact
  z.object({
    contact: orgContactSchema
  }),
  // Step 2 — Adresse
  z.object({
    address: orgAddressSchema
  }),
  // Step 3 — Tarifs (all optional, no blocking validation)
  z.object({
    sessionRates: onboardingSessionRatesSchema
  })
]

export const onboardingSchema = z.object({
  name: orgNameSchema,
  slug: orgSlugSchema,
  contact: z.object({
    email: z.email('Adresse email invalide'),
    phones: z.array(phoneEntrySchema).min(1, 'Au moins un numéro de téléphone requis')
  }),
  address: orgAddressSchema,
  sessionRates: onboardingSessionRatesSchema
})

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export type OnboardingData = z.infer<typeof onboardingSchema>
export type OrgMetadata = z.infer<typeof orgMetadataSchema>
export type Organization = Omit<z.output<typeof organizationResponseSchema>, 'updatedAt'>
export type UpdateOrganization = z.input<typeof updateOrganizationSchema>
