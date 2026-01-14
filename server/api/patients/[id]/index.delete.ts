import { eq, and, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'

// DELETE /api/patients/[id] - Soft delete patient
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate patient ID
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient requis'
      })
    }

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 3. Soft delete patient
    const [deletedPatient] = await db
      .update(patients)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(patients.id, id), eq(patients.organizationId, organizationId), isNull(patients.deletedAt)))
      .returning()

    if (!deletedPatient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    return deletedResponse('Patient supprimé avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression du patient')
  }
})
