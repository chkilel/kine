import { eq, and, asc } from 'drizzle-orm'
import { availabilityExceptions, members } from '~~/server/database/schema'

// GET /api/availability/exceptions - Get availability exceptions for a specific therapist
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, availabilityExceptionQuerySchema.parse)

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 3. Validate therapist exists and belongs to the same organization
    const [therapistMember] = await db
      .select()
      .from(members)
      .where(and(eq(members.userId, validatedQuery.therapistId), eq(members.organizationId, organizationId)))
      .limit(1)

    if (!therapistMember) {
      throw createError({
        statusCode: 404,
        message: 'Therapist not found or not in your organization'
      })
    }

    // 4. Build filters
    const filters = [
      eq(availabilityExceptions.organizationId, organizationId),
      eq(availabilityExceptions.userId, validatedQuery.therapistId)
    ]

    // Add availability status filter
    if (validatedQuery.isAvailable) {
      filters.push(eq(availabilityExceptions.isAvailable, validatedQuery.isAvailable))
    }

    // Add reason filter
    if (validatedQuery.reason) {
      filters.push(eq(availabilityExceptions.reason, validatedQuery.reason))
    }

    // 5. Execute paginated query - order by date first, then start time
    const exceptionsList = await db
      .select()
      .from(availabilityExceptions)
      .where(and(...filters))
      .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.startTime))

    return exceptionsList
  } catch (error: unknown) {
    handleApiError(error)
  }
})
