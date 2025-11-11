import type { Session } from '~~/shared/types/auth.types'
import { patientDocuments } from '~~/server/database/schema'
import { createId } from '@paralleldrive/cuid2'

// POST /api/patients/[id]/documents - Create new document record
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Patient ID is required'
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

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  try {
    const body = await readBody(event)

    // Validate required fields
    if (
      !body.fileName ||
      !body.originalFileName ||
      !body.mimeType ||
      !body.fileSize ||
      !body.storageKey ||
      !body.category
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required document fields'
      })
    }

    const documentData = {
      id: createId(),
      patientId,
      organizationId: activeOrganizationId,
      uploadedById: session.user.id,
      treatmentPlanId: body.treatmentPlanId || null,
      fileName: body.fileName,
      originalFileName: body.originalFileName,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      storageKey: body.storageKey,
      category: body.category,
      description: body.description || null
    }

    // Create document record
    const [newDocument] = await db.insert(patientDocuments).values(documentData).returning()

    return newDocument
  } catch (error: any) {
    console.error('Error creating document:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create document'
    })
  }
})
