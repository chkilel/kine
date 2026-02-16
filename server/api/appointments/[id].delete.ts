import { eq, and } from 'drizzle-orm'
import { consultations } from '~~/server/database/schema'

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

    const [existingConsultation] = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.organizationId, organizationId), eq(consultations.id, id)))
      .limit(1)

    if (!existingConsultation) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    await db.delete(consultations).where(eq(consultations.id, id))

    return deletedResponse('Consultation supprimée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression de la consultation')
  }
})
