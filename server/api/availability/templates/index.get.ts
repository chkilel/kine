import { eq, and, sql } from 'drizzle-orm'
import { weeklyAvailabilityTemplates, members } from '~~/server/database/schema'

// GET /api/availability/templates - Get weekly availability templates for a specific therapist
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, availabilityTemplateQuerySchema.parse)

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
      eq(weeklyAvailabilityTemplates.organizationId, organizationId),
      eq(weeklyAvailabilityTemplates.userId, validatedQuery.therapistId)
    ]

    // 5. Add day filter
    if (validatedQuery.dayOfWeek) {
      filters.push(eq(weeklyAvailabilityTemplates.dayOfWeek, validatedQuery.dayOfWeek))
    }

    // 6. Add location filter
    if (validatedQuery.location) {
      filters.push(eq(weeklyAvailabilityTemplates.location, validatedQuery.location))
    }

    // Define day order for proper weekly sorting - use raw SQL with proper syntax
    const dayOrderCase = sql`CASE weekly_availability_templates.dayOfWeek
      WHEN 'mon' THEN 0
      WHEN 'tue' THEN 1
      WHEN 'wed' THEN 2
      WHEN 'thu' THEN 3
      WHEN 'fri' THEN 4
      WHEN 'sat' THEN 5
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
