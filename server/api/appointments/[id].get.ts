import { eq, and, getColumns } from 'drizzle-orm'
import { appointments, rooms, treatmentSessions, treatmentPlans } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID de rendez-vous requis'
      })
    }

    const { organizationId } = await requireAuthWithOrg(event)

    const [appointmentData] = await db
      .select({
        ...getColumns(appointments),
        roomName: rooms.name,
        treatmentSession: treatmentSessions,
        treatmentPlan: {
          id: treatmentPlans.id,
          title: treatmentPlans.title,
          pricing: treatmentPlans.pricing
        }
      })
      .from(appointments)
      .leftJoin(rooms, eq(appointments.roomId, rooms.id))
      .leftJoin(treatmentSessions, eq(appointments.id, treatmentSessions.appointmentId))
      .leftJoin(treatmentPlans, eq(appointments.treatmentPlanId, treatmentPlans.id))
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, id)))
      .limit(1)

    if (!appointmentData) {
      throw createError({
        statusCode: 404,
        message: 'Rendez-vous introuvable'
      })
    }

    return appointmentData
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la récupération de la rendez-vous')
  }
})
