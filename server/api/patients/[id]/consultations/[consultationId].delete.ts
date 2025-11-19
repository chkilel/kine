import { eq, and } from 'drizzle-orm'
import { consultations } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// DELETE /api/patients/[id]/consultations/[consultationId] - Delete consultation
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const consultationId = getRouterParam(event, 'consultationId')

  if (!patientId || !consultationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Patient ID and Consultation ID are required'
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
    // Check if consultation exists and belongs to patient/organization
    const [existingConsultation] = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.patientId, patientId),
          eq(consultations.organizationId, activeOrganizationId)
        )
      )
      .limit(1)

    if (!existingConsultation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Consultation not found'
      })
    }

    // Delete consultation
    await db.delete(consultations).where(eq(consultations.id, consultationId))

    return {
      message: 'Consultation deleted successfully'
    }
  } catch (error: any) {
    console.error('Error deleting consultation:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete consultation'
    })
  }
})
