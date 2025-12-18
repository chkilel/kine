import { eq, and, count, asc } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'
import { availabilityExceptionQuerySchema } from '~~/shared/types/availability.types'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/availability/exceptions - Get availability exceptions for current user
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

  const query = getQuery(event)
  const validatedQuery = availabilityExceptionQuerySchema.parse(query)

  try {
    // Build filters
    const filters = [
      eq(availabilityExceptions.organizationId, activeOrganizationId),
      eq(availabilityExceptions.userId, session.user.id)
    ]

    // Add availability status filter
    if (validatedQuery.isAvailable !== undefined) {
      filters.push(eq(availabilityExceptions.isAvailable, validatedQuery.isAvailable))
    }

    // Add reason filter
    if (validatedQuery.reason) {
      filters.push(eq(availabilityExceptions.reason, validatedQuery.reason))
    }

    // Calculate pagination
    const limit = validatedQuery.limit
    const offset = (validatedQuery.page - 1) * limit

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: count() })
      .from(availabilityExceptions)
      .where(and(...filters))

    const total = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Execute paginated query - order by date first, then start time
    const exceptionsList = await db
      .select()
      .from(availabilityExceptions)
      .where(and(...filters))
      .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.startTime))
      .limit(limit)
      .offset(offset)

    // Return paginated response
    return {
      data: exceptionsList,
      pagination: {
        total,
        page: validatedQuery.page,
        limit,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1
      }
    }
  } catch (error: unknown) {
    console.error('Error fetching availability exceptions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de charger les exceptions de disponibilité'
    })
  }
})
