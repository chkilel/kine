import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { weeklyAvailabilityTemplates, availabilityExceptions } from '~~/server/database/schema/availability'
import { calendarDateSchema, dayOfWeekSchema, locationSchema, reasonSchema, timeFormatSchema } from './base.types'

z.config(fr())

// =============================================================================
// Weekly Availability Template Schemas and Types
// =============================================================================
export const weeklyAvailabilityTemplateCreateSchema = createInsertSchema(weeklyAvailabilityTemplates, {
  dayOfWeek: dayOfWeekSchema.refine((val) => val, { message: 'Le jour est requis' }),
  startTime: timeFormatSchema,
  endTime: timeFormatSchema,
  location: locationSchema.refine((val) => val, { message: 'Le lieu est requis' }),
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

// Query schemas for API endpoints
export const availabilityTemplateQuerySchema = z.object({
  therapistId: z.string().min(1, 'Therapist ID is required'),
  dayOfWeek: dayOfWeekSchema.optional(),
  location: locationSchema.optional()
})

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
  startTime: timeFormatSchema.optional(),
  endTime: timeFormatSchema.optional(),
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

export const availabilityExceptionQuerySchema = z.object({
  therapistId: z.string().min(1, 'Therapist ID is required'),
  dateFrom: calendarDateSchema.optional(),
  dateTo: calendarDateSchema.optional(),
  isAvailable: z.coerce.boolean().optional(),
  reason: reasonSchema.optional()
})

// Type exports derived from schemas
export type AvailabilityException = z.infer<typeof availabilityExceptionSelectSchema>
export type AvailabilityExceptionCreate = z.infer<typeof availabilityExceptionCreateSchema>
export type AvailabilityExceptionUpdate = z.infer<typeof availabilityExceptionUpdateSchema>
export type AvailabilityExceptionQuery = z.infer<typeof availabilityExceptionQuerySchema>

// =============================================================================
// Slots Request Schema and Type
// =============================================================================

export const slotsRequestSchema = z.object({
  dates: z.array(calendarDateSchema).min(1, 'Au moins une date est requise'),
  duration: z.number().min(15, 'La durée minimale est de 15 minutes').max(180, 'La durée maximale est de 3 heures'),
  location: locationSchema
})

export type SlotsRequest = z.infer<typeof slotsRequestSchema>

// =============================================================================
// Room Slots Request Schema and Type (Room-Centric Booking)
// =============================================================================

export const roomSlotsRequestSchema = z.object({
  dates: z.array(calendarDateSchema).min(1, 'Au moins une date est requise'),
  duration: z.number().min(15, 'La durée minimale est de 15 minutes').max(180, 'La durée maximale est de 3 heures'),
  therapistId: z.uuidv7().optional()
})

export type RoomSlotsRequest = z.infer<typeof roomSlotsRequestSchema>

export const roomSlotsResponseSchema = z.record(
  z.string(),
  z.object({
    availableSlots: z.array(timeFormatSchema),
    unavailable: z.boolean().default(false)
  })
)

export type RoomSlotsResponse = z.infer<typeof roomSlotsResponseSchema>
