import { eq } from 'drizzle-orm'
import { organizations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    await requireAuthWithOrg(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID d'organisation requis"
      })
    }

    const body = await readValidatedBody(event, updateOrganizationSchema.parse)

    const updateData = { ...body }

    if (updateData.pricing?.sessionRates) {
      if (updateData.pricing.sessionRates.clinic !== undefined) {
        updateData.pricing.sessionRates.clinic = currencyToCents(updateData.pricing.sessionRates.clinic)
      }
      if (updateData.pricing.sessionRates.home !== undefined) {
        updateData.pricing.sessionRates.home = currencyToCents(updateData.pricing.sessionRates.home)
      }
      if (updateData.pricing.sessionRates.telehealth !== undefined) {
        updateData.pricing.sessionRates.telehealth = currencyToCents(updateData.pricing.sessionRates.telehealth)
      }
    }

    if (updateData.pricing?.packages) {
      updateData.pricing.packages = updateData.pricing.packages.map((pkg: any) => ({
        ...pkg,
        price: pkg.price !== undefined ? currencyToCents(pkg.price) : undefined
      }))
    }

    const [updatedOrganization] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning()

    if (!updatedOrganization) {
      throw createError({
        statusCode: 404,
        message: 'Organisation introuvable'
      })
    }

    return successResponse(updatedOrganization, 'Organisation mise à jour avec succès')
  } catch (error) {
    handleApiError(error, "Échec de la mise à jour de l'organisation")
  }
})
