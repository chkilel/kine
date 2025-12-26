import { eq, and, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'

// GET /api/patients/[id] - Get patient details
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    // 1. Validate patient ID
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Patient ID is required'
      })
    }

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 3. Fetch patient
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.organizationId, organizationId), eq(patients.id, id), isNull(patients.deletedAt)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient not found'
      })
    }

    return patient
  } catch (error) {
    handleApiError(error)
  }
})
