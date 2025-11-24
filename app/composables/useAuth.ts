import { createSharedComposable } from '@vueuse/core'
import { authClient } from '~/utils/auth-client'

const _useAuth = async () => {
  // Session data - resolve the promise
  const sessionData = await authClient.useSession(useFetch)

  // Organization data
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()

  // Extract the underlying session data and user
  const session = computed(() => sessionData.data.value?.session ?? null)
  const user = computed(() => sessionData.data.value?.user ?? null)

  // Computed properties for convenience
  const isAuthenticated = computed(() => !!sessionData.data.value)
  const hasOrganizations = computed(() => (organizations.value?.data?.length || 0) > 0)

  return {
    // Raw data
    sessionData, // The session composable from better-auth
    session, // The underlying session data
    user, // The user data
    organizations,
    activeOrganization,

    // Convenience computed
    isAuthenticated,
    hasOrganizations,

    // Auth methods
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    signUp: authClient.signUp,

    // Organization methods
    setActiveOrganization: authClient.organization.setActive,
    createOrganization: authClient.organization.create,
    checkSlug: authClient.organization.checkSlug
  }
}

export const useAuth = createSharedComposable(_useAuth)
