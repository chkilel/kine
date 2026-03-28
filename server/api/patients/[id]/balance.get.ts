import { eq, and, sql, isNull } from 'drizzle-orm'
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
        depositTotal: sql<number>`SUM(CASE WHEN ${payments.type} = 'deposit' THEN ${payments.amountCents} ELSE 0 END)`,
        creditUsageTotal: sql<number>`SUM(CASE WHEN ${payments.type} = 'credit_usage' THEN ${payments.amountCents} ELSE 0 END)`
      })
      .from(payments)
      .where(
        and(eq(payments.patientId, patientId), eq(payments.organizationId, organizationId), isNull(payments.voidedAt))
      )

    const depositTotal = result[0]?.depositTotal || 0
    const creditUsageTotal = result[0]?.creditUsageTotal || 0
    const balanceCents = depositTotal - creditUsageTotal

    return balanceCents
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération du solde')
  }
})
