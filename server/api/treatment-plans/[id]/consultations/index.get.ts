import { eq, and, desc, getTableColumns } from 'drizzle-orm'
import { consultations, treatmentPlans, rooms } from '~~/server/database/schema'
import { requireAuth } from '~~/server/utils/auth'
import { handleApiError } from '~~/server/utils/error'
import { consultationQuerySchema } from '~~/shared/types/consultation.type'

// GET /api/treatment-plans/[id]/consultations - Get consultations for treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const treatmentPlanId = getRouterParam(event, 'id')

  try {
    if (!treatmentPlanId) {
      throw createError({
        statusCode: 400,
        message: 'ID de plan de traitement requis'
      })
    }

    const { organizationId } = await requireAuth(event)

    // Validate query parameters
    const validatedQuery = await getValidatedQuery(event, consultationQuerySchema.parse)

    // Verify treatment plan exists and belongs to organization
    const [existingTreatmentPlan] = await db
      .select()
      .from(treatmentPlans)
      .where(and(eq(treatmentPlans.id, treatmentPlanId), eq(treatmentPlans.organizationId, organizationId)))
      .limit(1)

    if (!existingTreatmentPlan) {
      throw createError({
        statusCode: 404,
        message: 'Plan de traitement introuvable'
      })
    }

    // Build base query conditions
    const baseConditions = and(
      eq(consultations.organizationId, organizationId),
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
        ...getTableColumns(consultations),
        roomName: rooms.name
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(whereConditions)
      .orderBy(desc(consultations.date))

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
      }
    }
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération des consultations du plan de traitement')
  }
})
