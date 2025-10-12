import { defineEventHandler } from 'h3'
import { useDB } from '../utils/db'
import { users } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
	const db = useDB()
	const result = await db.sql`SELECT * FROM users`
	return result
})