import { eq, and, isNull } from 'drizzle-orm'
import { appointments, patients, users, rooms, treatmentPlans, insuranceCompanies } from '~~/server/database/schema'
import { calculateInsuranceCoverage } from '~~/server/utils/insurance-calculation'

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

    let insuranceCompanyId = body.insuranceCompanyId || null
    let expectedCoPayCents = null
    let expectedInsuranceCents = null

    if (body.treatmentPlanId) {
      const [treatmentPlan] = await db
        .select()
        .from(treatmentPlans)
        .where(eq(treatmentPlans.id, body.treatmentPlanId))
        .limit(1)

      if (!treatmentPlan) {
        throw createError({
          statusCode: 404,
          message: 'Plan de traitement introuvable'
        })
      }

      if (treatmentPlan.insuranceCompanyId) {
        if (insuranceCompanyId === null) {
          insuranceCompanyId = treatmentPlan.insuranceCompanyId
        } else if (insuranceCompanyId !== treatmentPlan.insuranceCompanyId) {
          throw createError({
            statusCode: 400,
            message: "Le contexte d'assurance doit correspondre à celui du plan de traitement"
          })
        }
      }
    }

    if (insuranceCompanyId) {
      const [insuranceCompany] = await db
        .select()
        .from(insuranceCompanies)
        .where(
          and(
            eq(insuranceCompanies.id, insuranceCompanyId),
            eq(insuranceCompanies.organizationId, organizationId),
            isNull(insuranceCompanies.deletedAt)
          )
        )
        .limit(1)

      if (!insuranceCompany) {
        throw createError({
          statusCode: 400,
          message: "Compagnie d'assurance introuvable"
        })
      }

      const coverage = calculateInsuranceCoverage(insuranceCompany)
      expectedCoPayCents = coverage.coPayCents
      expectedInsuranceCents = coverage.insuranceCents
    }

    const appointmentData = {
      ...body,
      organizationId,
      insuranceCompanyId,
      expectedCoPayCents,
      expectedInsuranceCents,
      coPayPaidCents: 0,
      insurancePaidCents: 0
    }

    const [newAppointment] = await db.insert(appointments).values(appointmentData).returning()

    return successResponse(newAppointment, 'Rendez-vous créé avec succès')
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création de la rendez-vous')
  }
})
