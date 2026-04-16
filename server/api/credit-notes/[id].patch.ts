import { eq, and } from 'drizzle-orm'
import { creditNotes } from '~~/server/database/schema'
import { creditNoteUpdateSchema } from '~~/shared/types/credit-note'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { userId, organizationId } = await requireAuthWithOrg(event)

  try {
    const creditNoteId = getRouterParam(event, 'id')
    if (!creditNoteId) {
      throw createError({ statusCode: 400, message: "ID de l'avoir requis" })
    }

    const body = await readValidatedBody(event, creditNoteUpdateSchema.parse)

    const existing = await db.query.creditNotes.findFirst({
      where: {
        id: { eq: creditNoteId },
        organizationId: { eq: organizationId }
      }
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Avoir introuvable' })
    }

    if (existing.status === 'cancelled') {
      throw createError({ statusCode: 400, message: 'Un avoir annulé ne peut pas être modifié' })
    }

    const updates: Record<string, any> = { updatedAt: new Date() }

    if (body.status === 'issued' && existing.status === 'draft') {
      updates.status = 'issued'
      updates.issuedAt = new Date()
      updates.issuedById = userId
    } else if (body.status === 'cancelled') {
      updates.status = 'cancelled'
      updates.cancelledAt = new Date()
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes
    }

    const [updated] = await db
      .update(creditNotes)
      .set(updates)
      .where(and(eq(creditNotes.id, creditNoteId), eq(creditNotes.organizationId, organizationId)))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 500, message: "Échec de la mise à jour de l'avoir" })
    }

    return updated
  } catch (error) {
    handleApiError(error, "Erreur lors de la mise à jour de l'avoir")
  }
})
