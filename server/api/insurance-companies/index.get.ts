import { eq, and, desc, or, isNull, count, like } from 'drizzle-orm'
import { insuranceCompanies } from '~~/server/database/schema'
import { insuranceCompanyQuerySchema } from '~~/shared/types/insurance-company'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuthWithOrg(event)

    const validatedQuery = await getValidatedQuery(event, insuranceCompanyQuerySchema.parse)

    const filters = [eq(insuranceCompanies.organizationId, organizationId), isNull(insuranceCompanies.deletedAt)]

    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`
      filters.push(or(like(insuranceCompanies.name, searchTerm), like(insuranceCompanies.code, searchTerm))!)
    }

    if (validatedQuery.status) {
      filters.push(eq(insuranceCompanies.status, validatedQuery.status))
    }

    const limit = validatedQuery.limit
    const offset = (validatedQuery.page - 1) * limit

    const totalCountResult = await db
      .select({ count: count() })
      .from(insuranceCompanies)
      .where(and(...filters))

    const total = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    const companiesList = await db
      .select()
      .from(insuranceCompanies)
      .where(and(...filters))
      .orderBy(desc(insuranceCompanies.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: companiesList,
      pagination: {
        total,
        page: validatedQuery.page,
        limit,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1
      }
    }
  } catch (error: unknown) {
    handleApiError(error, "Erreur lors de la récupération des compagnies d'assurance")
  }
})
