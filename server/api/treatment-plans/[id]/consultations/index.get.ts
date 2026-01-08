import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { consultations, treatmentPlans, rooms } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/treatment-plans/[id]/consultations - Get consultations for treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const treatmentPlanId = getRouterParam(event, 'id')

  if (!treatmentPlanId) {
    throw createError({
      statusCode: 400,
      message: 'Treatment Plan ID is required'
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

  // Get query parameters
  const query = getQuery(event)

  try {
    // Parse and validate query parameters
    const validatedQuery = consultationQuerySchema.parse(query)

    // Verify treatment plan exists and belongs to organization
    const [existingTreatmentPlan] = await db
      .select()
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.id, treatmentPlanId), eq(treatmentPlans.organizationId, activeOrganizationId)))
      .limit(1)

    if (!existingTreatmentPlan) {
      throw createError({
        statusCode: 404,
        message: 'Treatment plan not found'
      })
    }

    // Build base query conditions
    const baseConditions = and(
      eq(consultations.organizationId, activeOrganizationId),
      eq(consultations.treatmentPlanId, treatmentPlanId)
    )

    // Apply additional filters
    let whereConditions = baseConditions

    if (validatedQuery.status) {
      whereConditions = and(whereConditions, eq(consultations.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      whereConditions = and(whereConditions, eq(consultations.type, validatedQuery.type))
    }

    // Execute query with room join
    const consultationsList = await db
      .select({
        id: consultations.id,
        organizationId: consultations.organizationId,
        patientId: consultations.patientId,
        treatmentPlanId: consultations.treatmentPlanId,
        therapistId: consultations.therapistId,
        roomId: consultations.roomId,
        date: consultations.date,
        startTime: consultations.startTime,
        endTime: consultations.endTime,
        duration: consultations.duration,
        type: consultations.type,
        chiefComplaint: consultations.chiefComplaint,
        notes: consultations.notes,
        treatmentSummary: consultations.treatmentSummary,
        observations: consultations.observations,
        nextSteps: consultations.nextSteps,
        painLevelBefore: consultations.painLevelBefore,
        painLevelAfter: consultations.painLevelAfter,
        progressNotes: consultations.progressNotes,
        status: consultations.status,
        location: consultations.location,
        billed: consultations.billed,
        insuranceClaimed: consultations.insuranceClaimed,
        cost: consultations.cost,
        createdAt: consultations.createdAt,
        updatedAt: consultations.updatedAt,
        roomName: rooms.name
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(whereConditions)
      .orderBy(desc(consultations.date))
      .limit(validatedQuery.limit)
      .offset((validatedQuery.page - 1) * validatedQuery.limit)

    // Calculate progress statistics
    const totalConsultations = consultationsList.length
    const completedConsultations = consultationsList.filter((c) => c.status === 'completed').length
    const progressPercentage =
      totalConsultations > 0 ? Math.round((completedConsultations / totalConsultations) * 100) : 0

    return {
      data: consultationsList,
      treatmentPlan: existingTreatmentPlan,
      statistics: {
        total: totalConsultations,
        completed: completedConsultations,
        scheduled: consultationsList.filter((c) => c.status === 'scheduled').length,
        cancelled: consultationsList.filter((c) => c.status === 'cancelled').length,
        progressPercentage
      },
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: totalConsultations
      }
    }
  } catch (error: any) {
    console.error('Error fetching treatment plan consultations:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid query parameters',
        data: error.issues
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch treatment plan consultations'
    })
  }
})
