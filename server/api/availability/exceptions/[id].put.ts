import { eq, and, not } from 'drizzle-orm'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { availabilityExceptions } from '~~/server/database/schema'

// PUT /api/availability/exceptions/[id] - Update availability exception
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate ID parameter
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID d'exception requis"
      })
    }

    // 2. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 3. Validate request body
    const body = await readValidatedBody(event, availabilityExceptionUpdateSchema.parse)

    // 4. Get existing exception with single query
    const existingException = await getExistingException(db, id, userId, organizationId)

    // 5. Check for conflicts only if date or time fields have actually changed
    const dateChanged = body.date !== undefined && body.date !== existingException.date
    const startTimeChanged = body.startTime !== undefined && body.startTime !== existingException.startTime
    const endTimeChanged = body.endTime !== undefined && body.endTime !== existingException.endTime

    const hasTimeChanges = dateChanged || startTimeChanged || endTimeChanged

    if (hasTimeChanges) {
      await validateNoConflicts(db, {
        exceptionId: id,
        userId,
        organizationId,
        existingException,
        updates: body
      })
    }

    // 6. Update exception
    const [updatedException] = await db
      .update(availabilityExceptions)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, organizationId),
          eq(availabilityExceptions.userId, userId)
        )
      )
      .returning()

    if (!updatedException) {
      throw createError({
        statusCode: 500,
        message: "Échec de la mise à jour de l'exception"
      })
    }

    return successResponse(updatedException, 'Exception de disponibilité mise à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de l’exception de disponibilité.')
  }
})

// Helper: Get existing exception
async function getExistingException(
  db: DrizzleD1Database,
  id: string,
  userId: string,
  organizationId: string
): Promise<AvailabilityException> {
  const [existingException] = await db
    .select()
    .from(availabilityExceptions)
    .where(
      and(
        eq(availabilityExceptions.id, id),
        eq(availabilityExceptions.organizationId, organizationId),
        eq(availabilityExceptions.userId, userId)
      )
    )
    .limit(1)

  if (!existingException) {
    throw createError({
      statusCode: 404,
      message: 'Exception de disponibilité non trouvée'
    })
  }

  return existingException
}

// Helper: Validate no conflicts with other exceptions
async function validateNoConflicts(
  db: DrizzleD1Database,
  params: {
    exceptionId: string
    userId: string
    organizationId: string
    existingException: AvailabilityException
    updates: { date?: string; startTime?: string | null; endTime?: string | null }
  }
) {
  const { exceptionId, userId, organizationId, existingException, updates } = params

  const targetDate = updates.date || existingException.date

  // Get other exceptions for the same date (excluding current one)
  const conflictingExceptions = await db
    .select()
    .from(availabilityExceptions)
    .where(
      and(
        eq(availabilityExceptions.organizationId, organizationId),
        eq(availabilityExceptions.userId, userId),
        eq(availabilityExceptions.date, targetDate),
        not(eq(availabilityExceptions.id, exceptionId))
      )
    )

  if (conflictingExceptions.length === 0) {
    return // No conflicts possible
  }

  // Merge updates with existing values
  // Important: If either startTime or endTime is explicitly set to null,
  // both should be treated as null (full day exception)
  const hasStartTimeUpdate = updates.startTime !== undefined
  const hasEndTimeUpdate = updates.endTime !== undefined

  let finalStartTime: string | null
  let finalEndTime: string | null

  if (hasStartTimeUpdate || hasEndTimeUpdate) {
    // If any time field is updated to null, treat as full day
    const newStartTime = hasStartTimeUpdate ? updates.startTime! : existingException.startTime
    const newEndTime = hasEndTimeUpdate ? updates.endTime! : existingException.endTime

    if (newStartTime === null || newEndTime === null) {
      finalStartTime = null
      finalEndTime = null
    } else {
      finalStartTime = newStartTime
      finalEndTime = newEndTime
    }
  } else {
    // No time updates, use existing values
    finalStartTime = existingException.startTime
    finalEndTime = existingException.endTime
  }

  const mergedException = {
    date: targetDate,
    startTime: finalStartTime,
    endTime: finalEndTime
  }

  validateTimeOverlaps(conflictingExceptions, mergedException)
}

// Helper: Validate time overlaps
function validateTimeOverlaps(
  conflictingExceptions: AvailabilityException[],
  newException: { date: string; startTime: string | null; endTime: string | null }
) {
  const isNewFullDay = !newException.startTime || !newException.endTime

  for (const conflicting of conflictingExceptions) {
    const isConflictingFullDay = !conflicting.startTime || !conflicting.endTime

    // Case 1: Full-day exception conflicts with anything on the same date
    if (isNewFullDay || isConflictingFullDay) {
      throw createError({
        statusCode: 409,
        message: "Conflit d'horaire détecté",
        data: {
          message: 'Une exception existe déjà pour cette date.',
          conflict: {
            existing: {
              date: conflicting.date,
              startTime: conflicting.startTime || 'journée complète',
              endTime: conflicting.endTime || 'journée complète'
            },
            requested: {
              date: newException.date,
              startTime: newException.startTime || 'journée complète',
              endTime: newException.endTime || 'journée complète'
            }
          }
        }
      })
    }

    // Case 2: Both have specific times - check for overlap
    if (newException.startTime && newException.endTime && conflicting.startTime && conflicting.endTime) {
      const hasOverlap = hasTimeConflict(
        conflicting.startTime,
        conflicting.endTime,
        newException.startTime,
        newException.endTime,
        MINIMUM_CONSULTATION_GAP_MINUTES
      )

      if (hasOverlap) {
        throw createError({
          statusCode: 409,
          message: "Conflit d'horaire détecté",
          data: {
            message: `Un écart minimum de ${MINIMUM_CONSULTATION_GAP_MINUTES} minutes est requis entre les plages horaires.`,
            conflict: {
              existing: {
                date: conflicting.date,
                startTime: conflicting.startTime,
                endTime: conflicting.endTime
              },
              requested: {
                date: newException.date,
                startTime: newException.startTime,
                endTime: newException.endTime
              }
            }
          }
        })
      }
    }
  }
}
