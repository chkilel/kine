import { eq, and, sql } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

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
      message: 'Non autorisé'
    })
  }

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId

  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Accès interdit'
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

    return templatesList
  } catch (error: unknown) {
    console.error('Error fetching availability templates:', error)
    throw createError({
      statusCode: 500,
      message: 'Impossible de charger les modèles de disponibilité'
    })
  }
})
