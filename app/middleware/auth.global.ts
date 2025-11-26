export default defineNuxtRouteMiddleware(async (to) => {
  // ✅ `auth: true` means this route is for guests (login/register)
  const isGuestRoute = to.meta.auth === true

  // Get current session
  const { isAuthenticated, sessionData } = await useAuth()

  // Wait for session to be determined before making any decisions
  // This prevents the protected page from flashing
  if (sessionData.pending.value) {
    // Block navigation until session is resolved
    await new Promise<void>((resolve) => {
      const checkLoaded = () => {
        if (!sessionData.pending.value) {
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  const isLoggedIn = isAuthenticated.value

  // 🧭 If user is logged in and tries to access a guest page → redirect home
  if (isLoggedIn && isGuestRoute) {
    return navigateTo("/")
  }

  // 🧭 If user is not logged in and tries to access a protected page → redirect login
  if (!isLoggedIn && !isGuestRoute) {
    return navigateTo("/login")
  }

  // ✅ Otherwise, allow navigation
})
