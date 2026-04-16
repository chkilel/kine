import { eq } from 'drizzle-orm'
import { creditNoteAllocations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const creditNoteId = getRouterParam(event, 'id')
    if (!creditNoteId) {
      throw createError({ statusCode: 400, message: "ID de l'avoir requis" })
    }

    const body = await readValidatedBody(event, creditNoteAllocationCreateSchema.parse)

    const creditNote = await db.query.creditNotes.findFirst({
      where: {
        id: { eq: creditNoteId },
        organizationId: { eq: organizationId }
      }
    })

    if (!creditNote) {
      throw createError({ statusCode: 404, message: 'Avoir introuvable' })
    }

    if (creditNote.status !== 'issued') {
      throw createError({ statusCode: 400, message: 'Seuls les avoirs émis peuvent être alloués' })
    }

    const existingAllocations = await db
      .select({ amountCents: creditNoteAllocations.amountCents })
      .from(creditNoteAllocations)
      .where(eq(creditNoteAllocations.creditNoteId, creditNoteId))

    const totalAllocated = existingAllocations.reduce((sum, a) => sum + a.amountCents, 0)
    const remaining = creditNote.amountCents - totalAllocated

    if (body.amountCents > remaining) {
      throw createError({
        statusCode: 400,
        message: `Le montant de l'allocation (${body.amountCents}) dépasse le solde restant de l'avoir (${remaining})`
      })
    }

    const [allocation] = await db
      .insert(creditNoteAllocations)
      .values({
        creditNoteId,
        invoiceId: body.invoiceId,
        amountCents: body.amountCents
      })
      .returning()

    return allocation
  } catch (error) {
    handleApiError(error, "Erreur lors de l'allocation de l'avoir")
  }
})
