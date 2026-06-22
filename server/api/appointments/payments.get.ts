import { eq, and, asc, desc, or, gt, inArray, sql, isNull } from 'drizzle-orm'

import { appointments, appointmentPaymentItems, payments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const aa = getQuery(event)
    console.log('[payments.get] raw query:', aa)
    const q = await getValidatedQuery(event, appointmentQuerySchema.parse)
    console.log('[payments.get] validated q:', q)

    const limit = Math.min(q.limit ?? 20, 200)

    // =========================
    // 1. CONDITIONS
    // =========================
    const conditions = [eq(appointments.organizationId, organizationId)]

    if (q.therapistId) {
      conditions.push(eq(appointments.therapistId, q.therapistId))
    }

    if (q.patientId) {
      conditions.push(eq(appointments.patientId, q.patientId))
    }

    if (q.treatmentPlanId) {
      conditions.push(eq(appointments.treatmentPlanId, q.treatmentPlanId))
    } else if (q.onlyIndependent) {
      conditions.push(sql`${appointments.treatmentPlanId} IS NULL`)
    }

    if (q.status?.length) {
      conditions.push(
        q.status.length === 1 ? eq(appointments.status, q.status[0]!) : inArray(appointments.status, q.status)
      )
    }

    if (q.dateFrom) {
      conditions.push(sql`${appointments.date} >= ${q.dateFrom}`)
    }

    if (q.dateTo) {
      conditions.push(sql`${appointments.date} <= ${q.dateTo}`)
    }

    // =========================
    // 2. CURSOR
    // =========================
    if (q.cursorDate && q.cursorId) {
      const cursorCondition = or(
        gt(appointments.date, q.cursorDate),
        and(eq(appointments.date, q.cursorDate), gt(appointments.id, q.cursorId))
      )

      conditions.push(cursorCondition!)
    }

    // =========================
    // 3. Query
    // =========================
    const appointmentsRows = await db
      .select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(asc(appointments.date), asc(appointments.id))
      .limit(limit + 1)

    // =========================
    // 4. CURSOR HANDLING (FIXED TYPE SAFETY)
    // =========================
    let nextCursor: null | { date: string; id: string } = null

    if (appointmentsRows.length > limit) {
      const next = appointmentsRows.pop()!

      nextCursor = {
        date: next.date,
        id: next.id
      }
    }

    // =========================
    // 5. PAYMENT DETAILS (SPLIT QUERY) - WITH RECEIPTS
    // =========================
    // Note: paidCents is now cached on the appointments row itself (maintained by
    // payment create/void endpoints), so we no longer aggregate from
    // appointmentPaymentItems for the totals. We still join for paymentDetails
    // (receipts) used in the UI.
    let paymentsMap: Record<
      string,
      {
        paymentDetails: Array<{
          id: string
          amountCents: number
          receiptNumber: string
          method: PaymentMethod
          paidOn: string
        }>
      }
    > = {}

    const ids = appointmentsRows.map((r) => r.id)

    if (ids.length > 0) {
      // Query payment details without aggregation
      const paymentRows = await db
        .select({
          appointmentId: appointmentPaymentItems.appointmentId,
          amountCents: appointmentPaymentItems.amountCents,
          receiptNumber: payments.receiptNumber,
          paymentId: payments.id,
          method: payments.method,
          paidOn: payments.paidOn
        })
        .from(appointmentPaymentItems)
        .innerJoin(payments, and(eq(payments.id, appointmentPaymentItems.paymentId), isNull(payments.voidedAt)))
        .where(inArray(appointmentPaymentItems.appointmentId, ids))
        .orderBy(desc(payments.paidOn), desc(payments.createdAt))

      // Group by appointment
      paymentsMap = paymentRows.reduce(
        (acc, row) => {
          if (!acc[row.appointmentId]) {
            acc[row.appointmentId] = {
              paymentDetails: []
            }
          }
          acc[row.appointmentId]!.paymentDetails.push({
            id: row.paymentId,
            amountCents: row.amountCents,
            receiptNumber: row.receiptNumber,
            method: row.method,
            paidOn: row.paidOn
          })
          return acc
        },
        {} as Record<
          string,
          {
            paymentDetails: Array<{
              id: string
              amountCents: number
              receiptNumber: string
              method: PaymentMethod
              paidOn: string
            }>
          }
        >
      )
    }

    // =========================
    // 6. FINAL RESPONSE
    // =========================
    const data: AppointmentWithPaymentStatus[] = appointmentsRows.map((a) => {
      const paymentData = paymentsMap[a.id] ?? { paymentDetails: [] }
      const paid = a.paidCents
      const priceItemData = a.priceItem

      return {
        ...a,
        paidCents: paid,
        paymentStatus: paid >= a.priceCents && a.priceCents > 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid',
        priceItemDescription: priceItemData.description,
        paymentDetails: paymentData.paymentDetails
      }
    })

    return listResponse(data, nextCursor)
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des rendez-vous')
  }
})
