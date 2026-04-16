import { eq, and, sql } from 'drizzle-orm'
import { creditNotes } from '~~/server/database/schema'
import { creditNoteQuerySchema } from '~~/shared/types/credit-note'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const query = getQuery(event)
    const { page, limit, patientId, status, type } = creditNoteQuerySchema.parse(query)

    const conditions = [eq(creditNotes.organizationId, organizationId)]
    if (patientId) conditions.push(eq(creditNotes.patientId, patientId))
    if (status) conditions.push(eq(creditNotes.status, status))
    if (type) conditions.push(eq(creditNotes.type, type))

    const whereClause = and(...conditions)

    const [countResult, data] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(creditNotes)
        .where(whereClause),
      db
        .select()
        .from(creditNotes)
        .where(whereClause)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(creditNotes.createdAt)
    ])

    const total = countResult[0]?.count ?? 0

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    handleApiError(error, 'Erreur lors de la récupération des avoirs')
  }
})
