import { eq, and, asc, sql, getTableColumns } from 'drizzle-orm'
import { appointments, rooms, patients, treatmentPlans } from '~~/server/database/schema'
import { z } from 'zod'
import { calendarDateSchema } from '~~/shared/types/base.types'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)
  const therapistId = getRouterParam(event, 'id')

  if (!therapistId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Therapist ID is required'
    })
  }

  try {
    const { date } = await getValidatedQuery(event, z.object({ date: calendarDateSchema }).parse)

    const appointmentsList = await db
      .select({
        ...getTableColumns(appointments),
        roomName: rooms.name,
        patientName: sql<string>`(${patients.firstName} || ' ' || ${patients.lastName})`,
        planTitle: treatmentPlans.title
      })
      .from(appointments)
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(treatmentPlans, eq(appointments.treatmentPlanId, treatmentPlans.id))
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.therapistId, therapistId),
          eq(appointments.date, date)
        )
      )
      .orderBy(asc(appointments.startTime))

    return appointmentsList
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations du jour')
  }
})
