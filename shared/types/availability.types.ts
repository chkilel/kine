import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import { weeklyAvailabilityTemplates, availabilityExceptions } from '~~/server/database/schema/availability'
import { fr } from 'zod/locales'
import { calendarDateSchema } from '.'

z.config(fr())

// Business validation constants
export const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

// =============================================================================
// Weekly Availability Template Schemas and Types
// =============================================================================
export const weeklyAvailabilityTemplateCreateSchema = createInsertSchema(weeklyAvailabilityTemplates, {
  dayOfWeek: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).refine((val) => val, { message: 'Le jour est requis' }),
  startTime: z.string().regex(TIME_FORMAT_REGEX, "Format d'heure invalide (HH:MM)"),
  endTime: z.string().regex(TIME_FORMAT_REGEX, "Format d'heure invalide (HH:MM)"),
  location: z.enum(['clinic', 'home', 'telehealth']).refine((val) => val, { message: 'Le lieu est requis' }),
  maxSessions: z.number().min(1, 'Minimum 1 session').max(10, 'Maximum 10 sessions')
})
  .omit({
    id: true,
    organizationId: true,
    userId: true,
    createdAt: true,
    updatedAt: true
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime']
  })
export const weeklyAvailabilityTemplateUpdateSchema = weeklyAvailabilityTemplateCreateSchema.partial()
export const weeklyAvailabilityTemplateSelectSchema = createSelectSchema(weeklyAvailabilityTemplates)

// Type exports derived from schemas
export type WeeklyAvailabilityTemplate = z.infer<typeof weeklyAvailabilityTemplateSelectSchema>
export type WeeklyAvailabilityTemplateCreate = z.infer<typeof weeklyAvailabilityTemplateCreateSchema>
export type WeeklyAvailabilityTemplateUpdate = z.infer<typeof weeklyAvailabilityTemplateUpdateSchema>
export type AvailabilityTemplateQuery = z.infer<typeof availabilityTemplateQuerySchema>

// =============================================================================
// Availability Exception Schemas and Types
// =============================================================================

export const availabilityExceptionCreateSchema = createInsertSchema(availabilityExceptions, {
  date: calendarDateSchema,
  startTime: z.string().regex(TIME_FORMAT_REGEX, "Format d'heure invalide (HH:MM)").optional(),
  endTime: z.string().regex(TIME_FORMAT_REGEX, "Format d'heure invalide (HH:MM)").optional(),
  isAvailable: z.boolean()
})
  .omit({
    id: true,
    organizationId: true,
    userId: true,
    createdAt: true,
    updatedAt: true
  })
  .refine((data) => (data.startTime && data.endTime ? data.endTime > data.startTime : true), {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime']
  })

export const availabilityExceptionSelectSchema = createSelectSchema(availabilityExceptions)
export const availabilityExceptionUpdateSchema = availabilityExceptionCreateSchema.partial()

// Query schemas for API endpoints
export const availabilityTemplateQuerySchema = z.object({
  dayOfWeek: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).optional(),
  location: z.enum(['clinic', 'home', 'telehealth']).optional()
})

export const availabilityExceptionQuerySchema = z.object({
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  isAvailable: z.coerce.boolean().optional(),
  reason: z
    .enum(['vacation', 'holiday', 'sick', 'training', 'meeting', 'personal', 'reduced_hours', 'other'])
    .optional()
})

// Type exports derived from schemas
export type AvailabilityException = z.infer<typeof availabilityExceptionSelectSchema>
export type AvailabilityExceptionCreate = z.infer<typeof availabilityExceptionCreateSchema>
export type AvailabilityExceptionUpdate = z.infer<typeof availabilityExceptionUpdateSchema>
export type AvailabilityExceptionReason = AvailabilityException['reason']
export type AvailabilityExceptionQuery = z.infer<typeof availabilityExceptionQuerySchema>
