import { patientDocuments } from '~~/server/database/schema'

// POST /api/patients/[id]/documents - Create new document record
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID is required'
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
      message: 'Unauthorized'
    })
  }

  try {
    const body = await readBody(event)

    const documentData = patientDocumentCreateSchema.parse({
      patientId,
      organizationId: body.organizationId,
      uploadedById: session.user.id,
      treatmentPlanId: body.treatmentPlanId || null,
      fileName: body.fileName,
      originalFileName: body.originalFileName,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      storageKey: body.storageKey,
      category: body.category,
      description: body.description || null
    })

    const [newDocument] = await db.insert(patientDocuments).values(documentData).returning()

    return newDocument
  } catch (error: any) {
    console.error('Error creating document:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create document'
    })
  }
})
