import { eq, and } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

// DELETE /api/availability/templates/[id] - Delete weekly availability template
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

    // 2. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    //3.  Check if template exists and belongs to current user
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

    // 4. Delete template (hard delete since no soft delete)
    await db
      .delete(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, organizationId),
          eq(weeklyAvailabilityTemplates.userId, userId)
        )
      )

    return {
      success: true,
      message: 'Modèle de disponibilité supprimé avec succès'
    }
  } catch (error: unknown) {
    handleApiError(error)
  }
})
