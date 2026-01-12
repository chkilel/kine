import { eq, and } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'

// POST /api/availability/exceptions - Create new availability exception
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 2. Validate request body
    const body = await readValidatedBody(event, availabilityExceptionCreateSchema.parse)

    // 3. Check for existing exceptions (always query existing exceptions on the same date)
    const existingExceptions = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.organizationId, organizationId),
          eq(availabilityExceptions.userId, userId),
          eq(availabilityExceptions.date, body.date)
        )
      )

    // 4. Validate time overlaps
    validateTimeOverlaps(existingExceptions, body)

    // 5. Create new exception
    const [newException] = await db
      .insert(availabilityExceptions)
      .values({
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        isAvailable: body.isAvailable,
        reason: body.reason,
        organizationId,
        userId
      })
      .returning()

    return newException
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création de l’exception de disponibilité.')
  }
})

// Helper: Validate time overlaps
function validateTimeOverlaps(
  existingExceptions: any[],
  body: { date: string; startTime?: string | null; endTime?: string | null }
) {
  const isNewFullDay = !body.startTime || !body.endTime

  for (const existing of existingExceptions) {
    const isExistingFullDay = !existing.startTime || !existing.endTime

    // Case 1: Full-day exception conflicts with anything on the same date
    if (isNewFullDay || isExistingFullDay) {
      throw createError({
        statusCode: 409,
        message: "Conflit d'horaire détecté",
        data: {
          message: 'Une exception existe déjà pour cette date.',
          conflict: {
            existing: {
              date: existing.date,
              startTime: existing.startTime || 'journée complète',
              endTime: existing.endTime || 'journée complète'
            },
            requested: {
              date: body.date,
              startTime: body.startTime || 'journée complète',
              endTime: body.endTime || 'journée complète'
            }
          }
        }
      })
    }

    // Case 2: Both have specific times - check for overlap
    // At this point, we know both are NOT full-day, so times must exist
    if (
      body.startTime &&
      body.endTime &&
      existing.startTime &&
      existing.endTime &&
      hasTimeConflict(
        existing.startTime,
        existing.endTime,
        body.startTime,
        body.endTime,
        MINIMUM_CONSULTATION_GAP_MINUTES
      )
    ) {
      throw createError({
        statusCode: 409,
        message: "Conflit d'horaire détecté",
        data: {
          message: `Un écart minimum de ${MINIMUM_CONSULTATION_GAP_MINUTES} minutes est requis entre les plages horaires.`,
          conflict: {
            existing: {
              date: existing.date,
              startTime: existing.startTime,
              endTime: existing.endTime
            },
            requested: {
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
