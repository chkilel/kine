import { eq, and } from 'drizzle-orm'
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

    const existingCompany = await db
      .select()
      .from(insuranceCompanies)
      .where(and(eq(insuranceCompanies.id, companyId), eq(insuranceCompanies.organizationId, organizationId)))
      .get()

    if (!existingCompany) {
      throw createError({
        statusCode: 404,
        statusMessage: "Compagnie d'assurance non trouvée"
      })
    }

    const [deletedCompany] = await db
      .update(insuranceCompanies)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(insuranceCompanies.id, companyId))
      .returning()

    return deletedCompany
  } catch (error: unknown) {
    handleApiError(error, "Erreur lors de la suppression de la compagnie d'assurance")
  }
})
