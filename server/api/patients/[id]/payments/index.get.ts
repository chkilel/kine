export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const patientId = getRouterParam(event, 'id')
    if (!patientId) {
      throw createError({ statusCode: 400, message: 'Patient ID required' })
    }

    const query = await getValidatedQuery(event, patientPaymentsQuerySchema.parse)
    const { type, limit, includeVoided } = query

    const where: any = {
      AND: [{ organizationId: { eq: organizationId } }, { patientId: { eq: patientId } }]
    }

    if (!includeVoided) {
      where.AND.push({ voidedAt: { isNull: true } })
    }

    if (type) {
      where.AND.push({ type: { eq: type } })
    }

    const results = await db.query.payments.findMany({
      where,
      with: {
        appointmentPaymentItems: {
          columns: {
            id: true,
            paymentId: true,
            appointmentId: true,
            amountCents: true
          }
        }
      },
      orderBy: { paidOn: 'desc' },
      limit
    })

    return results.map((payment) => ({
      ...payment,
      appointmentItems: payment.appointmentPaymentItems
    }))
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des paiements')
  }
})
