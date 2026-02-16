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
    const body = await readValidatedBody(event, consultationUpdateSchema.parse)

    const [existingConsultation] = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.id, id), eq(consultations.organizationId, organizationId)))
      .limit(1)

    if (!existingConsultation) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    const [updatedConsultation] = await db.update(consultations).set(body).where(eq(consultations.id, id)).returning()

    return successResponse(updatedConsultation, 'Consultation mise à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la consultation')
  }
})
