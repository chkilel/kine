export default defineNuxtRouteMiddleware(async (to) => {
  const isGuestRoute = to.meta.auth === true
  const isOnboardingRoute = to.path === '/onboarding'

  const { data } = await authClient.useSession(useFetch)

  const sessionData = data.value
  const isLoggedIn = !!sessionData
  const hasActiveOrganization = !!sessionData?.session?.activeOrganizationId

  if (isLoggedIn && isGuestRoute) {
    return navigateTo('/')
  }

  if (!isLoggedIn && !isGuestRoute) {
    return navigateTo('/login')
  }

  if (isLoggedIn && !isGuestRoute && !isOnboardingRoute && !hasActiveOrganization) {
    return navigateTo('/onboarding')
  }

  if (isLoggedIn && isOnboardingRoute && hasActiveOrganization) {
    return navigateTo('/')
  }
})
