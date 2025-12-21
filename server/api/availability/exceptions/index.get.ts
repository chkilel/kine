import { eq, and, asc } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'

// GET /api/availability/exceptions - Get availability exceptions for current user
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, availabilityExceptionQuerySchema.parse)

    // 2. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 3. Build filters
    const filters = [
      eq(availabilityExceptions.organizationId, organizationId),
      eq(availabilityExceptions.userId, userId)
    ]

    // Add availability status filter
    if (validatedQuery.isAvailable) {
      filters.push(eq(availabilityExceptions.isAvailable, validatedQuery.isAvailable))
    }

    // Add reason filter
    if (validatedQuery.reason) {
      filters.push(eq(availabilityExceptions.reason, validatedQuery.reason))
    }

    // 4. Execute paginated query - order by date first, then start time
    const exceptionsList = await db
      .select()
      .from(availabilityExceptions)
      .where(and(...filters))
      .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.startTime))

    return exceptionsList
  } catch (error: unknown) {
    handleApiError
  }
})
