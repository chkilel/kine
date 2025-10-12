import type { H3Event } from 'h3'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDrizzle } from './database'

/**
 * Create a Better Auth instance bound to the current Cloudflare request context.
 *
 * We must construct the instance per-request because the D1 binding is available
 * on the H3 event context (event.context.cloudflare.env.DB).
 */
export function createAuth(event: H3Event) {
  const db = useDrizzle(event)

  const { betterAuthSecret } = useRuntimeConfig(event)

  if (!betterAuthSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'BETTER_AUTH_SECRET is not set in environment.'
    })
  }

  return betterAuth({
    // Optionally set baseURL if provided via environment
    baseURL: getBaseURL(event),
    // Recommended catch-all path for Better Auth in Nuxt
    basePath: '/api/auth',
    secret: betterAuthSecret,
    // Enable username/password auth; you can add social providers later
    emailAndPassword: { enabled: true },
    // Bind Better Auth to Drizzle (Cloudflare D1 via drizzle-orm/d1)
    database: drizzleAdapter(db, {
      provider: 'sqlite'
      // If you generate a custom Drizzle schema for Better Auth and tables use plural names,
      // consider passing { usePlural: true } or a schema mapping here.
    }),
    // Optional: Add secondary storage for session management
    // secondaryStorage: {
    // TODO: Implement secondary storage for session management using Cloudflare KV
    // },
  })
}

function getBaseURL(event: H3Event) {
  let baseURL = useRuntimeConfig(event).public.betterAuthUrl
  if (!baseURL) {
    try {
      baseURL = getRequestURL(event).origin
    } catch (e) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Could not determine baseURL.'
      })
    }
  }
  return baseURL
}
