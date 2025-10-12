import { users } from '../database/schema'
import { useDrizzle } from '../utils/database'

export default defineEventHandler(async (event) => {
  const requestBody = await readBody(event)
  const { name, email } = requestBody

  if (!name || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and email are required'
    })
  }

  const db = useDrizzle(event)
  const result = await db.insert(users).values({ name, email }).run()

  return result
})
