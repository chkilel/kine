export default defineEventHandler(async (event) => {
  const requestBody = await readBody(event)
  const { name, email } = requestBody

  if (!name || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and email are required'
    })
  }

  const db = useDB(event)
  const result = await db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind(name, email).run()

  return { success: true, result }
})
