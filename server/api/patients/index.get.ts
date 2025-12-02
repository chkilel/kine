import { eq, and, desc, or, isNull, count, sql, like } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'

// GET /api/patients - List patients with filtering
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

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

  const query = getQuery(event)

  // Validate query parameters
  const validatedQuery = patientQuerySchema.parse(query)

  try {
    // Build filters
    const filters = [
      eq(patients.organizationId, activeOrganizationId),
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
    if (query.status && query.status !== 'all') {
      filters.push(eq(patients.status, query.status as any))
    }

    // Add insurance provider filter
    if (validatedQuery.insuranceProvider) {
      filters.push(like(patients.insuranceProvider, `%${validatedQuery.insuranceProvider}%`))
    }

    // Add gender filter
    if (validatedQuery.gender) {
      filters.push(eq(patients.gender, validatedQuery.gender))
    }

    // Calculate pagination
    const limit = validatedQuery.limit
    const offset = (validatedQuery.page - 1) * limit

    // Get total count for pagination metadata
    const totalCountResult = await db
      .select({ count: count() })
      .from(patients)
      .where(and(...filters))

    const total = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    // Execute paginated query
    const patientsList = await db
      .select()
      .from(patients)
      .where(and(...filters))
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset)

    // Return paginated response
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
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch patients'
    })
  }
})
