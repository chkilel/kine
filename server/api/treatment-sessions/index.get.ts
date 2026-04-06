import { eq, and, desc, SQL, sql, isNull, inArray, count } from 'drizzle-orm'
import { treatmentSessions, appointments, payments, paymentSessionItems } from '~~/server/database/schema'
import { treatmentPlans } from '~~/server/database/schema/treatment-plan'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const query = await getValidatedQuery(event, treatmentSessionQuerySchema.parse)
    const { patientId, therapistId, date, status, includePaymentStatus, page, limit } = query
    const paginate = page !== undefined
    const effectiveLimit = limit ?? 20
    const offset = (page! - 1) * effectiveLimit

    const conditions: SQL[] = [eq(treatmentSessions.organizationId, organizationId)]

    if (patientId) {
      conditions.push(eq(treatmentSessions.patientId, patientId))
    }

    if (therapistId) {
      conditions.push(eq(treatmentSessions.therapistId, therapistId))
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim()) as TreatmentSessionStatus[]
      if (statuses.length === 1) {
        conditions.push(eq(treatmentSessions.status, statuses[0]!))
      } else {
        conditions.push(inArray(treatmentSessions.status, statuses))
      }
    }

    if (date) {
      conditions.push(eq(appointments.date, date))
    }

    if (includePaymentStatus && patientId) {
      const paidSubquery = db
        .select({
          sessionId: paymentSessionItems.treatmentSessionId,
          paidCents:
            sql<number>`SUM(CASE WHEN ${payments.type} = 'session_payment' THEN ${paymentSessionItems.amountCents} ELSE -${paymentSessionItems.amountCents} END)`.as(
              'paidCents'
            )
        })
        .from(paymentSessionItems)
        .innerJoin(payments, eq(payments.id, paymentSessionItems.paymentId))
        .where(and(eq(payments.patientId, patientId), isNull(payments.voidedAt)))
        .groupBy(paymentSessionItems.treatmentSessionId)
        .as('paid_sub')

      const dbQuery = db
        .select({
          id: treatmentSessions.id,
          organizationId: treatmentSessions.organizationId,
          appointmentId: treatmentSessions.appointmentId,
          patientId: treatmentSessions.patientId,
          treatmentPlanId: treatmentSessions.treatmentPlanId,
          therapistId: treatmentSessions.therapistId,
          primaryConcern: treatmentSessions.primaryConcern,
          treatmentSummary: treatmentSessions.treatmentSummary,
          observations: treatmentSessions.observations,
          nextSteps: treatmentSessions.nextSteps,
          painLevelBefore: treatmentSessions.painLevelBefore,
          painLevelAfter: treatmentSessions.painLevelAfter,
          status: treatmentSessions.status,
          actualStartTime: treatmentSessions.actualStartTime,
          actualDurationSeconds: treatmentSessions.actualDurationSeconds,
          totalPausedSeconds: treatmentSessions.totalPausedSeconds,
          pauseStartTime: treatmentSessions.pauseStartTime,
          extendedDurationMinutes: treatmentSessions.extendedDurationMinutes,
          tags: treatmentSessions.tags,
          insuranceClaimed: treatmentSessions.insuranceClaimed,
          priceCent: treatmentSessions.priceCent,
          createdAt: treatmentSessions.createdAt,
          updatedAt: treatmentSessions.updatedAt,
          paidCents: sql<number>`COALESCE(${paidSubquery.paidCents}, 0)`.as('paidCents'),
          planTitle: treatmentPlans.title,
          appointmentDate: appointments.date,
          appointmentLocation: appointments.location
        })
        .from(treatmentSessions)
        .leftJoin(appointments, eq(appointments.id, treatmentSessions.appointmentId))
        .leftJoin(treatmentPlans, eq(treatmentPlans.id, treatmentSessions.treatmentPlanId))
        .leftJoin(paidSubquery, eq(paidSubquery.sessionId, treatmentSessions.id))
        .where(and(...conditions))
        .orderBy(desc(treatmentSessions.createdAt))

      if (paginate) dbQuery.limit(effectiveLimit).offset(offset)

      const results = await dbQuery

      const resp = results.map((r) => {
        const paid = r.paidCents || 0
        const price = r.priceCent || 0
        let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
        if (paid >= price && price > 0) paymentStatus = 'paid'
        else if (paid > 0) paymentStatus = 'partial'

        return {
          ...r,
          paidCents: paid,
          paymentStatus
        }
      })

      if (paginate) {
        const totalCountResult = await db
          .select({ count: count() })
          .from(treatmentSessions)
          .where(and(...conditions))

        const total = totalCountResult[0]?.count || 0
        const totalPages = Math.ceil(total / effectiveLimit)

        return listResponse(resp, {
          total,
          page,
          limit: effectiveLimit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        })
      }

      return listResponse(resp)
    }

    const dbQuery = db
      .select()
      .from(treatmentSessions)
      .leftJoin(appointments, eq(appointments.id, treatmentSessions.appointmentId))
      .leftJoin(treatmentPlans, eq(treatmentPlans.id, treatmentSessions.treatmentPlanId))
      .where(and(...conditions))
      .orderBy(desc(treatmentSessions.createdAt))

    if (paginate) dbQuery.limit(effectiveLimit).offset(offset)

    const results = await dbQuery

    const resp = results.map((r) => ({
      ...r.treatment_sessions,
      planTitle: r.treatment_plans?.title ?? null,
      appointmentDate: r.appointments?.date ?? null,
      appointmentLocation: r.appointments?.location ?? null
    }))

    if (paginate) {
      const totalCountResult = await db
        .select({ count: count() })
        .from(treatmentSessions)
        .where(and(...conditions))

      const total = totalCountResult[0]?.count || 0
      const totalPages = Math.ceil(total / effectiveLimit)

      return listResponse(resp, {
        total,
        page,
        limit: effectiveLimit,
        totalPages,
        hasNext: page! < totalPages,
        hasPrev: page! > 1
      })
    }

    return listResponse(resp)
  } catch (error) {
    handleApiError(error, 'Failed to retrieve treatment sessions')
  }
})
