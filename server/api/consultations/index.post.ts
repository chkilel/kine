import { eq, and } from 'drizzle-orm'
import { appointments, patients, users, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, appointmentCreateSchema.parse)

    // Validate room requirement
    if (body.location === 'clinic' && !body.roomId) {
      throw createError({
        statusCode: 400,
        message: 'Une salle est requise pour les consultations en clinique'
      })
    }

    if ((body.location === 'home' || body.location === 'telehealth') && body.roomId) {
      throw createError({
        statusCode: 400,
        message: `Une salle ne doit pas être fournie pour les consultations à ${body.location === 'home' ? 'domicile' : 'téléconsultation'}`
      })
    }

    // Validate patient
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.organizationId, organizationId), eq(patients.id, body.patientId)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    // Validate room (if provided)
    if (body.roomId) {
      const [room] = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.organizationId, organizationId), eq(rooms.id, body.roomId)))
        .limit(1)

      if (!room) {
        throw createError({
          statusCode: 404,
          message: 'Salle introuvable'
        })
      }
    }

    // Validate therapist (optional)
    if (body.therapistId) {
      const [therapist] = await db.select().from(users).where(eq(users.id, body.therapistId)).limit(1)

      if (!therapist) {
        throw createError({
          statusCode: 404,
          message: 'Thérapeute introuvable'
        })
      }
    }

    // Create appointment (consultation not created yet)
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...body,
        organizationId,
        status: 'scheduled'
      })
      .returning()

    return successResponse(newAppointment, 'Rendez-vous créé')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création du rendez-vous')
  }
})
