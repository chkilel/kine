import type { H3Event } from 'h3'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { useDrizzle } from './database'
import {
  users,
  accounts,
  verifications,
  sessions,
  organizations,
  members,
  invitations
} from '~~/server/database/schema'

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
      // databaseHooks: {
      //   session: {
      //     create: {
      //       before: async (session) => {
      //         const organization = await getActiveOrganization(session.userId)
      //         return {
      //           data: {
      //             ...session,
      //             activeOrganizationId: organization.id
      //           }
      //         }
      //       }
      //     }
      //   }
      // },
      // Optionally set baseURL if provided via environment
      baseURL: getBaseURL(event),
      secret: betterAuthSecret,
      trustedOrigins: [
        'http://localhost:3000',
        'https://*.physio.workers.dev',
        'https://kinedesk.com',
        'https://*.kinedesk.com'
      ],
      // Enable username/password auth; you can add social providers later
      emailAndPassword: { enabled: true },
      // Bind Better Auth to Drizzle (Cloudflare D1 via drizzle-orm/d1)
      database: drizzleAdapter(db, {
        provider: 'sqlite',
        usePlural: true,
        schema: {
          users,
          accounts,
          verifications,
          sessions,
          organizations,
          members,
          invitations
        }
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
      },

      // Organization plugin configuration
      plugins: [
        organization({
          // Restrict users to create only one organization as per spec
          allowUserToCreateOrganization: async () => {
            // TODO: Implement proper logic to check if user already has an organization
            // For now, return true to allow creation
            return true
          },
          organizationLimit: 2 // Users can create up to two organizations
        })
      ]
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
