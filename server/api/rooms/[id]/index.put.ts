import { eq, and, isNull } from 'drizzle-orm'
import { rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Room ID is required'
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
        message: 'Room not found'
      })
    }

    return updatedRoom
  } catch (error: any) {
    handleApiError(error)
  }
})
