import { eq, and, isNull } from 'drizzle-orm'
import { patients } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// DELETE /api/patients/[id] - Soft delete patient
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
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

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId
  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  try {
    // Soft delete patient
    const [deletedPatient] = await db
      .update(patients)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(patients.id, id), eq(patients.organizationId, activeOrganizationId), isNull(patients.deletedAt)))
      .returning()

    if (!deletedPatient) {
      throw createError({
        statusCode: 404,
        message: 'Patient not found'
      })
    }

    return { success: true, message: 'Patient deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting patient:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete patient'
    })
  }
})
