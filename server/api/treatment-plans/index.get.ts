import { eq, and, desc, sql } from 'drizzle-orm'
import { treatmentPlans, consultations } from '~~/server/database/schema'
import { treatmentPlanQuerySchema } from '~~/shared/types/treatment-plan'

// GET /api/treatment-plans - Get treatment plans with optional patient filter and progress
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Require current user and organization from session
    const { organizationId } = await requireAuth(event)

    // 2. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, treatmentPlanQuerySchema.parse)

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
        coverageStatus: treatmentPlans.coverageStatus,
        insuranceInfo: treatmentPlans.insuranceInfo,
        notes: treatmentPlans.notes,
        createdAt: treatmentPlans.createdAt,
        updatedAt: treatmentPlans.updatedAt,
        // Count completed consultations for each treatment plan
        completedConsultations: sql<number>`COUNT(CASE WHEN ${consultations.status} = 'completed' THEN ${consultations.id} END)`
      })
      .from(treatmentPlans)
      .where(
        and(
          eq(treatmentPlans.organizationId, organizationId),
          validatedQuery.patientId ? eq(treatmentPlans.patientId, validatedQuery.patientId) : undefined
        )
      )
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
    handleApiError(error, 'Erreur lors de la récupération des plans de traitement')
  }
})
