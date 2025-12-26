import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { consultations } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// PUT /api/patients/[id]/consultations/[id] - Update consultation
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')
  const consultationId = getRouterParam(event, 'consultationId')

  if (!patientId || !consultationId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID and Consultation ID are required'
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
    // Get request body
    const body = await readBody(event)

    // Parse and validate request body
    const validatedData = consultationUpdateSchema.parse(body)

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
        message: 'Consultation not found'
      })
    }

    // Update consultation
    const [updatedConsultation] = await db
      .update(consultations)
      .set(validatedData)
      .where(eq(consultations.id, consultationId))
      .returning()

    return {
      data: updatedConsultation,
      message: 'Consultation updated successfully'
    }
  } catch (error: any) {
    console.error('Error updating consultation:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid consultation data',
        data: error.issues
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to update consultation'
    })
  }
})
