import { eq, and, asc, sql, getTableColumns } from 'drizzle-orm'
import { consultations, rooms, patients, treatmentPlans } from '~~/server/database/schema'
import { z } from 'zod'

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

    const consultationsList = await db
      .select({
        ...getTableColumns(consultations),
        roomName: rooms.name,
        patientName: sql<string>`(${patients.firstName} || ' ' || ${patients.lastName})`,
        planTitle: treatmentPlans.title
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .leftJoin(patients, eq(consultations.patientId, patients.id))
      .leftJoin(treatmentPlans, eq(consultations.treatmentPlanId, treatmentPlans.id))
      .where(
        and(
          eq(consultations.organizationId, organizationId),
          eq(consultations.therapistId, therapistId),
          eq(consultations.date, date)
        )
      )
      .orderBy(asc(consultations.date))

    return consultationsList
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations du jour')
  }
})
