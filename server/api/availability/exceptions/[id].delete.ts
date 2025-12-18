import { eq, and } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// DELETE /api/availability/exceptions/[id] - Delete availability exception
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID d'exception requis"
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
    // Check if exception exists and belongs to current user
    const [existingException] = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, activeOrganizationId),
          eq(availabilityExceptions.userId, session.user.id)
        )
      )

    if (!existingException) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exception de disponibilité non trouvée'
      })
    }

    // Delete exception (hard delete since no soft delete)
    await db
      .delete(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, activeOrganizationId),
          eq(availabilityExceptions.userId, session.user.id)
        )
      )

    return {
      success: true,
      message: 'Exception de disponibilité supprimée avec succès'
    }
  } catch (error: unknown) {
    console.error('Error deleting availability exception:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw custom errors
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Impossible de supprimer l'exception de disponibilité"
    })
  }
})
