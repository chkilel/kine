import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireAuthWithOrg(event)

  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' })
  }

  const body = await readValidatedBody(event, updateClinicalNotesActionSchema.parse)

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .limit(1)

  if (!appointment) {
    throw createError({ statusCode: 404, message: 'Rendez-vous non trouvé' })
  }

  if (['scheduled', 'confirmed'].includes(appointment.status) && body.sessionNotes !== undefined) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de mettre à jour le compte rendu de séance avant le début de la séance'
    })
  }

  const [updated] = await db
    .update(appointments)
    .set({
      ...(body.primaryConcern !== undefined && { primaryConcern: body.primaryConcern }),
      ...(body.sessionNotes !== undefined && { sessionNotes: body.sessionNotes }),
      ...(body.observations !== undefined && { observations: body.observations })
    })
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Échec de la mise à jour' })
  }

  return successResponse(updated, 'Notes cliniques mises à jour')
})
