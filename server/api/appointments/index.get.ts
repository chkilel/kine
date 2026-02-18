import { eq, and, asc, isNull, gte, lte, getTableColumns } from 'drizzle-orm'
import { appointments, rooms, treatmentSessions } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)

  try {
    const validatedQuery = await getValidatedQuery(event, appointmentQuerySchema.parse)

    const conditions = []

    conditions.push(eq(appointments.organizationId, organizationId))

    if (validatedQuery.therapistId) {
      conditions.push(eq(appointments.therapistId, validatedQuery.therapistId))
    }

    if (validatedQuery.patientId) {
      conditions.push(eq(appointments.patientId, validatedQuery.patientId))
    }

    if (validatedQuery.treatmentPlanId) {
      conditions.push(eq(appointments.treatmentPlanId, validatedQuery.treatmentPlanId))
    } else if (validatedQuery.onlyIndependent === true) {
      conditions.push(isNull(appointments.treatmentPlanId))
    }

    if (validatedQuery.status) {
      conditions.push(eq(appointments.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      conditions.push(eq(appointments.type, validatedQuery.type))
    }

    if (validatedQuery.date) {
      conditions.push(eq(appointments.date, validatedQuery.date))
    } else {
      if (validatedQuery.dateFrom) {
        conditions.push(gte(appointments.date, validatedQuery.dateFrom))
      }

      if (validatedQuery.dateTo) {
        conditions.push(lte(appointments.date, validatedQuery.dateTo))
      }
    }

    const includeTreatmentSession = validatedQuery.include === 'treatmentSession'

    if (includeTreatmentSession) {
      const appointmentsList = await db
        .select({
          ...getTableColumns(appointments),
          roomName: rooms.name,
          treatmentSession: treatmentSessions
        })
        .from(appointments)
        .leftJoin(rooms, eq(appointments.roomId, rooms.id))
        .leftJoin(treatmentSessions, eq(appointments.id, treatmentSessions.appointmentId))
        .where(and(...conditions))
        .orderBy(asc(appointments.date))

      return appointmentsList
    }

    const appointmentsList = await db
      .select({
        ...getTableColumns(appointments),
        roomName: rooms.name
      })
      .from(appointments)
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.date))

    return appointmentsList
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des rendez-vous')
  }
})
