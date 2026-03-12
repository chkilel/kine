import { eq, and } from 'drizzle-orm'
import { patientDocuments } from '~~/server/database/schema'

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

    const { organizationId } = await requireAuthWithOrg(event)
    const body = await readValidatedBody(event, patientDocumentUpdateSchema.parse)

    const [updatedDocument] = await db
      .update(patientDocuments)
      .set(body)
      .where(
        and(
          eq(patientDocuments.organizationId, organizationId),
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId)
        )
      )
      .returning()

    if (!updatedDocument) {
      throw createError({
        statusCode: 404,
        message: 'Document introuvable'
      })
    }

    return successResponse(updatedDocument, 'Document mis à jour avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la mise à jour du document')
  }
})
