import { createInsertSchema, createUpdateSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fr } from 'zod/locales'

import { organizations } from '~~/server/database/schema'

z.config(fr())

// Organization Select Schema
export const organizationSelectSchema = createSelectSchema(organizations)

// Organization Insert Schema
export const organizationInsertSchema = createInsertSchema(organizations, {
  name: z
    .string()
    .min(5, 'Le nom doit avoir au moins 5 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  slug: z
    .string()
    .min(5, 'Le slug doit avoir au moins 5 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (seulement lettres minuscules, chiffres et tirets)'),
  logo: z.string().nullable()
}).extend({
  logoFile: z
    .any()
    .optional()
    .refine((file) => !file || (file instanceof File && file.size <= 2_000_000), 'Logo trop volumineux (2 Mo max)')
    .refine(
      (file) => !file || (file instanceof File && file.type?.startsWith?.('image/')),
      'Le fichier doit être une image'
    ),
  metadataText: z
    .string()
    .refine((val) => {
      if (!val.trim()) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    }, 'Métadonnées JSON invalide')
    .optional()
})

// Update Organization Schema
export const updateOrganizationSchema = createUpdateSchema(organizations, {
  name: z.string().min(1, "Le nom de l'organisation est requis").max(50),
  slug: z.string().min(1, "Le slug de l'organisation est requis").max(50)
})

// Organization types
export type OrganizationSchema = Omit<z.output<typeof organizationSelectSchema>, 'createdAt' | 'updatedAt'>
export type OrganizationInsertSchema = z.output<typeof organizationInsertSchema>
export type OrganizationSelectSchema = z.output<typeof organizationSelectSchema>
export type UpdateOrganizationSchema = z.output<typeof updateOrganizationSchema>
