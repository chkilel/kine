import { authClient } from '~/utils/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  // ✅ `auth: true` means this route is for guests (login/register)
  const isGuestRoute = to.meta.auth === true
  const headers = import.meta.server ? useRequestHeaders() : undefined

  // Get current session
  const { data: session } = await authClient.useSession(useFetch)

  // Refresh session only if it's not yet defined (first load or stale)
  if (!session.value) {
    await authClient.getSession({
      fetchOptions: { headers }
    })
  }

  const isLoggedIn = !!session.value

  // 🧭 If user is logged in and tries to access a guest page → redirect home
  if (isLoggedIn && isGuestRoute) {
    return navigateTo('/')
  }

  // 🧭 If user is not logged in and tries to access a protected page → redirect login
  if (!isLoggedIn && !isGuestRoute) {
    return navigateTo('/login')
  }

  // ✅ Otherwise, allow navigation
})
