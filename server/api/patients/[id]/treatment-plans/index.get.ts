import { eq, and, desc, sql } from 'drizzle-orm'
import { treatmentPlans, consultations } from '~~/server/database/schema'

// GET /api/patients/[id]/treatment-plans - Get patient treatment plans with progress
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  try {
    // 1. Validate treatement plan ID
    if (!patientId) {
      throw createError({
        statusCode: 400,
        message: 'Patient ID is required'
      })
    }

    // 2. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

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
        // Count completed consultations for each treatment plan
        completedConsultations: sql<number>`COUNT(CASE WHEN ${consultations.status} = 'completed' THEN ${consultations.id} END)`
      })
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.organizationId, organizationId), eq(treatmentPlans.patientId, patientId)))
      .leftJoin(
        consultations,
        and(eq(consultations.treatmentPlanId, treatmentPlans.id), eq(consultations.status, 'completed'))
      )
      .groupBy(treatmentPlans.id)
      .orderBy(desc(treatmentPlans.createdAt))

    const treatmentPlansWithProgress = treatmentPlansData.map((plan) => ({
      ...plan,
      progress:
        plan.numberOfSessions && plan.numberOfSessions > 0
          ? Math.round((Number(plan.completedConsultations) / plan.numberOfSessions) * 100)
          : 0,
      completedConsultations: Number(plan.completedConsultations)
    }))

    return treatmentPlansWithProgress
  } catch (error) {
    handleApiError(error)
  }
})
