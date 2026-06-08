export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const paymentId = getRouterParam(event, 'id')
    if (!paymentId) {
      throw createError({ statusCode: 400, message: 'Payment ID required' })
    }

    const payment = await db.query.payments.findFirst({
      where: {
        organizationId: { eq: organizationId },
        id: { eq: paymentId }
      },
      with: {
        appointmentPaymentItems: {
          with: {
            appointment: {
              columns: {
                id: true,
                treatmentPlanId: true,
                priceCents: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      throw createError({ statusCode: 404, message: 'Paiement introuvable' })
    }

    return {
      ...payment,
      appointmentItems: payment.appointmentPaymentItems
    }
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération du paiement')
  }
})
