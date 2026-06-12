import { treatmentPlans, patients, organizations } from '~~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getDefaultPriceItem } from '~~/server/utils/pricing'

// POST /api/treatment-plans - Create new treatment plan
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    const body = await readValidatedBody(event, treatmentPlanCreateSchema.parse)

    const { organizationId } = await requireAuthWithOrg(event)

    const [patient] = await db
      .select()
      .from(patients)
      .where(
        and(eq(patients.id, body.patientId), eq(patients.organizationId, organizationId), isNull(patients.deletedAt))
      )
      .limit(1)

    if (!patient) {
      throw createError({
        statusCode: 404,
        message: 'Patient introuvable'
      })
    }

    let pricing: RateCent

    // Determine pricing: use provided pricing or fall back to org defaults
    if (body.pricing) {
      pricing = body.pricing
    } else {
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)

      if (!organization) {
        throw createError({
          statusCode: 404,
          message: 'Organisation introuvable'
        })
      }
      const defaultItem = getDefaultPriceItem(organization)
      if (!defaultItem?.rateCent) {
        throw createError({
          statusCode: 400,
          message: "Aucun tarif par défaut configuré pour l'organisation"
        })
      }
      pricing = defaultItem.rateCent
    }

    const validatedData = {
      ...body,
      organizationId,
      pricing
    }

    // Create treatment plan
    const [newTreatmentPlan] = await db.insert(treatmentPlans).values(validatedData).returning()

    return newTreatmentPlan
  } catch (error) {
    handleApiError(error, 'Erreur lors de la création du plan de traitement')
  }
})
