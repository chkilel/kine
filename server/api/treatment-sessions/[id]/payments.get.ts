import { eq, and, isNull } from 'drizzle-orm'
import { payments, paymentSessionItems, treatmentSessions } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const sessionId = getRouterParam(event, 'id')
    if (!sessionId) {
      throw createError({ statusCode: 400, message: 'Session ID required' })
    }

    const [session] = await db
      .select({ id: treatmentSessions.id, organizationId: treatmentSessions.organizationId })
      .from(treatmentSessions)
      .where(eq(treatmentSessions.id, sessionId))
      .limit(1)

    if (!session) {
      throw createError({ statusCode: 404, message: 'Séance introuvable' })
    }

    if (session.organizationId !== organizationId) {
      throw createError({ statusCode: 403, message: 'Accès refusé' })
    }

    const sessionPayments = await db
      .select({
        id: payments.id,
        receiptNumber: payments.receiptNumber,
        type: payments.type,
        amountCents: payments.amountCents,
        method: payments.method,
        paidOn: payments.paidOn,
        notes: payments.notes,
        createdAt: payments.createdAt
      })
      .from(paymentSessionItems)
      .innerJoin(payments, eq(paymentSessionItems.paymentId, payments.id))
      .where(and(eq(paymentSessionItems.treatmentSessionId, sessionId), isNull(payments.voidedAt)))

    return sessionPayments
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des paiements')
  }
})
