import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { users } from '~~/server/database/schema'
import { z } from 'zod'
import { authClient } from '../../app/utils/auth-client'
import { fr } from 'zod/locales'

z.config(fr())

// SignUp Schema
export const signUpSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(25),
  lastName: z.string().min(1, 'Le nom de famille est requis').max(25),
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})
export type SignUpSchema = z.output<typeof signUpSchema>

export const loginSchema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  rememberMe: z.boolean().optional()
})
export type LoginSchema = z.output<typeof loginSchema>

// User Update Schema
export const updateUserSchema = createUpdateSchema(users)
  .extend({
    firstName: z.string().min(1, 'Le prénom est requis').max(25),
    lastName: z.string().min(1, 'Le nom de famille est requis').max(25),
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
export type UpdateUserSchema = z.output<typeof updateUserSchema>

// User SelectSchema
export const userSelectSchema = createSelectSchema(users)
export type UserSelectSchema = z.output<typeof userSelectSchema>

// Session types
export type UseSessionReturn = Awaited<ReturnType<typeof authClient.useSession>>
type SessionData = NonNullable<UseSessionReturn>['data']['value']

export type User = NonNullable<SessionData>['user']
export type Session = SessionData
