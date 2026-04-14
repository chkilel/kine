import { eq, and, isNull } from 'drizzle-orm'
import { insuranceCompanies } from '~~/server/database/schema'
import { insuranceCompanyCreateSchema } from '~~/shared/types/insurance-company'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuthWithOrg(event)

    const body = await readBody(event)
    const validatedData = await readValidatedBody(event, insuranceCompanyCreateSchema.parseAsync)

    const existingCompany = await db
      .select()
      .from(insuranceCompanies)
      .where(
        and(
          eq(insuranceCompanies.organizationId, organizationId),
          eq(insuranceCompanies.code, validatedData.code),
          isNull(insuranceCompanies.deletedAt)
        )
      )
      .get()

    if (existingCompany) {
      throw createError({
        statusCode: 400,
        statusMessage: "Une compagnie d'assurance avec ce code existe déjà"
      })
    }

    const [newCompany] = await db
      .insert(insuranceCompanies)
      .values({
        ...validatedData,
        organizationId
      })
      .returning()

    return newCompany
  } catch (error: unknown) {
    handleApiError(error, "Erreur lors de la création de la compagnie d'assurance")
  }
})
