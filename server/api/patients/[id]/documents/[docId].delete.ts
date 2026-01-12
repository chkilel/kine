import { eq, and } from 'drizzle-orm'
import { patientDocuments } from '~~/server/database/schema'
import { requireAuth } from '~~/server/utils/auth'
import { handleApiError } from '~~/server/utils/error'
import { deletedResponse } from '~~/server/utils/response'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const docId = getRouterParam(event, 'docId')

  try {
    if (!patientId || !docId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient et ID de document requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    const [document] = await db
      .select()
      .from(patientDocuments)
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!document) {
      throw createError({
        statusCode: 404,
        message: 'Document introuvable'
      })
    }

    try {
      await deleteR2File(event, document.storageKey)
    } catch (r2Error: any) {
      console.error('Error deleting file from R2:', r2Error)
    }

    await db
      .delete(patientDocuments)
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, organizationId)
        )
      )
      .returning()

    return deletedResponse('Document supprimé avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la suppression du document')
  }
})
