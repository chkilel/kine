import { creditNotes } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const body = await readValidatedBody(event, creditNoteCreateSchema.parse)

    const refPrefix = 'CRN'
    const currentYear = new Date().getFullYear().toString()
    const existingCount = await db.select({ id: creditNotes.id }).from(creditNotes).limit(1)
    const nextNumber = (existingCount.length || 0) + 1
    const referenceNumber = `${refPrefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`

    const [creditNote] = await db
      .insert(creditNotes)
      .values({
        organizationId,
        patientId: body.patientId,
        type: body.type,
        status: 'draft',
        amountCents: body.amountCents,
        reason: body.reason,
        referenceNumber,
        notes: body.notes
      })
      .returning()

    if (!creditNote) {
      throw createError({ statusCode: 500, message: "Échec de la création de l'avoir" })
    }

    return creditNote
  } catch (error) {
    handleApiError(error, "Erreur lors de la création de l'avoir")
  }
})
