// composables/auth.ts
import type { ClientOptions, InferSessionFromClient, InferUserFromClient } from 'better-auth/client'
import { createAuthClient } from 'better-auth/client'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { defu } from 'defu'
import type { RouteLocationRaw } from 'vue-router'

type Auth = ReturnType<typeof createAuth>

interface RuntimeAuthConfig {
  redirectUserTo: RouteLocationRaw | string
  redirectGuestTo: RouteLocationRaw | string
}

export async function useAuth() {
  const url = useRequestURL()
  const headers = import.meta.server ? useRequestHeaders() : undefined

  const client = createAuthClient({
    baseURL: url.origin,

    plugins: [inferAdditionalFields<Auth>()],
    fetchOptions: {
      headers,
    },
  })

  const options = defu(useRuntimeConfig().public.auth as Partial<RuntimeAuthConfig>, {
    redirectUserTo: '/',
    redirectGuestTo: '/',
  })

  const session = useState<InferSessionFromClient<ClientOptions> | null>('auth:session', () => null)
  const user = useState<InferUserFromClient<ClientOptions> | null>('auth:user', () => null)
  const sessionFetching = import.meta.server ? ref(false) : useState('auth:sessionFetching', () => false)
  const sessionInitialized = useState('auth:sessionInitialized', () => false)

  const fetchSession = async () => {
    if (sessionFetching.value) {
      console.log('already fetching session')
      return { session: session.value, user: user.value }
    }

    sessionFetching.value = true

    try {
      const { data } = await client.getSession({
        fetchOptions: {
          headers,
        },
      })

      session.value = data?.session || null
      user.value = data?.user || null
      sessionInitialized.value = true

      return data
    } catch (error) {
      console.error('Error fetching session:', error)
      session.value = null
      user.value = null
      return { session: null, user: null }
    } finally {
      sessionFetching.value = false
    }
  }

  // Initialize session on server-side if not already done
  if (import.meta.server && !sessionInitialized.value) {
    await fetchSession()
  }

  // Initialize session on client-side if not already done
  if (import.meta.client && !sessionInitialized.value) {
    await fetchSession()
  }

  // Client-side session listener
  if (import.meta.client) {
    client.$store.listen('$sessionSignal', async (signal) => {
      if (!signal) return
      await fetchSession()
    })
  }

  return {
    session,
    user,
    loggedIn: computed(() => !!session.value),
    sessionInitialized,
    signIn: client.signIn,
    signUp: client.signUp,
    async signOut({ redirectTo }: { redirectTo?: RouteLocationRaw } = {}) {
      const res = await client.signOut()
      session.value = null
      user.value = null
      if (redirectTo) {
        await navigateTo(redirectTo)
      }
      return res
    },
    options,
    fetchSession,
    client,
  }
}
