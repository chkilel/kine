import { eq, and, desc, isNull } from 'drizzle-orm'
import { patientDocuments } from '~~/server/database/schema'

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
    const query = getQuery(event)

    // Build filters
    const filters = [
      eq(patientDocuments.organizationId, activeOrganizationId),
      eq(patientDocuments.patientId, patientId),
      isNull(patientDocuments.deletedAt)
    ]

    // Add treatment plan filter
    if (query.treatmentPlanId) {
      filters.push(eq(patientDocuments.treatmentPlanId, query.treatmentPlanId as any))
    }

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
})
