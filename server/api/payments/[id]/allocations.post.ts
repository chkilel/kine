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
        id: { eq: paymentId },
        organizationId: { eq: organizationId }
      },
      columns: { id: true, amountCents: true }
    })

    if (!payment) {
      throw createError({ statusCode: 404, message: 'Paiement introuvable' })
    }

    const body = await readValidatedBody(event, paymentAllocationCreateSchema.parse)

    const existingAllocations = await db
      .select({ amountCents: paymentAllocations.amountCents })
      .from(paymentAllocations)
      .where(eq(paymentAllocations.paymentId, paymentId))

    const totalAllocated = existingAllocations.reduce((sum, a) => sum + a.amountCents, 0)
    if (totalAllocated + body.amountCents > payment.amountCents) {
      throw createError({
        statusCode: 400,
        message: 'Le montant alloué dépasse le montant du paiement'
      })
    }

    const [allocation] = await db
      .insert(paymentAllocations)
      .values({
        paymentId,
        invoiceId: body.invoiceId,
        appointmentId: body.appointmentId,
        portion: body.portion,
        amountCents: body.amountCents
      })
      .returning()

    return allocation
  } catch (error) {
    handleApiError(error, "Erreur lors de la création de l'allocation")
  }
})
