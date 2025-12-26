import { eq, and } from 'drizzle-orm'
import { patientDocuments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const docId = getRouterParam(event, 'docId')

  if (!patientId || !docId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID and Document ID are required'
    })
  }

  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  try {
    const [document] = await db
      .select()
      .from(patientDocuments)
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, activeOrganizationId)
        )
      )
      .limit(1)

    if (!document) {
      throw createError({
        statusCode: 404,
        message: 'Document not found'
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
          eq(patientDocuments.organizationId, activeOrganizationId)
        )
      )
      .returning()

    return { success: true, message: 'Document deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting document:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete document'
    })
  }
})
