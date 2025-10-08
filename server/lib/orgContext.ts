/**
 * Set current organization context for Postgres RLS policies.
 * Must be called per-request before org-scoped queries.
 */
import type { DB } from './db'
import { sql } from 'drizzle-orm'

export async function setOrganizationContext(db: DB, orgId: string) {
  // Setting an app-specific parameter consumed in RLS policies
  await db.execute(sql`select set_config('app.current_organization_id', ${orgId}, false)`)
}
