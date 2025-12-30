import { rooms } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  try {
    const body = await readValidatedBody(event, roomCreateSchema.parse)

    await requireAuth(event)
    const { organizationId } = await requireAuth(event)

    const [newRoom] = await db
      .insert(rooms)
      .values({
        ...body,
        organizationId,
        prm: body.prm ? 1 : 0
      })
      .returning()

    return newRoom
  } catch (error) {
    handleApiError(error)
  }
})
