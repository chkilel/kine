import { eq, and, isNull } from 'drizzle-orm'
import { rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de salle requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    const [deletedRoom] = await db
      .update(rooms)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(rooms.id, id), eq(rooms.organizationId, organizationId), isNull(rooms.deletedAt)))
      .returning()

    if (!deletedRoom) {
      throw createError({
        statusCode: 404,
        message: 'Salle introuvable'
      })
    }

    return deletedResponse('Salle supprimée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression de la salle')
  }
})
