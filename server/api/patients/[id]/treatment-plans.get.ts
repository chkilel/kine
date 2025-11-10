import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { treatmentPlans, consultations, users } from '~~/server/database/schema'
import type { Session } from '~~/shared/types/auth.types'

// GET /api/patients/[id]/treatment-plans - Get patient treatment plans with progress
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
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
    // Get treatment plans with consultation counts for progress calculation
    const treatmentPlansData = await db
      .select({
        id: treatmentPlans.id,
        organizationId: treatmentPlans.organizationId,
        patientId: treatmentPlans.patientId,
        therapistId: treatmentPlans.therapistId,
        title: treatmentPlans.title,
        diagnosis: treatmentPlans.diagnosis,
        objective: treatmentPlans.objective,
        startDate: treatmentPlans.startDate,
        endDate: treatmentPlans.endDate,
        numberOfSessions: treatmentPlans.numberOfSessions,
        sessionFrequency: treatmentPlans.sessionFrequency,
        status: treatmentPlans.status,
        prescribingDoctor: treatmentPlans.prescribingDoctor,
        prescriptionDate: treatmentPlans.prescriptionDate,
        painLevel: treatmentPlans.painLevel,
        coverageStatus: treatmentPlans.coverageStatus,
        insuranceInfo: treatmentPlans.insuranceInfo,
        notes: treatmentPlans.notes,
        createdAt: treatmentPlans.createdAt,
        updatedAt: treatmentPlans.updatedAt,
        deletedAt: treatmentPlans.deletedAt,
        // Count completed consultations for each treatment plan
        completedConsultations: sql<number>`COUNT(CASE WHEN ${consultations.status} = 'completed' THEN ${consultations.id} END)`
      })
      .from(treatmentPlans)
      .leftJoin(
        consultations,
        and(eq(consultations.treatmentPlanId, treatmentPlans.id), eq(consultations.status, 'completed'))
      )
      .where(
        and(
          eq(treatmentPlans.organizationId, activeOrganizationId),
          eq(treatmentPlans.patientId, patientId),
          isNull(treatmentPlans.deletedAt)
        )
      )
      .groupBy(treatmentPlans.id)
      .orderBy(desc(treatmentPlans.createdAt))

    // Get therapist information for each treatment plan
    const treatmentPlansWithTherapists = await Promise.all(
      treatmentPlansData.map(async (plan) => {
        let therapist = null
        if (plan.therapistId) {
          const [therapistData] = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email
            })
            .from(users)
            .where(eq(users.id, plan.therapistId))
            .limit(1)

          therapist = therapistData
        }

        // Calculate progress percentage
        const progress =
          plan.numberOfSessions && plan.numberOfSessions > 0
            ? Math.round((Number(plan.completedConsultations) / plan.numberOfSessions) * 100)
            : 0

        return {
          ...plan,
          therapist,
          progress,
          completedConsultations: Number(plan.completedConsultations)
        }
      })
    )

    return treatmentPlansWithTherapists
  } catch (error: any) {
    console.error('Error fetching patient treatment plans:', error)

    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch patient treatment plans'
    })
  }
})
