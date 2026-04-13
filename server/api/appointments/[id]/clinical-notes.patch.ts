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

  if (appointment.status === 'scheduled' && body.observations !== undefined) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de mettre à jour les observations avant le début de la séance'
    })
  }
  if (
    (appointment.status === 'scheduled' ||
      appointment.status === 'confirmed' ||
      appointment.status === 'in_progress') &&
    body.nextSteps !== undefined
  ) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de mettre à jour les prochaines étapes avant la fin de la séance'
    })
  }

  const [updated] = await db
    .update(appointments)
    .set({
      ...(body.primaryConcern !== undefined && { primaryConcern: body.primaryConcern }),
      ...(body.treatmentSummary !== undefined && { treatmentSummary: body.treatmentSummary }),
      ...(body.observations !== undefined && { observations: body.observations }),
      ...(body.nextSteps !== undefined && { nextSteps: body.nextSteps })
    })
    .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Échec de la mise à jour' })
  }

  return successResponse(updated, 'Notes cliniques mises à jour')
})
