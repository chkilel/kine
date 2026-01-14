import { eq, and, desc } from 'drizzle-orm'
import { patientDocuments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  try {
    //1. Validate patient ID
    if (!patientId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient requis'
      })
    }

    // 2. Validate patient ID
    const query = await getValidatedQuery(event, patientDocumentQuerySchema.parse)

    // 3. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // Build filters
    const filters = [eq(patientDocuments.organizationId, organizationId), eq(patientDocuments.patientId, patientId)]

    // Add treatment plan filter
    if (query.treatmentPlanId) {
      filters.push(eq(patientDocuments.treatmentPlanId, query.treatmentPlanId))
    }

    // Add category filter
    if (query.category && query.category) {
      filters.push(eq(patientDocuments.category, query.category))
    }

    // Execute query
    const documents = await db
      .select()
      .from(patientDocuments)
      .where(and(...filters))
      .orderBy(desc(patientDocuments.createdAt))
      .limit(query.limit ?? 20)
      .offset(query.page ? query.page - 1 : 0)

    return documents
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des documents du patient')
  }
})
