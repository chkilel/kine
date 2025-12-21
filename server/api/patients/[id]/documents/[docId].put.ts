import { eq, and, isNull } from 'drizzle-orm'
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
    const body = await readValidatedBody(event, patientDocumentUpdateSchema.parse)

    const [updatedDocument] = await db
      .update(patientDocuments)
      .set(body)
      .where(
        and(
          eq(patientDocuments.organizationId, activeOrganizationId),
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          isNull(patientDocuments.deletedAt)
        )
      )
      .returning()

    if (!updatedDocument) {
      throw createError({
        statusCode: 404,
        message: 'Document not found'
      })
    }

    return updatedDocument
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Invalid document data',
        data: error.errors
      })
    }
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating document:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update document'
    })
  }
})
