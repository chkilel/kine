import type { H3Event } from 'h3'
import { betterAuth, DBFieldAttribute, DBFieldType } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { customSession, organization } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import { useDrizzle } from './database'
import * as schemas from '~~/server/database/schema'

export const additionalFields = {
  firstName: {
    type: 'string',
    required: true,
    input: true,
    returned: true
  },
  lastName: {
    type: 'string',
    required: true,
    input: true,
    returned: true
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
  defaultConsultationDuration: {
    type: 'number',
    required: false,
    input: true
  },
  consultationGapMinutes: {
    type: 'number',
    required: false,
    input: true
  },
  slotIncrementMinutes: {
    type: 'number',
    required: false,
    input: true
  },
  phoneNumbers: {
    type: 'json',
    required: true,
    input: true
  }
} as const satisfies Record<string, DBFieldAttribute<DBFieldType>>

/**
 * Creates Better Auth instance configured for the current Cloudflare request context.
 */
let _auth: ReturnType<typeof createAuthInstance> | undefined

function createAuthInstance(event: H3Event) {
  const db = useDrizzle(event)
  const { betterAuthSecret } = useRuntimeConfig(event)

  if (!betterAuthSecret) {
    throw createError({
      statusCode: 500,
      message: 'BETTER_AUTH_SECRET is not set in environment.'
    })
  }

  const trustedOrigins = [
    'http://localhost:3000',
    'https://*.physio.workers.dev',
    'https://kinedesk.com',
    'https://*.kinedesk.com'
  ]

  return betterAuth({
    baseURL: getBaseURL(event),
    secret: betterAuthSecret,
    trustedOrigins,
    emailAndPassword: { enabled: true },
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      usePlural: true,
      schema: schemas
    }),

    user: {
      additionalFields
    },

    advanced: {
      database: {
        generateId: false // Prevents Better Auth from sending its own ID
      }
    },

    plugins: [
      organization({
        schema: {
          member: {
            additionalFields
          }
        },
        allowUserToCreateOrganization: async () => {
          return true
        },
        organizationLimit: 2
      }),
      customSession(async ({ user, session }, _ctx) => {
        return {
          user,
          session
        }
      })
    ],

    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
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

export function createAuth(event: H3Event) {
  if (!_auth) {
    _auth = createAuthInstance(event)
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
        message: 'Could not determine baseURL.'
      })
    }
  }
  return baseURL
}

export async function requireAuth(event: H3Event) {
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Non autorisé'
    })
  }

  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId

  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Aucune organisation active'
    })
  }

  return {
    userId: session.user.id,
    organizationId: activeOrganizationId
  }
}

// Export the auth type for use in other files
export type Auth = ReturnType<typeof createAuthInstance>
