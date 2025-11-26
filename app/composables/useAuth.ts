import { createSharedComposable } from '@vueuse/core'
import { authClient } from '~/utils/auth-client'

const _useAuth = async () => {
  // Session data - resolve the promise
  const sessionData = await authClient.useSession(useFetch)

  // Extract the underlying session data and user
  const session = computed(() => sessionData.data.value?.session ?? null)
  const user = computed(() => sessionData.data.value?.user ?? null)

  // Computed properties for convenience
  const isAuthenticated = computed(() => !!sessionData.data.value)

  return {
    // Raw data
    sessionData, // The session composable from better-auth
    session, // The underlying session data
    user, // The user data

    // Convenience computed
    isAuthenticated,

    // Auth methods
    signIn: authClient.signIn,
    signOut: authClient.signOut,
    signUp: authClient.signUp
  }
}

export const useAuth = createSharedComposable(_useAuth)
