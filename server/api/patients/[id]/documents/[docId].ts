import { eq, and, isNull } from 'drizzle-orm'
import { patientDocuments } from '../../../../database/schema'
import { useDrizzle } from '../../../../utils/database'
import { createAuth } from '../../../../utils/auth'
import { deleteR2File } from '../../../../utils/r2'

// GET /api/patients/[id]/documents/[docId] - Get document download URL
// DELETE /api/patients/[id]/documents/[docId] - Delete patient document
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const docId = getRouterParam(event, 'docId')

  if (!patientId || !docId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Patient ID and Document ID are required'
    })
  }

  // Get current user and organization from session
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // For now, we'll use a mock organization ID since organization plugin isn't fully set up
  const activeOrganizationId = 'org-1' // TODO: Get from session when organization plugin is ready

  switch (method) {
    case 'GET':
      return handleGetDocument(event, db, patientId, docId, activeOrganizationId)

    case 'DELETE':
      return handleDeleteDocument(event, db, patientId, docId, activeOrganizationId)

    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function handleGetDocument(event: any, db: any, patientId: string, docId: string, organizationId: string) {
  try {
    const [document] = await db
      .select()
      .from(patientDocuments)
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, organizationId),
          isNull(patientDocuments.deletedAt)
        )
      )
      .limit(1)

    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    // Generate download URL using existing R2 infrastructure
    const config = useRuntimeConfig(event)
    const accountId = config.r2AccountId
    const downloadUrl = `https://pub-${accountId}.r2.dev/${document.storageKey}`

    return {
      ...document,
      downloadUrl
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching document:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch document'
    })
  }
}

async function handleDeleteDocument(event: any, db: any, patientId: string, docId: string, organizationId: string) {
  try {
    // First get the document to get the storage key
    const [document] = await db
      .select()
      .from(patientDocuments)
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, organizationId),
          isNull(patientDocuments.deletedAt)
        )
      )
      .limit(1)

    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    // Delete file from R2 storage
    try {
      await deleteR2File(event, document.storageKey)
    } catch (r2Error: any) {
      console.error('Error deleting file from R2:', r2Error)
      // Continue with database deletion even if R2 deletion fails
      // In production, you might want to handle this differently
    }

    // Soft delete document record
    const [deletedDocument] = await db
      .update(patientDocuments)
      .set({
        deletedAt: new Date()
      })
      .where(
        and(
          eq(patientDocuments.id, docId),
          eq(patientDocuments.patientId, patientId),
          eq(patientDocuments.organizationId, organizationId),
          isNull(patientDocuments.deletedAt)
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
      statusMessage: 'Failed to delete document'
    })
  }
}
