import { createUpdateSchema } from 'drizzle-zod'
import { authClient } from '~~/app/utils/auth-client'
import { users } from '~~/server/database/schema'
import { z } from 'zod'
import { fr } from 'zod/locales'

z.config(fr())

// SignUp Schema
export const signUpSchema = z
  .object({
    firstName: z.string().nonempty('Le prénom est requis').max(25, 'Le prénom ne peut pas dépasser 25 caractères'),
    lastName: z
      .string()
      .nonempty('Le nom de famille est requis')
      .max(25, 'Le nom de famille ne peut pas dépasser 25 caractères'),
    email: z.email('Adresse email invalide'),
    specialization: z
      .array(z.string().trim().min(1, 'La spécialisation est requise'))
      .min(1, 'La spécialisation est requise')
      .optional(),
    licenseNumber: z.string().nonempty('Le numéro de licence est requis').optional(),
    defaultSessionDuration: z
      .number()
      .min(15, 'La durée minimale de session est de 15 minutes')
      .max(180, 'La durée maximale de session est de 180 minutes')
      .optional(),
    phoneNumbers: z.array(
      z
        .object({
          number: z.string().nonempty('Le numéro est requis'),
          category: z.enum(['personal' as const, 'cabinet' as const, 'emergency' as const], 'La catégorie est requise'),
          id: z.string().nonempty("L'ID est requis")
        })
        .optional()
    ),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    passwordConfirm: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional()
  })
  .superRefine((data, ctx) => {
    if (data.password && data.passwordConfirm) {
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: 'custom',
          message: 'Les mots de passe ne correspondent pas',
          path: ['passwordConfirm']
        })
      }
    }
  })

// SignIn schema
export const loginSchema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  rememberMe: z.boolean().optional()
})

// User Update Schema
export const userUpdateSchema = createUpdateSchema(users, {
  firstName: z.string().nonempty('Le prénom est requis').max(25, 'Le prénom ne peut pas dépasser 25 caractères'),
  lastName: z
    .string()
    .nonempty('Le nom de famille est requis')
    .max(25, 'Le nom de famille ne peut pas dépasser 25 caractères'),
  specialization: z
    .array(z.string().trim().min(1, 'La spécialisation est requise'))
    .min(1, 'La spécialisation est requise')
    .optional(),
  licenseNumber: z.string().nonempty('Le numéro de licence est requis').optional(),
  defaultSessionDuration: z
    .number()
    .min(15, 'La durée minimale de session est de 15 minutes')
    .max(180, 'La durée maximale de session est de 180 minutes')
    .optional(),
  phoneNumbers: z
    .array(
      z.object({
        id: z.string().nonempty("L'ID est requis"),
        number: z.string().nonempty('Le numéro est requis'),
        category: z.enum(['personal' as const, 'cabinet' as const, 'emergency' as const], 'La catégorie est requise')
      })
    )
    .optional()
})

// Password update schema
export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
    passwordConfirm: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional()
  })
  .superRefine((data, ctx) => {
    if (data.password && data.passwordConfirm) {
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: 'custom',
          message: 'Les mots de passe ne correspondent pas',
          path: ['passwordConfirm']
        })
      }
    }
  })

export type SignUpSchema = z.output<typeof signUpSchema>
export type LoginSchema = z.output<typeof loginSchema>
export type UpdateUser = z.output<typeof userUpdateSchema>

// User Type
export type User = NonNullable<SessionData>['user']

// Session types
export type UseSessionReturn = Awaited<ReturnType<typeof authClient.useSession>>
export type SessionData = NonNullable<UseSessionReturn>['data']['value']
