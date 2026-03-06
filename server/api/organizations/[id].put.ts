import { eq } from 'drizzle-orm'
import { organizations } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const id = getRouterParam(event, 'id')

  try {
    await requireAuth(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID d'organisation requis"
      })
    }

    const body = await readValidatedBody(event, updateOrganizationSchema.parse)

    const [updatedOrganization] = await db.update(organizations).set(body).where(eq(organizations.id, id)).returning()

    if (!updatedOrganization) {
      throw createError({
        statusCode: 404,
        message: 'Organisation introuvable'
      })
    }

    return successResponse(updatedOrganization, 'Organisation mise à jour avec succès')
  } catch (error) {
    handleApiError(error, "Échec de la mise à jour de l'organisation")
  }
})
