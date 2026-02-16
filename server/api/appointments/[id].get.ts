import { eq, and, getTableColumns } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de consultation requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    const [consultationData] = await db
      .select({
        ...getTableColumns(consultations),
        roomName: rooms.name
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(and(eq(consultations.organizationId, organizationId), eq(consultations.id, id)))
      .limit(1)

    if (!consultationData) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    return consultationData
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération de la consultation')
  }
})
