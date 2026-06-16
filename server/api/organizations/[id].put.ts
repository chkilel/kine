import { eq } from 'drizzle-orm'
import { organizations } from '~~/server/database/schema'

function validatePriceItems(priceItems: PriceItem[]) {
  const codes = priceItems.map((item) => item.code?.trim())
  const uniqueCodes = new Set(codes)

  if (codes.length !== uniqueCodes.size) {
    throw createError({
      statusCode: 400,
      message: 'Les codes de tarifs doivent être uniques'
    })
  }

  const defaultCount = codes.filter((c: string) => c === RESERVED_PRICE_ITEM_CODE).length
  if (defaultCount > 1) {
    throw createError({
      statusCode: 400,
      message: 'Le code "DEFAULT" est réservé et ne peut être utilisé qu\'une fois'
    })
  }

  const defaults = priceItems.filter((item) => item.isDefault)
  if (defaults.length > 1) {
    throw createError({
      statusCode: 400,
      message: 'Un seul tarif peut être défini par défaut'
    })
  }

  if (priceItems.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Au moins un tarif est requis'
    })
  }
}

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

    if (updateData.pricing?.priceItems) {
      validatePriceItems(updateData.pricing.priceItems)

      updateData.pricing.priceItems = updateData.pricing.priceItems.map((item) => ({
        ...item,
        rateCent: {
          clinic: currencyToCents(item.rateCent.clinic),
          home: currencyToCents(item.rateCent.home),
          telehealth: currencyToCents(item.rateCent.telehealth)
        }
      }))
    }

    if (updateData.pricing?.packages) {
      updateData.pricing.packages = updateData.pricing.packages.map((pkg) => ({
        ...pkg,
        priceCent: currencyToCents(pkg.priceCent)
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
