import { z } from 'zod'
import { eq, and, ne } from 'drizzle-orm'
import { consultations, patients, users, rooms } from '~~/server/database/schema'
import { consultationCreateSchema } from '~~/shared/types/consultation.type'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  if (!patientId) {
    throw createError({
      statusCode: 400,
      message: 'Patient ID is required'
    })
  }

  const { organizationId } = await requireAuth(event)

  try {
    const body = await readValidatedBody(event, consultationCreateSchema.parse)

    if (!body.roomId) {
      throw createError({
        statusCode: 400,
        message: 'Room is required for new consultations'
      })
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.organizationId, organizationId), eq(patients.id, patientId)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient not found'
      })
    }

    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, body.roomId), eq(rooms.organizationId, organizationId)))
      .limit(1)

    if (!room) {
      throw createError({
        statusCode: 404,
        message: 'Room not found'
      })
    }

    if (body.therapistId) {
      const [therapist] = await db.select().from(users).where(eq(users.id, body.therapistId)).limit(1)

      if (!therapist) {
        throw createError({
          statusCode: 400,
          message: 'Therapeute introuvable'
        })
      }
    }

    const consultationData = {
      ...body,
      organizationId: organizationId,
      date: body.date
    }

    const [newConsultation] = await db.insert(consultations).values(consultationData).returning()

    return {
      data: newConsultation,
      message: 'Consultation created successfully'
    }
  } catch (error: any) {
    console.error('Error creating consultation:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid consultation data',
        data: error.issues
      })
    }

    if (error.code === 'SQLITE_CONSTRAINT' || error.message?.includes('UNIQUE constraint')) {
      throw createError({
        statusCode: 409,
        message: 'Ce créneau est déjà réservé. Veuillez sélectionner une autre heure.'
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to create consultation'
    })
  }
})
