import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'

import { insuranceCompanies } from '~~/server/database/schema'

export const VALID_CO_PAY_RULES = ['fixed', 'percentage'] as const
export const coPayRuleSchema = z.enum(VALID_CO_PAY_RULES)
export type CoPayRule = z.infer<typeof coPayRuleSchema>

const insuranceCompanySchemaShape = {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable()
}

export const insuranceCompanySchema = createSelectSchema(insuranceCompanies, insuranceCompanySchemaShape)

const insuranceCompanyCreateShape = {
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom ne peut pas dépasser 255 caractères'),
  code: z.string().min(1, 'Le code est requis').max(50, 'Le code ne peut pas dépasser 50 caractères'),
  status: z.enum(['active', 'suspended', 'terminated']).default('active'),
  coveragePercentage: z
    .number()
    .int()
    .min(0, 'Le pourcentage de couverture doit être entre 0 et 100')
    .max(100, 'Le pourcentage de couverture doit être entre 0 et 100'),
  sessionPriceCents: z.number().int().min(100, 'Le prix de séance doit être au moins 100 centimes (1 DH)'),
  coPayRule: coPayRuleSchema,
  coPayAmountCents: z.number().int().min(0, 'Le montant de co-paiement doit être positif').optional(),
  coPayPercentage: z
    .number()
    .int()
    .min(0, 'Le pourcentage de co-paiement doit être entre 0 et 100')
    .max(100, 'Le pourcentage de co-paiement doit être entre 0 et 100')
    .optional(),
  notes: z.string().optional()
}

export const insuranceCompanyCreateSchema = createInsertSchema(insuranceCompanies, insuranceCompanyCreateShape)
  .omit({
    id: true,
    organizationId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
  })
  .refine(
    (data) => {
      if (data.coPayRule === 'fixed' && data.coPayAmountCents === undefined) {
        return false
      }
      if (data.coPayRule === 'percentage' && data.coPayPercentage === undefined) {
        return false
      }
      return true
    },
    {
      message: 'Le montant ou le pourcentage de co-paiement est requis selon la règle choisie',
      path: ['coPayRule']
    }
  )

const insuranceCompanyUpdateShape = {
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom ne peut pas dépasser 255 caractères').optional(),
  code: z.string().min(1, 'Le code est requis').max(50, 'Le code ne peut pas dépasser 50 caractères').optional(),
  status: z.enum(['active', 'suspended', 'terminated']).optional(),
  coveragePercentage: z
    .number()
    .int()
    .min(0, 'Le pourcentage de couverture doit être entre 0 et 100')
    .max(100, 'Le pourcentage de couverture doit être entre 0 et 100')
    .optional(),
  sessionPriceCents: z.number().int().min(100, 'Le prix de séance doit être au moins 100 centimes (1 DH)').optional(),
  coPayRule: coPayRuleSchema.optional(),
  coPayAmountCents: z.number().int().min(0, 'Le montant de co-paiement doit être positif').optional(),
  coPayPercentage: z
    .number()
    .int()
    .min(0, 'Le pourcentage de co-paiement doit être entre 0 et 100')
    .max(100, 'Le pourcentage de co-paiement doit être entre 0 et 100')
    .optional(),
  notes: z.string().optional()
}

export const insuranceCompanyUpdateSchema = z.object(insuranceCompanyUpdateShape).refine(
  (data) => {
    if (!data.coPayRule) return true
    if (data.coPayRule === 'fixed' && data.coPayAmountCents === undefined) {
      return false
    }
    if (data.coPayRule === 'percentage' && data.coPayPercentage === undefined) {
      return false
    }
    return true
  },
  {
    message: 'Le montant ou le pourcentage de co-paiement est requis selon la règle choisie',
    path: ['coPayRule']
  }
)

export const insuranceCompanyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'terminated']).optional()
})

export const insuranceCompanyPaginatedResponseSchema = z.object({
  data: z.array(insuranceCompanySchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
})

export const insurancePaymentInputSchema = z.object({
  coPayPaidCents: z.number().int().min(0, 'Le montant de co-paiement payé ne peut pas être négatif').default(0),
  insurancePaidCents: z.number().int().min(0, "Le montant payé par l'assurance ne peut pas être négatif").default(0)
})

export type InsurancePaymentInput = z.infer<typeof insurancePaymentInputSchema>
export type InsuranceCompany = z.infer<typeof insuranceCompanySchema>
export type InsuranceCompanyCreate = z.infer<typeof insuranceCompanyCreateSchema>
export type InsuranceCompanyUpdate = z.infer<typeof insuranceCompanyUpdateSchema>
export type InsuranceCompanyQuery = z.infer<typeof insuranceCompanyQuerySchema>
export type InsuranceCompanyPaginatedResponse = z.infer<typeof insuranceCompanyPaginatedResponseSchema>
