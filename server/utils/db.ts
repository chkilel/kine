import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export { and, eq, or, sql } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  const db = useDatabase()
  return drizzle(db, {
    schema,
    casing: 'snake_case'
  })
}

export type User = typeof schema.users.$inferSelect