import { eq, and, desc, SQL } from 'drizzle-orm'
import { treatmentSessions, appointments, patients, users, treatmentPlans } from '~~/server/database/schema'
import { treatmentSessionQuerySchema } from '~~/shared/types/treatment-session'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)

  try {
    const query = await getValidatedQuery(event, treatmentSessionQuerySchema.parse)
    const { patientId, therapistId, date, status, page, limit } = query

    // Build where conditions
    const conditions: SQL[] = [eq(treatmentSessions.organizationId, organizationId)]

    if (patientId) {
      conditions.push(eq(treatmentSessions.patientId, patientId))
    }

    if (therapistId) {
      conditions.push(eq(treatmentSessions.therapistId, therapistId))
    }

    if (status) {
      conditions.push(eq(treatmentSessions.status, status))
    }

    // If date is provided, filter by appointment date
    if (date) {
      conditions.push(eq(appointments.date, date))
    }

    const results = await db
      .select({
        session: treatmentSessions,
        appointment: appointments,
        patient: patients,
        therapist: users,
        treatmentPlan: treatmentPlans
      })
      .from(treatmentSessions)
      .leftJoin(appointments, eq(treatmentSessions.appointmentId, appointments.id))
      .leftJoin(patients, eq(treatmentSessions.patientId, patients.id))
      .leftJoin(users, eq(treatmentSessions.therapistId, users.id))
      .leftJoin(treatmentPlans, eq(treatmentSessions.treatmentPlanId, treatmentPlans.id))
      .where(and(...conditions))
      .orderBy(desc(treatmentSessions.createdAt))

    // Map results to include relations
    const sessions = results.map((result) => ({
      ...result.session,
      appointment: result.appointment,
      patient: result.patient,
      therapist: result.therapist,
      treatmentPlan: result.treatmentPlan
    }))

    return listResponse(sessions)
  } catch (error: unknown) {
    handleApiError(error, 'Failed to retrieve treatment sessions')
  }
})
