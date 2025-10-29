import { eq, and, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'

// GET /api/patients/[id] - Get patient details
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
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
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), eq(patients.organizationId, activeOrganizationId), isNull(patients.deletedAt)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Patient not found'
      })
    }

    return patient
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching patient:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch patient'
    })
  }
})
