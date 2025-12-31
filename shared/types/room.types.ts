import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { rooms } from '~~/server/database/schema'

z.config(fr())

export const roomNameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')

export const roomDescriptionSchema = z
  .string()
  .max(500, 'La description ne peut pas dépasser 500 caractères')
  .optional()

export const roomCreateSchema = createInsertSchema(rooms, {
  name: roomNameSchema,
  description: roomDescriptionSchema,
  capacity: z.coerce.number().min(1, 'La capacité doit être au moins 1').max(5, 'La capacité ne peut pas dépasser 5'),
  area: z.coerce
    .number()
    .min(1, 'La surface doit être au moins 1')
    .max(1000, 'La surface ne peut pas dépasser 1000 m²')
    .optional(),
  prm: z.coerce.boolean()
}).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
})

export const roomUpdateSchema = roomCreateSchema.partial()
export const roomSchema = createSelectSchema(rooms)

export const roomQuerySchema = z.object({
  search: z.string().optional()
})

export type Room = z.infer<typeof roomSchema>
export type RoomCreate = z.infer<typeof roomCreateSchema>
export type RoomUpdate = z.infer<typeof roomUpdateSchema>
export type RoomQuery = z.infer<typeof roomQuerySchema>
