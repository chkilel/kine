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

    if (updateData.pricing?.rateCent) {
      if (updateData.pricing.rateCent.clinic !== undefined) {
        updateData.pricing.rateCent.clinic = currencyToCents(updateData.pricing.rateCent.clinic)
      }
      if (updateData.pricing.rateCent.home !== undefined) {
        updateData.pricing.rateCent.home = currencyToCents(updateData.pricing.rateCent.home)
      }
      if (updateData.pricing.rateCent.telehealth !== undefined) {
        updateData.pricing.rateCent.telehealth = currencyToCents(updateData.pricing.rateCent.telehealth)
      }
    }

    if (updateData.pricing?.packages) {
      updateData.pricing.packages = updateData.pricing.packages.map((pkg: any) => ({
        ...pkg,
        priceCent: pkg.priceCent !== undefined ? currencyToCents(pkg.priceCent) : undefined
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
