import { useDB } from '../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const stmt = await db.prepare('SELECT * FROM users')
  const results = await stmt.all()
  console.log('✅ results', results)
  return results
})
