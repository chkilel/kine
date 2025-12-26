import { eq, and, sql } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

// GET /api/availability/templates - Get weekly availability templates for current user
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, availabilityTemplateQuerySchema.parse)

    // 2. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 3. Build filters
    const filters = [
      eq(weeklyAvailabilityTemplates.organizationId, organizationId),
      eq(weeklyAvailabilityTemplates.userId, userId)
    ]

    // 4. Add day filter
    if (validatedQuery.dayOfWeek) {
      filters.push(eq(weeklyAvailabilityTemplates.dayOfWeek, validatedQuery.dayOfWeek))
    }

    // 5. Add location filter
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
    handleApiError(error)
  }
})
