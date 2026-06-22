import { eq, and, desc, getColumns, count } from 'drizzle-orm'
import { treatmentPlans, appointments } from '~~/server/database/schema'

// GET /api/treatment-plans - Get treatment plans with optional patient/status filter and progress
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Require current user and organization from session
    const { organizationId } = await requireAuthWithOrg(event)

    // 2. Validate query parameters
    const validatedQuery = await getValidatedQuery(event, treatmentPlanQuerySchema.parse)

    // 3. Build filters — always scoped to the current organization
    const filters = [eq(treatmentPlans.organizationId, organizationId)]

    if (validatedQuery.patientId) {
      filters.push(eq(treatmentPlans.patientId, validatedQuery.patientId))
    }

    if (validatedQuery.status) {
      filters.push(eq(treatmentPlans.status, validatedQuery.status))
    }

    // 4. Get treatment plans with finished-appointment counts for progress calculation.
    //    The LEFT JOIN already restricts to status = 'finished', so COUNT(appointments.id)
    //    is enough — no need for a redundant CASE WHEN.
    //    'finished' means the clinical session has ended (regardless of payment state);
    //    payment state lives on appointments.paidCents (see isAppointmentPaid()).
    const rows = await db
      .select({
        ...getColumns(treatmentPlans),
        finishedCount: count(appointments.id)
      })
      .from(treatmentPlans)
      .leftJoin(
        appointments,
        and(eq(appointments.treatmentPlanId, treatmentPlans.id), eq(appointments.status, 'finished'))
      )
      .where(and(...filters))
      .groupBy(treatmentPlans.id)
      .orderBy(desc(treatmentPlans.createdAt))

    // 5. Compute progress percentage per plan
    return rows.map((plan) => {
      const finished = Number(plan.finishedCount)
      const total = plan.numberOfSessions ?? 0

      return {
        ...plan,
        finishedCount: finished,
        progress: total > 0 ? Math.min(100, Math.round((finished / total) * 100)) : 0
      }
    })
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des plans de traitement')
  }
})
