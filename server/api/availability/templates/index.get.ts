import { eq, and, count, sql } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'
import { availabilityTemplateQuerySchema } from '~~/shared/types/availability.types'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/availability/templates - Get weekly availability templates for current user
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

  // Validate query parameters
  const validatedQuery = availabilityTemplateQuerySchema.parse(query)

  try {
    // Build filters
    const filters = [
      eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
      eq(weeklyAvailabilityTemplates.userId, session.user.id)
    ]

    // Add day filter
    if (validatedQuery.dayOfWeek) {
      filters.push(eq(weeklyAvailabilityTemplates.dayOfWeek, validatedQuery.dayOfWeek))
    }

    // Add location filter
    if (validatedQuery.location) {
      filters.push(eq(weeklyAvailabilityTemplates.location, validatedQuery.location))
    }

    // Calculate pagination
    const limit = validatedQuery.limit
    const offset = (validatedQuery.page - 1) * limit

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: count() })
      .from(weeklyAvailabilityTemplates)
      .where(and(...filters))

    const total = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Define day order for proper weekly sorting - use raw SQL with proper syntax
    const dayOrderCase = sql`CASE weekly_availability_templates.dayOfWeek
      WHEN 'Mon' THEN 0
      WHEN 'Tue' THEN 1  
      WHEN 'Wed' THEN 2
      WHEN 'Thu' THEN 3
      WHEN 'Fri' THEN 4
      WHEN 'Sat' THEN 5
      ELSE 6
    END`

    // Execute paginated query
    const templatesList = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(and(...filters))
      .orderBy(dayOrderCase, weeklyAvailabilityTemplates.startTime)
      .limit(limit)
      .offset(offset)

    // Return paginated response
    return {
      data: templatesList,
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
    console.error('Error fetching availability templates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de charger les modèles de disponibilité'
    })
  }
})
