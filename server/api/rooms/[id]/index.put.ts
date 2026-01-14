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

    const body = await readValidatedBody(event, roomUpdateSchema.parse)

    const { organizationId } = await requireAuth(event)

    const updateData: any = { ...body }

    if (body.prm !== undefined) {
      updateData.prm = body.prm ? 1 : 0
    }

    const [updatedRoom] = await db
      .update(rooms)
      .set(updateData)
      .where(and(eq(rooms.id, id), eq(rooms.organizationId, organizationId), isNull(rooms.deletedAt)))
      .returning()

    if (!updatedRoom) {
      throw createError({
        statusCode: 404,
        message: 'Salle introuvable'
      })
    }

    return successResponse(updatedRoom, 'Salle mise à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la salle')
  }
})
