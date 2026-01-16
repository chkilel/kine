import { eq, and, asc } from 'drizzle-orm'
import { z } from 'zod'
import { consultations, patients, rooms } from '~~/server/database/schema'


const therapistConsultationsQuerySchema = z.object({
  date: calendarDateSchema
})

export type TherapistConsultationsQuery = z.infer<typeof therapistConsultationsQuerySchema>

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { userId: therapistId, organizationId } = await requireAuth(event)

    const validatedQuery = await getValidatedQuery(event, therapistConsultationsQuerySchema.parse)

    const consultationsList = await db
      .select({
        id: consultations.id,
        patientId: consultations.patientId,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        treatmentPlanId: consultations.treatmentPlanId,
        roomId: consultations.roomId,
        roomName: rooms.name,
        date: consultations.date,
        startTime: consultations.startTime,
        endTime: consultations.endTime,
        duration: consultations.duration,
        type: consultations.type,
        status: consultations.status,
        chiefComplaint: consultations.chiefComplaint,
        location: consultations.location
      })
      .from(consultations)
      .innerJoin(patients, and(eq(consultations.patientId, patients.id), eq(patients.organizationId, organizationId)))
      .leftJoin(rooms, eq(consultations.roomId, rooms.id))
      .where(
        and(
          eq(consultations.organizationId, organizationId),
          eq(consultations.therapistId, therapistId),
          eq(consultations.date, validatedQuery.date)
        )
      )
      .orderBy(asc(consultations.startTime))

    return consultationsList.map((c) => ({
      ...c,
      patientName: formatFullName({ firstName: c.patientFirstName, lastName: c.patientLastName })
    }))
  } catch (error: unknown) {
    handleApiError(error, 'Erreur lors de la récupération des consultations du thérapeute')
  }
})
