import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import { weeklyAvailabilityTemplates, availabilityExceptions } from '~~/server/database/schema/availability'
import { fr } from 'zod/locales'

z.config(fr())

// Business validation constants
export const MINIMUM_SESSION_GAP_MINUTES = 15
export const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

// Helper functions for time comparison
export const timeToMinutes = (time: string): number => {
  const parts = time.split(':').map(Number)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  return hours * 60 + minutes
}

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Helper function to check time overlap with minimum gap
export const checkTimeOverlap = (
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string,
  minGap: number = MINIMUM_SESSION_GAP_MINUTES
): boolean => {
  const existingStartMin = timeToMinutes(existingStart)
  const existingEndMin = timeToMinutes(existingEnd)
  const newStartMin = timeToMinutes(newStart)
  const newEndMin = timeToMinutes(newEnd)

  // Check overlap with minimum gap
  return !(newEndMin + minGap <= existingStartMin || newStartMin >= existingEndMin + minGap)
}

// Helper function to convert date to timestamp for database
export const dateToTimestamp = (date: Date): number => {
  return date.setHours(0, 0, 0, 0)
}

// Auto-derived schemas from database (base schemas)
export const weeklyAvailabilityTemplateInsertSchema = createInsertSchema(weeklyAvailabilityTemplates)
export const weeklyAvailabilityTemplateSelectSchema = createSelectSchema(weeklyAvailabilityTemplates)
export const weeklyAvailabilityTemplateUpdateSchema = createUpdateSchema(weeklyAvailabilityTemplates)

export const availabilityExceptionInsertSchema = createInsertSchema(availabilityExceptions)
export const availabilityExceptionSelectSchema = createSelectSchema(availabilityExceptions)
export const availabilityExceptionUpdateSchema = createUpdateSchema(availabilityExceptions)

// Enhanced schemas with custom validations for UI forms
export const weeklyAvailabilityTemplateCreateSchema = weeklyAvailabilityTemplateInsertSchema
  .omit({
    id: true,
    organizationId: true,
    userId: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
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

export const availabilityExceptionCreateSchema = availabilityExceptionInsertSchema
  .omit({
    id: true,
    organizationId: true,
    userId: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
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

// Query schemas for API endpoints
export const availabilityTemplateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  dayOfWeek: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).optional(),
  location: z.enum(['clinic', 'home', 'telehealth']).optional()
})

export const availabilityExceptionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  isAvailable: z.coerce.boolean().optional(),
  reason: z
    .enum(['vacation', 'holiday', 'sick', 'training', 'meeting', 'personal', 'reduced_hours', 'other'])
    .optional()
})

// Type exports derived from schemas
export type WeeklyAvailabilityTemplate = z.infer<typeof weeklyAvailabilityTemplateSelectSchema>
export type WeeklyAvailabilityTemplateCreate = z.infer<typeof weeklyAvailabilityTemplateCreateSchema>
export type WeeklyAvailabilityTemplateUpdate = z.infer<typeof weeklyAvailabilityTemplateUpdateSchema>

export type AvailabilityException = z.infer<typeof availabilityExceptionSelectSchema>
export type AvailabilityExceptionCreate = z.infer<typeof availabilityExceptionCreateSchema>
export type AvailabilityExceptionUpdate = z.infer<typeof availabilityExceptionUpdateSchema>

// Query types
export type AvailabilityTemplateQuery = z.infer<typeof availabilityTemplateQuerySchema>
export type AvailabilityExceptionQuery = z.infer<typeof availabilityExceptionQuerySchema>
