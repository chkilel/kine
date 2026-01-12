import { eq, and, desc, or, isNull, count, like } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'

// GET /api/patients - List patients with filtering
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 2. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, patientQuerySchema.parse)

    // 3. Build filters
    const filters = [
      eq(patients.organizationId, organizationId),
      isNull(patients.deletedAt) // Only show non-deleted patients
    ]

    // Add search filters - SQLite LIKE is case-insensitive by default
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`
      filters.push(
        or(
          like(patients.firstName, searchTerm),
          like(patients.lastName, searchTerm)
          // like(patients.email, searchTerm),
          // like(patients.phone, searchTerm)
        )!
      )
    }

    // Add status filter
    if (validatedQuery.status) {
      filters.push(eq(patients.status, validatedQuery.status))
    }

    // 4. Calculate pagination
    const limit = validatedQuery.limit
    const offset = (validatedQuery.page - 1) * limit

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: count() })
      .from(patients)
      .where(and(...filters))

    const total = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // 5. Execute paginated query
    const patientsList = await db
      .select()
      .from(patients)
      .where(and(...filters))
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset)

    // 6. Return paginated response
    return {
      data: patientsList,
      pagination: {
        total,
        page: validatedQuery.page,
        limit,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1
      }
    }
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des patients')
  }
})
