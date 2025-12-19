import { eq, and, sql } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

// PUT /api/availability/templates/[id] - Update weekly availability template
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de modèle requis'
    })
  }

  // Get current user and organization from session
  const auth = createAuth(event)
  const session = await auth.api.getSession({
    headers: getHeaders(event) as any
  })

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  // Get active organization ID from session
  const activeOrganizationId = (session as Session)?.session?.activeOrganizationId

  if (!activeOrganizationId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès interdit'
    })
  }

  try {
    const body = await readValidatedBody(event, weeklyAvailabilityTemplateUpdateSchema.parse)

    // First, check if template exists and belongs to current user
    const [existingTemplate] = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
          eq(weeklyAvailabilityTemplates.userId, session.user.id)
        )
      )

    if (!existingTemplate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Modèle de disponibilité non trouvé'
      })
    }

    // If dayOfWeek is being changed, check for overlaps on the new day
    const newDayOfWeek = body.dayOfWeek || existingTemplate.dayOfWeek
    const newStartTime = body.startTime || existingTemplate.startTime
    const newEndTime = body.endTime || existingTemplate.endTime

    if (body.dayOfWeek || body.startTime || body.endTime) {
      // Check for overlapping templates on the same day (excluding current template)
      const conflictingTemplates = await db
        .select()
        .from(weeklyAvailabilityTemplates)
        .where(
          and(
            eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
            eq(weeklyAvailabilityTemplates.userId, session.user.id),
            eq(weeklyAvailabilityTemplates.dayOfWeek, newDayOfWeek),
            // Exclude current template from conflict check
            sql`${weeklyAvailabilityTemplates.id} != ${id}`
          )
        )

      // Validate no overlapping times with minimum gap
      for (const conflictingTemplate of conflictingTemplates) {
        if (
          checkTimeOverlap(
            conflictingTemplate.startTime,
            conflictingTemplate.endTime,
            newStartTime,
            newEndTime,
            MINIMUM_SESSION_GAP_MINUTES
          )
        ) {
          throw createError({
            statusCode: 400,
            statusMessage: `Conflit d'horaire avec un modèle existant le ${newDayOfWeek}. Veuillez respecter un écart minimum de ${MINIMUM_SESSION_GAP_MINUTES} minutes entre les plages horaires.`,
            data: {
              conflict: {
                existingTemplate: {
                  startTime: conflictingTemplate.startTime,
                  endTime: conflictingTemplate.endTime
                },
                newTemplate: {
                  startTime: newStartTime,
                  endTime: newEndTime
                }
              }
            }
          })
        }
      }
    }

    // Update template
    const [updatedTemplate] = await db
      .update(weeklyAvailabilityTemplates)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(weeklyAvailabilityTemplates.id, id),
          eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
          eq(weeklyAvailabilityTemplates.userId, session.user.id)
        )
      )
      .returning()

    return updatedTemplate
  } catch (error: unknown) {
    console.error('Error updating availability template:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw custom errors
      throw error
    }

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données de modèle invalides',
        data: (error as unknown as { errors: unknown }).errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible de mettre à jour le modèle de disponibilité'
    })
  }
})
