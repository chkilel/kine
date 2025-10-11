import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),

})
