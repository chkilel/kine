import { eq, and, asc, isNull, gte, lte, getColumns, sql, inArray } from 'drizzle-orm'
import { appointments, rooms, appointmentPaymentItems, treatmentPlans } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

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

    if (validatedQuery.status && validatedQuery.status.length > 0) {
      if (validatedQuery.status.length === 1) {
        conditions.push(eq(appointments.status, validatedQuery.status[0] as any))
      } else {
        conditions.push(inArray(appointments.status, validatedQuery.status as any))
      }
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

    if (validatedQuery.includePaymentStatus) {
      const query = db
        .select({
          ...getColumns(appointments),
          roomName: rooms.name,
          planTitle: treatmentPlans.title,
          paidCents: sql<number>`COALESCE(SUM(${appointmentPaymentItems.amountCents}), 0)`.as('paidCents')
        })
        .from(appointments)
        .leftJoin(rooms, eq(appointments.roomId, rooms.id))
        .leftJoin(treatmentPlans, eq(appointments.treatmentPlanId, treatmentPlans.id))
        .leftJoin(appointmentPaymentItems, eq(appointments.id, appointmentPaymentItems.appointmentId))
        .leftJoin(sql`payments`, sql`payments.id = ${appointmentPaymentItems.paymentId} AND payments.voidedAt IS NULL`)
        .where(and(...conditions))
        .groupBy(appointments.id, rooms.name)
        .orderBy(asc(appointments.date))

      if (validatedQuery.limit) {
        query.limit(validatedQuery.limit)
      }

      const appointmentsList = await query

      const appointmentsWithPayments = appointmentsList.map((a) => ({
        ...a,
        paymentStatus:
          a.paidCents >= a.priceCents && a.priceCents > 0 ? 'paid' : a.paidCents > 0 ? 'partially_paid' : 'unpaid'
      }))

      return appointmentsWithPayments
    }

    const query = db
      .select({
        ...getColumns(appointments),
        roomName: rooms.name,
        planTitle: treatmentPlans.title
      })
      .from(appointments)
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .leftJoin(treatmentPlans, eq(appointments.treatmentPlanId, treatmentPlans.id))
      .where(and(...conditions))
      .orderBy(asc(appointments.date))

    if (validatedQuery.limit) {
      query.limit(validatedQuery.limit)
    }

    const appointmentsList = await query
    return appointmentsList
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des rendez-vous')
  }
})
