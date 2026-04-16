import { eq } from 'drizzle-orm'
import { creditNoteAllocations, creditNotes } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const creditNoteId = getRouterParam(event, 'id')
    if (!creditNoteId) {
      throw createError({ statusCode: 400, message: "ID de l'avoir requis" })
    }

    const creditNote = await db.query.creditNotes.findFirst({
      where: {
        id: { eq: creditNoteId },
        organizationId: { eq: organizationId }
      },
      columns: { id: true }
    })

    if (!creditNote) {
      throw createError({ statusCode: 404, message: 'Avoir introuvable' })
    }

    const allocations = await db
      .select()
      .from(creditNoteAllocations)
      .where(eq(creditNoteAllocations.creditNoteId, creditNoteId))

    return allocations
  } catch (error) {
    handleApiError(error, "Erreur lors de la récupération des allocations de l'avoir")
  }
})
