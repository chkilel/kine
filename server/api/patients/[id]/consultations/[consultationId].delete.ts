import { eq, and } from 'drizzle-orm'
import { consultations } from '~~/server/database/schema'

// DELETE /api/patients/[id]/consultations/[consultationId] - Delete consultation
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const consultationId = getRouterParam(event, 'consultationId')

  try {
    if (!patientId || !consultationId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient et ID de consultation requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    // Check if consultation exists and belongs to patient/organization
    const [existingConsultation] = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.patientId, patientId),
          eq(consultations.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!existingConsultation) {
      throw createError({
        statusCode: 404,
        message: 'Consultation introuvable'
      })
    }

    // Delete consultation
    await db.delete(consultations).where(eq(consultations.id, consultationId))

    return deletedResponse('Consultation supprimée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression de la consultation')
  }
})
