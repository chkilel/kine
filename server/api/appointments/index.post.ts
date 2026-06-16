import { eq, and } from 'drizzle-orm'
import { appointments, patients, users, rooms, treatmentPlans, organizations } from '~~/server/database/schema'
import { resolveAppointmentPrice } from '~~/server/utils/pricing'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const { organizationId } = await requireAuthWithOrg(event)
    const body = await readValidatedBody(event, appointmentCreateSchema.parse)

    if (!body.patientId) {
      throw createError({
        statusCode: 400,
        message: 'ID de patient requis'
      })
    }

    if (body.location === 'clinic' && !body.roomId) {
      throw createError({
        statusCode: 400,
        message: 'Une salle est requise pour les rendez-vous en clinique'
      })
    }

    if ((body.location === 'home' || body.location === 'telehealth') && body.roomId) {
      throw createError({
        statusCode: 400,
        message: `Une salle ne doit pas être fournie pour les rendez-vous à ${body.location === 'home' ? 'domicile' : 'téléconsultation'}`
      })
    }

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

    let linkedPlan: any = null
    if (body.treatmentPlanId) {
      ;[linkedPlan] = await db
        .select()
        .from(treatmentPlans)
        .where(and(eq(treatmentPlans.id, body.treatmentPlanId), eq(treatmentPlans.organizationId, organizationId)))
        .limit(1)
    }

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    const resolved = organization
      ? resolveAppointmentPrice({
          appointment: body as any,
          treatmentPlan: linkedPlan,
          organization
        })
      : { priceCents: 0, priceItem: null }


    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...body,
        organizationId,
        priceCents: resolved.priceCents,
        priceItem: resolved.priceItem
      })
      .returning()

    return successResponse(newAppointment, 'Rendez-vous créé avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création de la rendez-vous')
  }
})
