/// <reference types="../../worker-configuration.d.ts" />
import type { H3Event } from 'h3'

// Access Cloudflare bindings via event.context.cloudflare
export function useDB() {
  const db = useDatabase('default')
  if (!db) {
    throw new Error(
      'Cloudflare D1 binding "DB" is not available. Ensure wrangler.jsonc has d1_databases configured and deployment provides the binding.'
    )
  }
  return db
}
