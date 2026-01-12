import { eq, and } from 'drizzle-orm'
import { availabilityExceptions } from '~~/server/database/schema'

// DELETE /api/availability/exceptions/[id] - Delete availability exception
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate input
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID d'exception requis"
      })
    }

    // 2. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 3. Check if exception exists and belongs to current user
    const [existingException] = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, organizationId),
          eq(availabilityExceptions.userId, userId)
        )
      )

    if (!existingException) {
      throw createError({
        statusCode: 404,
        message: 'Exception de disponibilité introuvable'
      })
    }

    // 4. Delete exception (hard delete since no soft delete)
    await db
      .delete(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.id, id),
          eq(availabilityExceptions.organizationId, organizationId),
          eq(availabilityExceptions.userId, userId)
        )
      )

    return deletedResponse('Exception de disponibilité supprimée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression de l’exception de disponibilité.')
  }
})
