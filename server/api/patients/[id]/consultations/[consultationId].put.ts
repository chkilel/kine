import { eq, and } from 'drizzle-orm'
import { consultations } from '~~/server/database/schema'

// PUT /api/patients/[id]/consultations/[id] - Update consultation
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
    const body = await readValidatedBody(event, consultationUpdateSchema.parse)

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

    // Update consultation
    const [updatedConsultation] = await db
      .update(consultations)
      .set(body)
      .where(eq(consultations.id, consultationId))
      .returning()

    return successResponse(updatedConsultation, 'Consultation mise à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour de la consultation')
  }
})
