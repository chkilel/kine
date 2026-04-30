import { eq, and, asc } from 'drizzle-orm'
import { z } from 'zod'
import { appointments } from '~~/server/database/schema'

const planAppointmentsQuerySchema = z.object({
  treatmentPlanId: z.string(),
  patientId: z.string(),
  limit: z.coerce.number().min(1).max(20).default(10)
})

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const validatedQuery = await getValidatedQuery(event, planAppointmentsQuerySchema.parse)

    const planAppointments = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        status: appointments.status,
        painLevelBefore: appointments.painLevelBefore,
        painLevelAfter: appointments.painLevelAfter,
        sessionNotes: appointments.sessionNotes
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.treatmentPlanId, validatedQuery.treatmentPlanId),
          eq(appointments.patientId, validatedQuery.patientId)
        )
      )
      .orderBy(asc(appointments.date))
      .limit(validatedQuery.limit)

    return planAppointments
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des séances du plan')
  }
})
