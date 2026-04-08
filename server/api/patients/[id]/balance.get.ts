import { eq, and, sql, isNull, inArray } from 'drizzle-orm'
import { payments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const patientId = getRouterParam(event, 'id')
    if (!patientId) {
      throw createError({ statusCode: 400, message: 'Patient ID required' })
    }

    const result = await db
      .select({
        depositAddTotal: sql<number>`SUM(CASE WHEN ${payments.type} = 'deposit_add' THEN ${payments.amountCents} ELSE 0 END)`,
        depositUsageTotal: sql<number>`SUM(CASE WHEN ${payments.type} = 'session_payment' AND ${payments.method} = 'deposit' THEN ${payments.amountCents} ELSE 0 END)`,
        depositRefundTotal: sql<number>`SUM(CASE WHEN ${payments.type} = 'deposit_refund' THEN ${payments.amountCents} ELSE 0 END)`
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.patientId, patientId),
          inArray(payments.type, ['deposit_add', 'session_payment', 'deposit_refund']),
          isNull(payments.voidedAt)
        )
      )

    const depositAddTotal = result[0]?.depositAddTotal || 0
    const depositUsageTotal = result[0]?.depositUsageTotal || 0
    const depositRefundTotal = result[0]?.depositRefundTotal || 0
    const balanceCents = depositAddTotal - depositUsageTotal - depositRefundTotal

    return balanceCents
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération du solde')
  }
})
