import { eq, and } from 'drizzle-orm'
import { consultations, patients, users, rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const patientId = getRouterParam(event, 'id')

  try {
    if (!patientId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient requis'
      })
    }

    const { organizationId } = await requireAuth(event)
    const body = await readValidatedBody(event, consultationCreateSchema.parse)

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

    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.organizationId, organizationId), eq(patients.id, patientId)))
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    if (body.roomId) {
      const [room] = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.id, body.roomId), eq(rooms.organizationId, organizationId)))
        .limit(1)

      if (!room) {
        throw createError({
          statusCode: 404,
          message: 'Salle introuvable'
        })
      }
    }

    if (body.therapistId) {
      const [therapist] = await db.select().from(users).where(eq(users.id, body.therapistId)).limit(1)

      if (!therapist) {
        throw createError({
          statusCode: 400,
          message: 'Thérapeute introuvable'
        })
      }
    }

    const consultationData = {
      ...body,
      organizationId,
      date: body.date
    }

    const [newConsultation] = await db.insert(consultations).values(consultationData).returning()

    return successResponse(newConsultation, 'Consultation créée avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création de la consultation')
  }
})
