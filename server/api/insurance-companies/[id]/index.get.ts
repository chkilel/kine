import { eq, and, isNull } from 'drizzle-orm'
import { insuranceCompanies } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const companyId = getRouterParam(event, 'id')

  if (!companyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company ID is required'
    })
  }

  try {
    const { organizationId } = await requireAuthWithOrg(event)

    const company = await db
      .select()
      .from(insuranceCompanies)
      .where(and(eq(insuranceCompanies.id, companyId), eq(insuranceCompanies.organizationId, organizationId)))
      .get()

    if (!company) {
      throw createError({
        statusCode: 404,
        statusMessage: "Compagnie d'assurance non trouvée"
      })
    }

    return company
  } catch (error: unknown) {
    handleApiError(error, "Erreur lors de la récupération de la compagnie d'assurance")
  }
})
