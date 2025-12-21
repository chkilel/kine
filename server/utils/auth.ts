import type { H3Event } from 'h3'
import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { customSession, organization } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { useDrizzle } from './database'
import * as schemas from '~~/server/database/schema'

/**
 * Creates Better Auth instance configured for the current Cloudflare request context.
 */
let _auth: ReturnType<typeof betterAuth>
//ReturnType<typeof betterAuth>
// as ReturnType<typeof betterAuth<typeof authOptions>>
export function createAuth(event: H3Event) {
  const db = useDrizzle(event)

  const { betterAuthSecret } = useRuntimeConfig(event)
  if (!betterAuthSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'BETTER_AUTH_SECRET is not set in environment.'
    })
  }

  const trustedOrigins = [
    'http://localhost:3000',
    'https://*.physio.workers.dev',
    'https://kinedesk.com',
    'https://*.kinedesk.com'
  ]

  const authOptions = {
    baseURL: getBaseURL(event),
    secret: betterAuthSecret,
    trustedOrigins,
    // Enable username/password auth; you can add social providers later
    emailAndPassword: { enabled: true },
    // Bind Better Auth to Drizzle (Cloudflare D1 via drizzle-orm/d1)
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      usePlural: true,
      schema: schemas
    }),

    // TODO: Implement secondary storage for session management using Cloudflare KV

    // Extending Core Schema
    user: {
      additionalFields: {
        firstName: {
          type: 'string',
          input: true
        },
        lastName: {
          type: 'string',
          input: true
        },
        specialization: {
          type: 'string[]',
          required: true,
          input: true
        },
        licenseNumber: {
          type: 'string',
          required: true,
          input: true
        },
        defaultSessionDuration: {
          type: 'number',
          required: false,
          input: true
        },
        phoneNumbers: {
          type: 'json',
          required: true,
          input: true
        }
      }
    },

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
  } satisfies BetterAuthOptions

  // export const auth = betterAuth(authOptions) as ReturnType<
  // typeof betterAuth<typeof authOptions>
  // >;
  if (!_auth) {
    _auth = betterAuth({
      ...authOptions,
      plugins: [
        ...(authOptions.plugins ?? []),
        customSession(async ({ user, session }, _ctx) => {
          // Make the session infer the fields added by plugins and custom fields
          return {
            user,
            session
          }
        }, authOptions) // pass options here
      ],
      databaseHooks: {
        session: {
          create: {
            before: async (session) => {
              // Get the first organization where the user is a member and set it as active
              const userOrganizations = await db
                .select({
                  organization: schemas.organizations
                })
                .from(schemas.members)
                .innerJoin(schemas.organizations, eq(schemas.members.organizationId, schemas.organizations.id))
                .where(eq(schemas.members.userId, session.userId))
                .limit(1)

              if (userOrganizations.length > 0) {
                return {
                  data: {
                    ...session,
                    activeOrganizationId: userOrganizations[0]?.organization.id
                  }
                }
              }

              return { data: session }
            }
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

// Helper: Authentication and authorization
export async function requireAuth(event: H3Event) {
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId

  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Aucune organisation active'
    })
  }

  return {
    userId: session.user.id,
    organizationId: activeOrganizationId
  }
}
