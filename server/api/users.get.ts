import { users } from '../database/schema'
import { useDrizzle } from '../utils/database'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const results = await db.select().from(users)
  console.log('✅ results', results)
  return results
})
