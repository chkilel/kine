import { eq, and, isNull } from 'drizzle-orm'
import { patientDocuments } from '../../../../database/schema'
import { useDrizzle } from '../../../../utils/database'
import { requireAuth } from '../../../../utils/auth'
import { handleApiError } from '../../../../utils/error'

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

    const config = useRuntimeConfig(event)
    const accountId = config.r2AccountId
    const downloadUrl = `https://pub-${accountId}.r2.dev/${document.storageKey}`

    return { ...document, downloadUrl }
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération du document')
  }
})
