import { createAuth } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  const auth = createAuth(event)
  return auth.handler(toWebRequest(event))
})
