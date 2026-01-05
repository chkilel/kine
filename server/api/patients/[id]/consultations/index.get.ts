import { z } from 'zod'
import { eq, and, desc, asc } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/patients/[id]/consultations - List patient consultations
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
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

  // Get query parameters
  const query = getQuery(event)

  try {
    // Parse and validate query parameters
    const validatedQuery = consultationQuerySchema.parse(query)

    // Build base query conditions
    const baseConditions = and(
      eq(consultations.organizationId, activeOrganizationId),
      eq(consultations.patientId, patientId)
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
      .orderBy(asc(consultations.date))
      .limit(validatedQuery.limit)
      .offset((validatedQuery.page - 1) * validatedQuery.limit)

    return {
      data: consultationsList,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: consultationsList.length
      }
    }
  } catch (error: any) {
    console.error('Error fetching consultations:', error)

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
      message: 'Failed to fetch consultations'
    })
  }
})
