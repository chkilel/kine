import { createUpdateSchema } from 'drizzle-zod'
import { authClient } from '~~/app/utils/auth-client'
import { users } from '~~/server/database/schema'
import { z } from 'zod'
import { fr } from 'zod/locales'
import type { PhoneCategory, ExceptionTypeValue } from '../utils/constants'
import type { ConsultationLocation } from './patient.types'

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
      z.object({
        number: z.string().nonempty('Le numéro est requis'),
        category: z.string().nonempty('La catégorie est requise'),
        id: z.string().nonempty("L'ID est requis")
      })
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
        category: z.enum(['personal', 'cabinet', 'emergency'], 'La catégorie est requise')
      })
    )
    .default([])
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

export type PhoneNumber = {
  id: string
  number: string
  category: PhoneCategory
}

// Availability Management Schemas
export const weeklyAvailabilityTemplateCreateSchema = z
  .object({
    dayOfWeek: z
      .enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
      .refine((val) => val, { message: 'Le jour est requis' }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)"),
    location: z.enum(['clinic', 'home', 'telehealth']).refine((val) => val, { message: 'Le lieu est requis' }),
    maxSessions: z.number().min(1, 'Minimum 1 session').max(10, 'Maximum 10 sessions')
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime']
  })

export const availabilityExceptionCreateSchema = z
  .object({
    date: z.coerce.date(),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)")
      .optional(),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)")
      .optional(),
    isAvailable: z.boolean(),
    reason: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime
      }
      return true
    },
    {
      message: "L'heure de fin doit être après l'heure de début",
      path: ['endTime']
    }
  )

export type WeeklyAvailabilityTemplateCreate = z.infer<typeof weeklyAvailabilityTemplateCreateSchema>
export type AvailabilityExceptionCreate = z.infer<typeof availabilityExceptionCreateSchema>

// Availability Management Types
export interface WeeklyAvailabilityTemplate {
  id: string
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
  startTime: string // '09:00'
  endTime: string // '12:00'
  location: ConsultationLocation
  maxSessions: number
}

// TODO must be derived from DB schema
export interface AvailabilityException {
  id: string
  date: Date // '2024-08-15'
  startTime?: string // optional for full day
  endTime?: string // optional for full day
  isAvailable: boolean
  reason?: ExceptionTypeValue
}
