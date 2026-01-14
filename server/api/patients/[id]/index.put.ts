import { eq, and, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'

// PUT /api/patients/[id] - Update patient
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate patient ID and request body
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient requis'
      })
    }
    const body = await readValidatedBody(event, patientUpdateSchema.parse)

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // Update patient
    const [updatedPatient] = await db
      .update(patients)
      .set(body)
      .where(and(eq(patients.id, id), eq(patients.organizationId, organizationId), isNull(patients.deletedAt)))
      .returning()

    if (!updatedPatient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    return successResponse(updatedPatient, 'Patient mis à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour du patient')
  }
})
