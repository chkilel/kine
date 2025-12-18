import { eq, and } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'
import {
  availabilityExceptionCreateSchema,
  checkTimeOverlap,
  MINIMUM_SESSION_GAP_MINUTES
} from '~~/shared/types/availability.types'
import type { Session } from '~~/shared/types/auth.types'

// POST /api/availability/exceptions - Create new availability exception
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  // Get current user and organization from session
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

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId

  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès interdit'
    })
  }

  try {
    const body = await readValidatedBody(event, availabilityExceptionCreateSchema.parse)

    // Check for overlapping exceptions on the same date (simplified logic for now)
    // In a more complete implementation, we'd filter by the exact date
    const existingExceptions = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.organizationId, activeOrganizationId),
          eq(availabilityExceptions.userId, session.user.id)
          // Date filtering would require more complex timestamp comparison
        )
      )

    // Validate no overlapping times with minimum gap (if time is specified)
    if (body.startTime && body.endTime) {
      for (const existingException of existingExceptions) {
        // Only check overlap if existing exception has time specified
        if (existingException.startTime && existingException.endTime) {
          if (
            checkTimeOverlap(
              existingException.startTime,
              existingException.endTime,
              body.startTime,
              body.endTime,
              MINIMUM_SESSION_GAP_MINUTES
            )
          ) {
            throw createError({
              statusCode: 400,
              statusMessage: `Conflit d'horaire avec une exception existante. Veuillez respecter un écart minimum de ${MINIMUM_SESSION_GAP_MINUTES} minutes entre les plages horaires.`,
              data: {
                conflict: {
                  existingException: {
                    date: existingException.date,
                    startTime: existingException.startTime,
                    endTime: existingException.endTime
                  },
                  newException: {
                    date: body.date,
                    startTime: body.startTime,
                    endTime: body.endTime
                  }
                }
              }
            })
          }
        }
      }
    }

    // Create new exception with organization and user context
    const [newException] = await db
      .insert(availabilityExceptions)
      .values({
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        isAvailable: body.isAvailable,
        reason: body.reason as any, // Type assertion for enum compatibility
        organizationId: activeOrganizationId,
        userId: session.user.id
      })
      .returning()

    return newException
  } catch (error: unknown) {
    console.error('Error creating availability exception:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw custom errors
      throw error
    }

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: "Données d'exception invalides",
        data: (error as unknown as { errors: unknown }).errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Impossible de créer l'exception de disponibilité"
    })
  }
})
