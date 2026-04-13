import { eq, and } from 'drizzle-orm'
import { appointments } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { organizationId } = await requireAuthWithOrg(event)

  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' })
  }

  const body = await readValidatedBody(event, startActionSchema.parse)

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .limit(1)

  if (!appointment) {
    throw createError({ statusCode: 404, message: 'Rendez-vous non trouvé' })
  }

  if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
    throw createError({
      statusCode: 400,
      message: 'Le rendez-vous doit être planifié ou confirmé pour démarrer'
    })
  }

  const [updated] = await db
    .update(appointments)
    .set({
      status: 'in_progress',
      actualStartTime: body.actualStartTime,
      painLevelBefore: body.painLevelBefore
    })
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Échec de la mise à jour du rendez-vous' })
  }

  return successResponse(updated, 'Session démarrée avec succès')
})
