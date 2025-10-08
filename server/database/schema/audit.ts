import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { organization, user } from './auth'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .references(() => organization.id)
    .notNull(),
  tableName: text('table_name').notNull(),
  action: text('action').notNull(), // 'insert' | 'update' | 'delete'
  actorId: text('actor_id').references(() => user.id),
  entityId: text('entity_id'),
  changes: text('changes'), // JSON string of diff or new values
  createdAt: timestamp('created_at').notNull().defaultNow()
})
