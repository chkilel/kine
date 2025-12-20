import { eq, and } from 'drizzle-orm'
import { weeklyAvailabilityTemplates } from '~~/server/database/schema'

// POST /api/availability/templates - Create new weekly availability template
export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)

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
    const body = await readValidatedBody(event, weeklyAvailabilityTemplateCreateSchema.parse)

    // Check for overlapping templates on the same day
    const existingTemplates = await db
      .select()
      .from(weeklyAvailabilityTemplates)
      .where(
        and(
          eq(weeklyAvailabilityTemplates.organizationId, activeOrganizationId),
          eq(weeklyAvailabilityTemplates.userId, session.user.id),
          eq(weeklyAvailabilityTemplates.dayOfWeek, body.dayOfWeek)
        )
      )

    // Validate no overlapping times with minimum gap
    for (const existingTemplate of existingTemplates) {
      if (
        checkTimeOverlap(
          existingTemplate.startTime,
          existingTemplate.endTime,
          body.startTime,
          body.endTime,
          MINIMUM_CONSULTATION_GAP_MINUTES
        )
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: `Conflit d'horaire avec un modèle existant le ${body.dayOfWeek}. Veuillez respecter un écart minimum de ${MINIMUM_CONSULTATION_GAP_MINUTES} minutes entre les plages horaires.`,
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
        organizationId: activeOrganizationId,
        userId: session.user.id
      })
      .returning()

    return newTemplate
  } catch (error: unknown) {
    console.error('Error creating availability template:', error)

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
      statusMessage: 'Impossible de créer le modèle de disponibilité'
    })
  }
})
