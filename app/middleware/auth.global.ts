export default defineNuxtRouteMiddleware(async (to) => {
  const isGuestRoute = to.meta.auth === true
  const isOnboardingRoute = to.path === '/onboarding'
  const isOrgRoute = to.path.startsWith('/organizations')

  const { data } = await authClient.useSession(useFetch)
  const session = data.value?.session

  const isLoggedIn = !!session
  const activeOrgId = session?.activeOrganizationId
  const activeSlug = session?.activeOrganizationSlug
  const hasActiveOrganization = !!activeOrgId

  // --- NOT AUTHENTICATED ---
  if (!isLoggedIn) {
    if (!isGuestRoute) {
      return navigateTo('/login')
    }
    return
  }

  // --- ROOT REDIRECT ---
  if (to.path === '/') {
    return activeSlug ? navigateTo(`/${activeSlug}`) : navigateTo('/organizations')
  }

  // --- BLOCK GUEST ROUTES WHEN AUTHENTICATED ---
  if (isGuestRoute) {
    return activeSlug ? navigateTo(`/${activeSlug}`) : navigateTo('/organizations')
  }

  // --- ONBOARDING FLOW ---
  if (!hasActiveOrganization && !isOnboardingRoute && !isOrgRoute) {
    return navigateTo('/onboarding')
  }

  if (hasActiveOrganization && isOnboardingRoute) {
    return navigateTo(`/${activeSlug}`)
  }

  // --- ORGANIZATION SLUG NORMALIZATION ---
  if (!isOnboardingRoute && !isOrgRoute) {
    const routeSlug = to.params.slug

    if (routeSlug && routeSlug !== activeSlug) {
      const pathWithoutSlug = to.path.replace(/^\/[^/]+/, '')

      return navigateTo(`/${activeSlug}${pathWithoutSlug}`)
    }
  }
})

// OLD
/* export default defineNuxtRouteMiddleware(async (to) => {
  const isGuestRoute = to.meta.auth === true
  const isOnboardingRoute = to.path === '/onboarding'
  const isOrgRoute = to.path.startsWith('/organizations') || to.path === '/organizations'

  const { data } = await authClient.useSession(useFetch)

  const sessionData = data.value
  const isLoggedIn = !!sessionData
  const hasActiveOrganization = !!sessionData?.session?.activeOrganizationId
  const activeOrganizationSlug = sessionData?.session?.activeOrganizationSlug

  if (isLoggedIn && to.path === '/') {
    if (activeOrganizationSlug) {
      return navigateTo(`/${activeOrganizationSlug}`)
    }
    return navigateTo('/organizations')
  }

  if (isLoggedIn && isGuestRoute) {
    return navigateTo(`/${activeOrganizationSlug}`)
  }

  if (!isLoggedIn && !isGuestRoute) {
    return navigateTo('/login')
  }

  if (isLoggedIn && !isGuestRoute && !isOnboardingRoute && !isOrgRoute && !hasActiveOrganization) {
    return navigateTo('/onboarding')
  }

  if (isLoggedIn && isOnboardingRoute && hasActiveOrganization) {
    return navigateTo(`/${activeOrganizationSlug}`)
  }

  if (isLoggedIn && !isGuestRoute && !isOnboardingRoute && !isOrgRoute) {
    const routeSlug = to.params.slug
    if (routeSlug && routeSlug !== activeOrganizationSlug) {
      const pathWithoutSlug = to.path.replace(/^\/[^/]+/, '')
      return navigateTo(`/${activeOrganizationSlug}${pathWithoutSlug}`)
    }
  }
}) */
