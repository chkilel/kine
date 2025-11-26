export default defineNuxtRouteMiddleware(async (to) => {
  // ✅ `auth: true` means this route is for guests (login/register)
  const isGuestRoute = to.meta.auth === true

  // Skip middleware on server-side to avoid hydration issues
  if (import.meta.server) {
    return
  }

  // Get current session
  const { isAuthenticated, sessionData } = await useAuth()

  // Block navigation until session is determined
  // This prevents the protected page from flashing before redirect
  if (sessionData.pending.value) {
    // Show loading state or wait for session to resolve
    // We'll use a simple polling approach
    let attempts = 0
    const maxAttempts = 40 // 2 seconds max wait
    
    while (sessionData.pending.value && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
    }
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
