import { createUpdateSchema } from 'drizzle-zod'
import { authClient } from '~~/app/utils/auth-client'
import { users } from '~~/server/database/schema'
import { z } from 'zod'
import { fr } from 'zod/locales'

z.config(fr())

// ============================================================================
// Shared Schemas & Constants
// ============================================================================

const PhoneCategory = z.enum(['personal', 'cabinet', 'emergency'], {
  message: 'La catégorie doit être personal, cabinet ou urgence'
})

const PHONE_REGEX = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{7,}$/

const phoneNumberSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  number: z
    .string()
    .min(1, 'Le numéro est requis')
    .regex(PHONE_REGEX, 'Format de numéro de téléphone invalide')
    .transform((val) => val.replace(/\s+/g, '')), // Normalize phone numbers
  category: PhoneCategory
})

const nameSchema = z
  .string()
  .min(1, 'Ce champ est requis')
  .max(25, 'Ne peut pas dépasser 25 caractères')
  .trim()
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Caractères invalides dans le nom')

const emailSchema = z.email('Adresse email invalide').toLowerCase().trim()

const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

const specializationSchema = z
  .array(z.string().trim().min(1, 'La spécialisation ne peut pas être vide'))
  .min(1, 'Au moins une spécialisation est requise')

const sessionDurationSchema = z
  .number('La durée doit être un nombre')
  .int('La durée doit être un nombre entier')
  .min(15, 'La durée minimale de session est de 15 minutes')
  .max(180, 'La durée maximale de session est de 180 minutes')

// ============================================================================
// SignUp Schema
// ============================================================================

export const signUpSchema = z
  .object({
    firstName: nameSchema.describe("Prénom de l'utilisateur"),
    lastName: nameSchema.describe("Nom de famille de l'utilisateur"),
    email: emailSchema,
    specialization: specializationSchema.optional(),
    licenseNumber: z.string().trim().min(1, 'Le numéro de licence est requis').optional().or(z.literal('')),
    defaultSessionDuration: sessionDurationSchema.default(60).optional(),
    phoneNumbers: z
      .array(phoneNumberSchema)
      .min(1, 'Au moins un numéro de téléphone est requis')
      .max(5, 'Maximum 5 numéros de téléphone autorisés')
      .optional(),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, 'La confirmation du mot de passe est requise')
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'Les mots de passe ne correspondent pas',
        path: ['passwordConfirm']
      })
    }

    // Validate unique phone numbers
    if (data.phoneNumbers && data.phoneNumbers.length > 1) {
      const numbers = data.phoneNumbers.map((p) => p.number)
      const uniqueNumbers = new Set(numbers)
      if (numbers.length !== uniqueNumbers.size) {
        ctx.addIssue({
          code: 'custom',
          message: 'Les numéros de téléphone doivent être uniques',
          path: ['phoneNumbers']
        })
      }
    }
  })

// ============================================================================
// SignIn Schema
// ============================================================================

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Le mot de passe est requis'),
    rememberMe: z.boolean().default(false).optional()
  })
  .strict()

// ============================================================================
// User Update Schema
// ============================================================================

export const userUpdateSchema = createUpdateSchema(users, {
  firstName: nameSchema,
  lastName: nameSchema,
  specialization: specializationSchema.optional(),
  licenseNumber: z.string().trim().min(1, 'Le numéro de licence est requis').optional().or(z.literal('')),
  defaultSessionDuration: sessionDurationSchema.optional(),
  phoneNumbers: z
    .array(phoneNumberSchema)
    .min(1, 'Au moins un numéro de téléphone est requis')
    .max(5, 'Maximum 5 numéros de téléphone autorisés')
    .optional()
})
  .strict()
  .superRefine((data, ctx) => {
    // Validate unique phone numbers
    if (data.phoneNumbers && data.phoneNumbers.length > 1) {
      const numbers = data.phoneNumbers.map((p) => p.number)
      const uniqueNumbers = new Set(numbers)
      if (numbers.length !== uniqueNumbers.size) {
        ctx.addIssue({
          code: 'custom',
          message: 'Les numéros de téléphone doivent être uniques',
          path: ['phoneNumbers']
        })
      }
    }
  })

// ============================================================================
// Password Update Schema
// ============================================================================

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis').optional(),
    password: passwordSchema.optional(),
    passwordConfirm: z.string().optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // If password is provided, passwordConfirm must also be provided
    if (data.password && !data.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'La confirmation du mot de passe est requise',
        path: ['passwordConfirm']
      })
    }

    // If both are provided, they must match
    if (data.password && data.passwordConfirm && data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'Les mots de passe ne correspondent pas',
        path: ['passwordConfirm']
      })
    }
  })

// ============================================================================
// Type Exports
// ============================================================================

export type SignUpSchema = z.output<typeof signUpSchema>
export type LoginSchema = z.output<typeof loginSchema>
export type UpdateUser = z.output<typeof userUpdateSchema>
export type UpdatePassword = z.output<typeof updatePasswordSchema>
export type PhoneNumber = z.output<typeof phoneNumberSchema>
export type PhoneCategoryType = z.infer<typeof PhoneCategory>

// User Type
export type User = NonNullable<SessionData>['user']

// Session types
export type UseSessionReturn = Awaited<ReturnType<typeof authClient.useSession>>
export type SessionData = NonNullable<UseSessionReturn>['data']['value']

// TODO fix this ------------------------------  Session type for API usage
export interface Session {
  user: {
    id: string
    name: string
    email: string
    firstName?: string
    lastName?: string
    image?: string
  }
  session: {
    activeOrganizationId?: string
    activeTeamId?: string
  }
}
