import { useAuth } from '~/composables/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  // Set in `definePageMeta` see login page
  const isAuthRoute = to.meta.auth === true

  const { session } = await useAuth()
  if (!session.value) {
    if (!isAuthRoute) {
      return navigateTo('/login')
    }
    return
  }

  if (session.value && isAuthRoute) {
    return navigateTo('/')
  }
})
