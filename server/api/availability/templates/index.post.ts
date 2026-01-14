import { eq, and } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

// POST /api/availability/templates - Create new weekly availability template
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

  try {
    // 1. Require current user and organization from session
    const { userId, organizationId } = await requireAuth(event)

    // 2. Get active organization context
    const body = await readValidatedBody(event, weeklyAvailabilityTemplateCreateSchema.parse)

    // 3. Check for overlapping templates on the same day
    const existingTemplates = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.organizationId, organizationId),
          eq(weeklyAvailabilityTemplates.userId, userId),
          eq(weeklyAvailabilityTemplates.dayOfWeek, body.dayOfWeek)
        )
      )

    // Validate no overlapping times with minimum gap
    for (const existingTemplate of existingTemplates) {
      if (
        hasTimeConflict(
          existingTemplate.startTime,
          existingTemplate.endTime,
          body.startTime,
          body.endTime,
          MINIMUM_CONSULTATION_GAP_MINUTES
        )
      ) {
        throw createError({
          statusCode: 400,
          message: `Conflit d'horaire avec un modèle existant le ${body.dayOfWeek}. Veuillez respecter un écart minimum de ${MINIMUM_CONSULTATION_GAP_MINUTES} minutes entre les plages horaires.`,
          data: {
            conflict: {
              existingTemplate: {
                startTime: existingTemplate.startTime,
                endTime: existingTemplate.endTime
              },
              newTemplate: {
                startTime: body.startTime,
                endTime: body.endTime
              }
            }
          }
        })
      }
    }

    // Create new template with organization and user context
    const [newTemplate] = await db
      .insert(weeklyAvailabilityTemplates)
      .values({
        ...body,
        organizationId,
        userId
      })
      .returning()

    return newTemplate
  } catch (error: unknown) {
    handleApiError(error, 'Échec de la création du modèle de disponibilité hebdomadaire.')
  }
})
