import * as z from 'zod/v4'

// SignUpSchema
export const signUpSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom de famille est requis'),
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})
export type SignUpSchema = z.output<typeof signUpSchema>

// LoginSchema
export const loginSchema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  rememberMe: z.boolean().default(false).optional(),
})
export type LoginSchema = z.output<typeof loginSchema>
