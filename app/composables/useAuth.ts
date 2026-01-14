import { createSharedComposable } from '@vueuse/core'
import { authClient } from '~/utils/auth-client'

/**
 * Composable for managing authentication state and operations
 * @returns Auth session, user data, and authentication methods
 */
const _useAuth = async () => {
  const sessionData = await authClient.useSession(useFetch)

  // Extract the underlying session data and user
  const session = computed(() => sessionData.data.value?.session ?? null)
  const user = computed(() => {
    const user = sessionData.data.value?.user
    return user
      ? {
          ...user,
          phoneNumbers: user.phoneNumbers as PhoneEntry[] // Phone numbers type casting
        }
      : null
  })

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
