import { eq, and } from 'drizzle-orm'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { treatmentSessions, appointments } from '~~/server/database/schema'

export async function handleAutoTransitionAndAppointmentUpdate(
  db: DrizzleD1Database,
  organizationId: string,
  sessionId: string,
  session: TreatmentSession,
  actionType: string
) {
  const [updated] = await db
    .select()
    .from(treatmentSessions)
    .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, sessionId)))
    .limit(1)

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'Treatment session not found after update'
    })
  }

  if (updated.status === 'finished' && updated.billed) {
    const [transitioned] = await db
      .update(treatmentSessions)
      .set({ status: 'completed' })
      .where(and(eq(treatmentSessions.organizationId, organizationId), eq(treatmentSessions.id, sessionId)))
      .returning()

    if (actionType === 'end') {
      await db
        .update(appointments)
        .set({ status: 'completed' })
        .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, session.appointmentId)))
    }

    return transitioned
  }

  if (actionType === 'end') {
    await db
      .update(appointments)
      .set({ status: 'completed' })
      .where(and(eq(appointments.organizationId, organizationId), eq(appointments.id, session.appointmentId)))
  }

  return updated
}
