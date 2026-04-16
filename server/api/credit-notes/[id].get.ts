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
      with: {
        patient: {
          columns: { id: true, firstName: true, lastName: true }
        },
        issuedBy: {
          columns: { id: true, firstName: true, lastName: true }
        },
        allocations: true
      }
    })

    if (!creditNote) {
      throw createError({ statusCode: 404, message: 'Avoir introuvable' })
    }

    return creditNote
  } catch (error) {
    handleApiError(error, "Erreur lors de la récupération de l'avoir")
  }
})
