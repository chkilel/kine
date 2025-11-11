import { eq, and, desc, or, ilike, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

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

  try {
    // Access deletedAt column defensively to avoid type mismatch
    const deletedAtCol = patients.deletedAt

    // Build filters
    const filters = [
      eq(patients.organizationId, activeOrganizationId),
      isNull(deletedAtCol) // Only show non-deleted patients
    ]

    // Add search filters
    if (query.search) {
      const searchTerm = `%${query.search}%`
      filters.push(
        or(
          ilike(patients.firstName, searchTerm),
          ilike(patients.lastName, searchTerm),
          ilike(patients.email, searchTerm),
          ilike(patients.phone, searchTerm)
        )!
      )
    }

    // Add status filter
    if (query.status && query.status !== 'all') {
      filters.push(eq(patients.status, query.status as any))
    }

    // Add insurance provider filter
    if (query.insuranceProvider) {
      filters.push(ilike(patients.insuranceProvider, `%${query.insuranceProvider}%`))
    }

    // Execute query
    const patientsList = await db
      .select()
      .from(patients)
      .where(and(...filters))
      .orderBy(desc(patients.createdAt))
      .limit(query.limit ? parseInt(query.limit as string) : 50)
      .offset(query.offset ? parseInt(query.offset as string) : 0)

    return patientsList
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch patients'
    })
  }
})
