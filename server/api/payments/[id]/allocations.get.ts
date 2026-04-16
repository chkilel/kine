import { eq } from 'drizzle-orm'
import { paymentAllocations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const paymentId = getRouterParam(event, 'id')
    if (!paymentId) {
      throw createError({ statusCode: 400, message: 'ID de paiement requis' })
    }

    const payment = await db.query.payments.findFirst({
      where: {
        organizationId: { eq: organizationId },
        id: { eq: paymentId }
      },
      columns: { id: true }
    })

    if (!payment) {
      throw createError({ statusCode: 404, message: 'Paiement introuvable' })
    }

    const allocations = await db.select().from(paymentAllocations).where(eq(paymentAllocations.paymentId, paymentId))

    return allocations
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des allocations')
  }
})
