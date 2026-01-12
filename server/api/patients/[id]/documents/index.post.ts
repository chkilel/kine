import { patientDocuments } from '~~/server/database/schema'

// POST /api/patients/[id]/documents - Create new document record
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  try {
    if (!patientId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient requis'
      })
    }

    const { userId, organizationId } = await requireAuth(event)

    const body = await readValidatedBody(event, patientDocumentCreateSchema.parse)

    const documentData = {
      patientId,
      organizationId,
      uploadedById: userId,
      treatmentPlanId: body.treatmentPlanId || null,
      fileName: body.fileName,
      originalFileName: body.originalFileName,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      storageKey: body.storageKey,
      category: body.category,
      description: body.description || null
    }

    const [newDocument] = await db.insert(patientDocuments).values(documentData).returning()

    return newDocument
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création du document')
  }
})
