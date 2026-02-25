import { eq, and, desc, SQL } from 'drizzle-orm'
import { treatmentSessions, appointments } from '~~/server/database/schema'

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
      .select()
      .from(treatmentSessions)
      .where(and(...conditions))
      .orderBy(desc(treatmentSessions.createdAt))

    // Map results to include relations

    return listResponse(results)
  } catch (error: unknown) {
    handleApiError(error, 'Failed to retrieve treatment sessions')
  }
})
