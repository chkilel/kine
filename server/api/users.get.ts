import { defineEventHandler } from 'h3'
import { useDrizzle } from '../utils/db'
import { users } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle()
  const result = await db.select().from(users).all()
  return result
})
