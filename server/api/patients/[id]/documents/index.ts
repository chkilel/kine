import { eq, and, desc, isNull } from 'drizzle-orm'
import { patientDocuments } from '../../../../database/schema'
import { patientDocumentInsertSchema } from '~~/shared/types/patient.types'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/patients/[id]/documents - List patient documents
// POST /api/patients/[id]/documents - Upload patient document
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
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

  switch (method) {
    case 'GET':
      return handleGetDocuments(db, patientId, activeOrganizationId, getQuery(event))

    case 'POST':
      return handleUploadDocument(db, patientId, activeOrganizationId, session.user.id, await readBody(event))

    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function handleGetDocuments(db: any, patientId: string, organizationId: string, query: any) {
  try {
    // Build filters
    const filters = [
      eq(patientDocuments.patientId, patientId),
      eq(patientDocuments.organizationId, organizationId),
      isNull(patientDocuments.deletedAt)
    ]

    // Add category filter
    if (query.category && query.category !== 'all') {
      filters.push(eq(patientDocuments.category, query.category as any))
    }

    // Execute query
    const documents = await db
      .select()
      .from(patientDocuments)
      .where(and(...filters))
      .orderBy(desc(patientDocuments.createdAt))
      .limit(query.limit ? parseInt(query.limit as string) : 50)
      .offset(query.offset ? parseInt(query.offset as string) : 0)

    return documents
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch documents'
    })
  }
}

async function handleUploadDocument(db: any, patientId: string, organizationId: string, uploadedBy: string, body: any) {
  try {
    // Validate input
    const validatedData = patientDocumentInsertSchema.parse({
      ...body,
      patientId,
      organizationId,
      uploadedBy
    })

    // Create document record
    const [newDocument] = await db.insert(patientDocuments).values(validatedData).returning()

    return newDocument
  } catch (error: any) {
    console.error('Error uploading document:', error)
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid document data',
        data: error.errors
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload document'
    })
  }
}
