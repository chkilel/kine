import { eq, and, sql } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

// PUT /api/availability/templates/[id] - Update weekly availability template
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate ID param
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de modèle requis'
      })
    }

    // 2. Read and validate request body
    const body = await readValidatedBody(event, weeklyAvailabilityTemplateUpdateSchema.parse)

    // 3. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 4. First, check if template exists and belongs to current user
    const [existingTemplate] = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, organizationId),
          eq(weeklyAvailabilityTemplates.userId, userId)
        )
      )

    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        message: 'Modèle de disponibilité non trouvé'
      })
    }

    // If dayOfWeek is being changed, check for overlaps on the new day
    const newDayOfWeek = body.dayOfWeek || existingTemplate.dayOfWeek
    const newStartTime = body.startTime || existingTemplate.startTime
    const newEndTime = body.endTime || existingTemplate.endTime

    if (body.dayOfWeek || body.startTime || body.endTime) {
      // Check for overlapping templates on the same day (excluding current template)
      const conflictingTemplates = await db
        .select()
        .from(weeklyAvailabilityTemplates)
        .where(
          and(
            eq(weeklyAvailabilityTemplates.organizationId, organizationId),
            eq(weeklyAvailabilityTemplates.userId, userId),
            eq(weeklyAvailabilityTemplates.dayOfWeek, newDayOfWeek),
            // Exclude current template from conflict check
            sql`${weeklyAvailabilityTemplates.id} != ${id}`
          )
        )

      // Validate no overlapping times with minimum gap
      for (const conflictingTemplate of conflictingTemplates) {
        if (
          hasTimeConflict(
            conflictingTemplate.startTime,
            conflictingTemplate.endTime,
            newStartTime,
            newEndTime,
            MINIMUM_CONSULTATION_GAP_MINUTES
          )
        ) {
          throw createError({
            statusCode: 400,
            message: `Conflit d'horaire avec un modèle existant le ${newDayOfWeek}. Veuillez respecter un écart minimum de ${MINIMUM_CONSULTATION_GAP_MINUTES} minutes entre les plages horaires.`,
            data: {
              conflict: {
                existingTemplate: {
                  startTime: conflictingTemplate.startTime,
                  endTime: conflictingTemplate.endTime
                },
                newTemplate: {
                  startTime: newStartTime,
                  endTime: newEndTime
                }
              }
            }
          })
        }
      }
    }

    // Update template
    const [updatedTemplate] = await db
      .update(weeklyAvailabilityTemplates)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, organizationId),
          eq(weeklyAvailabilityTemplates.userId, userId)
        )
      )
      .returning()

    return updatedTemplate
  } catch (error: unknown) {
    handleApiError(error)
  }
})
