import { eq, and, desc, getTableColumns } from 'drizzle-orm'
import { appointments, treatmentPlans, rooms } from '~~/server/database/schema'

// GET /api/treatment-plans/[id]/appointments - Get appointments for treatment plan
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
    const validatedQuery = await getValidatedQuery(event, appointmentQuerySchema.parse)

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
      eq(appointments.organizationId, organizationId),
      eq(appointments.treatmentPlanId, treatmentPlanId)
    )

    // Apply additional filters
    let whereConditions = baseConditions

    if (validatedQuery.status) {
      whereConditions = and(whereConditions, eq(appointments.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      whereConditions = and(whereConditions, eq(appointments.type, validatedQuery.type))
    }

    // Execute query with room join
    const appointmentsList = await db
      .select({
        ...getTableColumns(appointments),
        roomName: rooms.name
      })
      .from(appointments)
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .where(whereConditions)
      .orderBy(desc(appointments.date))

    // Calculate progress statistics
    const totalAppointments = appointmentsList.length
    const completedAppointments = appointmentsList.filter((a) => a.status === 'completed').length
    const progressPercentage = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0

    return {
      data: appointmentsList,
      treatmentPlan: existingTreatmentPlan,
      statistics: {
        total: totalAppointments,
        completed: completedAppointments,
        scheduled: appointmentsList.filter((c) => c.status === 'scheduled').length,
        cancelled: appointmentsList.filter((c) => c.status === 'cancelled').length,
        progressPercentage
      }
    }
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération des rendez-vous du plan de traitement')
  }
})
