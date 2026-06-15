import { eq, and } from 'drizzle-orm'
import { appointments, organizations } from '~~/server/database/schema'
import { toPriceItemSnapshot } from '~~/server/utils/pricing'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireAuthWithOrg(event)

  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' })
  }

  const body = await readValidatedBody(event, updatePriceActionSchema.parse)

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .limit(1)

  if (!appointment) {
    throw createError({ statusCode: 404, message: 'Rendez-vous non trouvé' })
  }

  if (appointment.status === 'scheduled' || appointment.status === 'confirmed') {
    throw createError({ statusCode: 400, message: 'Impossible de modifier le prix avant le début de la séance' })
  }

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!organization?.pricing?.priceItems) {
    throw createError({ statusCode: 400, message: "Aucun tarif configuré pour l'organisation" })
  }

  const priceItem = organization.pricing.priceItems.find((item) => item.code === body.priceItemCode)

  if (!priceItem) {
    throw createError({
      statusCode: 400,
      message: `Le code tarif "${body.priceItemCode}" n'existe pas dans le catalogue de l'organisation`
    })
  }

  const snapshot = toPriceItemSnapshot(priceItem)
  const priceCents = priceItem.rateCent[appointment.location] ?? 0

  const [updated] = await db
    .update(appointments)
    .set({
      priceItem: snapshot,
      priceCents
    })
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Échec de la mise à jour' })
  }

  return successResponse(updated, 'Prix mis à jour avec succès')
})
