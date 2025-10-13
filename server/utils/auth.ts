import type { H3Event } from 'h3'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { useDrizzle } from './database'
import { users, accounts, verifications, sessions } from '~~/server/database/schema'

/**
 * Creates (or reuses) a singleton Better Auth instance configured for the
 * current Cloudflare request context.
 */

let _auth: ReturnType<typeof betterAuth>
export function createAuth(event: H3Event) {
  const db = useDrizzle(event)

  const { betterAuthSecret } = useRuntimeConfig(event)
  if (!betterAuthSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'BETTER_AUTH_SECRET is not set in environment.'
    })
  }
  if (!_auth) {
    _auth = betterAuth({
      // Optionally set baseURL if provided via environment
      baseURL: getBaseURL(event),
      secret: betterAuthSecret,
      // Enable username/password auth; you can add social providers later
      emailAndPassword: { enabled: true },
      // Bind Better Auth to Drizzle (Cloudflare D1 via drizzle-orm/d1)
      database: drizzleAdapter(db, {
        provider: 'sqlite',
        usePlural: true,
        schema: { users, accounts, verifications, sessions }
      }),
      // Optional: Add secondary storage for session management
      // secondaryStorage: {
      // TODO: Implement secondary storage for session management using Cloudflare KV
      // },

      // Extending Core Schema
      user: {
        additionalFields: {
          firstName: {
            type: 'string',
            required: false,
            input: true
          },
          lastName: {
            type: 'string',
            input: true
          }
        }
      }
    })
  }

  return _auth
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
