/// <reference types="../../env.d.ts" />
import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import { createError } from 'h3'

// Database access composables for Cloudflare D1 in Nuxt Nitro.
// Three ways to use the database:
// 1) useNitroDatabase(): via Nitro's experimental `useDatabase('default')` for direct binding access without H3 event.
// 2) useDB(event): raw Cloudflare binding from `event.context.cloudflare.env.DB` for low-level D1 API usage.
// 3) useDrizzle(event): Drizzle ORM instance via `drizzle(cloudflare.env.DB)` for typed queries and schema integration.
//
// All helpers throw a 500 error if the Cloudflare D1 binding is unavailable.
/**
 * Returns the Cloudflare D1 database binding using Nitro's experimental database layer.
 * Use when you have configured `nitro.database = 'default'` and want direct access to the binding.
 * Throws an H3 error if the binding is missing.
 */
export function useNitroDatabase() {
  // `default` is a db name defined in nuxt.config.ts - nitro.database = default
  const db = useDatabase('default')
  if (!db) {
    throw createError({
      statusCode: 500,
      message: 'Cloudflare D1 binding "DB" is not available.'
    })
  }
  return db
}

/**
 * Access the raw Cloudflare D1 binding from the current request's Cloudflare context.
 *
 * Use this for low-level SQL with the D1 API (prepare, bind, run, batch) when you
 * don't need an ORM abstraction.
 *
 * Guarantees the correct binding for the current environment (dev, preview, or production),
 * because it reads from `event.context.cloudflare.env.DB`.
 *
 * @param event H3Event - the current server request/event
 * @returns The Cloudflare D1 database binding
 *
 * Example:
 * const db = useDB(event)
 * const res = await db.prepare('SELECT COUNT(*) as cnt FROM users').first()
 */
export function useDB(event: H3Event) {
  const { cloudflare } = event.context
  const db = cloudflare.env.DB
  if (!db) {
    throw createError({
      statusCode: 500,
      message: 'Cloudflare D1 binding "DB" is not available.'
    })
  }
  return db
}

/**
 * Create a Drizzle ORM instance configured for Cloudflare D1 for the current request.
 *
 * Use this for typed SQL and schema-driven queries using `drizzle-orm/d1`. Integrates
 * with your server/database/schema definitions and enables ergonomic query building.
 *
 * Internally, uses `drizzle(cloudflare.env.DB)` to attach the adapter to the binding.
 *
 * @param event H3Event - the current server request/event
 * @returns Drizzle ORM instance bound to Cloudflare D1
 *
 * Example:
 * const db = useDrizzle(event)
 * const rows = await db.select().from(users).where(eq(users.id, id))
 *
 * Note: Ensure your Drizzle schema is defined and `drizzle.config.ts` is set up
 * to generate types for D1.
 */
export function useDrizzle(event: H3Event) {
  const { cloudflare } = event.context
  const db = drizzle(cloudflare.env.DB)
  if (!db) {
    throw createError({
      statusCode: 500,
      message: 'Cloudflare D1 binding "DB" is not available.'
    })
  }
  return db
}
