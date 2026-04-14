import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { softDeleteTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { VALID_CONVENTION_STATUSES } from '../../../shared/types/base.types'

export const VALID_CO_PAY_RULES = ['fixed', 'percentage'] as const
export const coPayRuleSchema = VALID_CO_PAY_RULES as unknown as ['fixed', 'percentage']
export type CoPayRule = 'fixed' | 'percentage'

export const insuranceCompanies = sqliteTable(
  'insurance_companies',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    code: text().notNull(),
    status: text({ enum: VALID_CONVENTION_STATUSES }).notNull().default('active'),
    coveragePercentage: integer().notNull(),
    sessionPriceCents: integer().notNull(),
    coPayRule: text({ enum: coPayRuleSchema }).notNull(),
    coPayAmountCents: integer(),
    coPayPercentage: integer(),
    notes: text(),
    ...softDeleteTimestamps
  },
  (table) => [
    index('idx_insurance_companies_org').on(table.organizationId),
    index('idx_insurance_companies_org_status').on(table.organizationId, table.status),
    uniqueIndex('idx_insurance_companies_org_code').on(table.organizationId, table.code)
  ]
)
