import { createInsertSchema, createUpdateSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'
import { organizations } from '~~/server/database/schema'

// Organization Insert Schema
export const organizationInsertSchema = createInsertSchema(organizations).extend({
  name: z.string().min(1, "Le nom de l'organisation est requis").max(50),
  slug: z.string().min(1, "Le slug de l'organisation est requis").max(50)
})
export type OrganizationInsertSchema = z.output<typeof organizationInsertSchema>

// Update Organization Schema
export const updateOrganizationSchema = createUpdateSchema(organizations).extend({
  name: z.string().min(1, "Le nom de l'organisation est requis").max(50),
  slug: z.string().min(1, "Le slug de l'organisation est requis").max(50)
})
export type UpdateOrganizationSchema = z.output<typeof updateOrganizationSchema>

// OrganizationSelectSchema
export const organizationSelectSchema = createSelectSchema(organizations)
export type OrganizationSelectSchema = z.output<typeof organizationSelectSchema>
