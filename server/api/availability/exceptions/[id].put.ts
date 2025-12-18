import { eq, and, sql } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'
import {
  availabilityExceptionUpdateSchema,
  checkTimeOverlap,
  MINIMUM_SESSION_GAP_MINUTES
} from '~~/shared/types/availability.types'
import type { Session } from '~~/shared/types/auth.types'

// PUT /api/availability/exceptions/[id] - Update availability exception
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID d'exception requis"
    })
  }

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
    const body = await readValidatedBody(event, availabilityExceptionUpdateSchema.parse)

    // First, check if exception exists and belongs to current user
    const [existingException] = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, activeOrganizationId),
          eq(availabilityExceptions.userId, session.user.id)
        )
      )

    if (!existingException) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exception de disponibilité non trouvée'
      })
    }

    // If time fields are being changed, check for conflicts
    const newDate = body.date || existingException.date
    const newStartTime = body.startTime || existingException.startTime
    const newEndTime = body.endTime || existingException.endTime

    if (body.date || body.startTime || body.endTime) {
      // Check for overlapping exceptions (excluding current exception)
      const conflictingExceptions = await db
        .select()
        .from(availabilityExceptions)
        .where(
          and(
            eq(availabilityExceptions.organizationId, activeOrganizationId),
            eq(availabilityExceptions.userId, session.user.id),
            eq(availabilityExceptions.date, newDate),
            // Exclude current exception from conflict check
            sql`${availabilityExceptions.id} != ${id}`
          )
        )

      // Validate no overlapping times with minimum gap
      if (newStartTime && newEndTime) {
        for (const conflictingException of conflictingExceptions) {
          if (conflictingException.startTime && conflictingException.endTime) {
            if (
              checkTimeOverlap(
                conflictingException.startTime,
                conflictingException.endTime,
                newStartTime,
                newEndTime,
                MINIMUM_SESSION_GAP_MINUTES
              )
            ) {
              throw createError({
                statusCode: 400,
                statusMessage: `Conflit d'horaire avec une exception existante. Veuillez respecter un écart minimum de ${MINIMUM_SESSION_GAP_MINUTES} minutes entre les plages horaires.`,
                data: {
                  conflict: {
                    existingException: {
                      date: conflictingException.date,
                      startTime: conflictingException.startTime,
                      endTime: conflictingException.endTime
                    },
                    newException: {
                      date: newDate,
                      startTime: newStartTime,
                      endTime: newEndTime
                    }
                  }
                }
              })
            }
          }
        }
      }
    }

    // Update exception
    const [updatedException] = await db
      .update(availabilityExceptions)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, activeOrganizationId),
          eq(availabilityExceptions.userId, session.user.id)
        )
      )
      .returning()

    return updatedException
  } catch (error: unknown) {
    console.error('Error updating availability exception:', error)

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
      statusMessage: "Impossible de mettre à jour l'exception de disponibilité"
    })
  }
})
