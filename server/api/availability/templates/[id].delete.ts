import { eq, and } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// DELETE /api/availability/templates/[id] - Delete weekly availability template
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de modèle requis'
    })
  }

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

  try {
    // Check if template exists and belongs to current user
    const [existingTemplate] = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
          eq(weeklyAvailabilityTemplates.userId, session.user.id)
        )
      )

    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Modèle de disponibilité non trouvé'
      })
    }

    // Delete template (hard delete since no soft delete)
    await db
      .delete(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
          eq(weeklyAvailabilityTemplates.userId, session.user.id)
        )
      )

    return {
      success: true,
      message: 'Modèle de disponibilité supprimé avec succès'
    }
  } catch (error: unknown) {
    console.error('Error deleting availability template:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw custom errors
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de supprimer le modèle de disponibilité'
    })
  }
})
