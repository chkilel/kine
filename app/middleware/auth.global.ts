export default defineNuxtRouteMiddleware(async (to) => {
  // ✅ `auth: true` means this route is for guests (login/register)
  const isGuestRoute = to.meta.auth === true

  const { data: sessionData } = await authClient.useSession(useFetch)

  const isLoggedIn = !!sessionData.value // isAuthenticated.value

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
