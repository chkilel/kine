import { createInsertSchema, createUpdateSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'
import { organizations } from '~~/server/database/schema'

// Organization Insert Schema
export const organizationInsertSchema = createInsertSchema(organizations).extend({
  name: z
    .string()
    .min(5, 'Le nom doit avoir au moins 5 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  slug: z
    .string()
    .min(5, 'Le slug doit avoir au moins 5 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (seulement lettres minuscules, chiffres et tirets)'),
  logoFile: z
    .any()
    .optional()
    .refine((file) => !file || (file instanceof File && file.size <= 1_000_000), 'Logo trop volumineux (1 Mo max)')
    .refine(
      (file) => !file || (file instanceof File && file.type?.startsWith?.('image/')),
      'Le fichier doit être une image'
    ),
  metadataText: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || !val.trim()) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    }, 'Métadonnées JSON invalide')
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
