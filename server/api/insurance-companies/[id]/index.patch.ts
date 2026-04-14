import { eq, and } from 'drizzle-orm'
import { insuranceCompanies } from '~~/server/database/schema'
import { insuranceCompanyUpdateSchema } from '~~/shared/types/insurance-company'

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

    const body = await readBody(event)
    const validatedData = await readValidatedBody(event, insuranceCompanyUpdateSchema.parseAsync)

    if (validatedData.code && validatedData.code !== existingCompany.code) {
      const duplicateCode = await db
        .select()
        .from(insuranceCompanies)
        .where(
          and(eq(insuranceCompanies.organizationId, organizationId), eq(insuranceCompanies.code, validatedData.code))
        )
        .get()

      if (duplicateCode) {
        throw createError({
          statusCode: 400,
          statusMessage: "Une compagnie d'assurance avec ce code existe déjà"
        })
      }
    }

    const [updatedCompany] = await db
      .update(insuranceCompanies)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(insuranceCompanies.id, companyId))
      .returning()

    return updatedCompany
  } catch (error: unknown) {
    handleApiError(error, "Erreur lors de la mise à jour de la compagnie d'assurance")
  }
})
