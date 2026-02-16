import { eq, and, asc, isNull, gte, lte, getTableColumns } from 'drizzle-orm'
import { consultations, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuth(event)

  try {
    const validatedQuery = await getValidatedQuery(event, consultationQuerySchema.parse)

    const conditions = []

    conditions.push(eq(consultations.organizationId, organizationId))

    if (validatedQuery.therapistId) {
      conditions.push(eq(consultations.therapistId, validatedQuery.therapistId))
    }

    if (validatedQuery.patientId) {
      conditions.push(eq(consultations.patientId, validatedQuery.patientId))
    }

    if (validatedQuery.treatmentPlanId) {
      conditions.push(eq(consultations.treatmentPlanId, validatedQuery.treatmentPlanId))
    } else if (validatedQuery.onlyIndependent === true) {
      conditions.push(isNull(consultations.treatmentPlanId))
    }

    if (validatedQuery.status) {
      conditions.push(eq(consultations.status, validatedQuery.status))
    }

    if (validatedQuery.type) {
      conditions.push(eq(consultations.type, validatedQuery.type))
    }

    if (validatedQuery.date) {
      conditions.push(eq(consultations.date, validatedQuery.date))
    } else {
      if (validatedQuery.dateFrom) {
        conditions.push(gte(consultations.date, validatedQuery.dateFrom))
      }

      if (validatedQuery.dateTo) {
        conditions.push(lte(consultations.date, validatedQuery.dateTo))
      }
    }

    const consultationsList = await db
      .select({
        ...getTableColumns(consultations),
        roomName: rooms.name
      })
      .from(consultations)
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(and(...conditions))
      .orderBy(asc(consultations.date))

    return consultationsList
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations')
  }
})
