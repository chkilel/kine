import type { RouteLocationRaw } from 'vue-router'
import { authClient } from '~/utils/auth-client'

const _useOrgRoute = async () => {
  const route = useRoute()

  const sessionResult = await authClient.useSession(useFetch)
  const getOrgSlug = (): string | undefined => {
    if (route.params.slug) {
      return Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
    }

    const activeOrganizationSlug = sessionResult?.data?.value?.session.activeOrganizationSlug ?? undefined
    return activeOrganizationSlug
  }

  const orgPath = (path: string): string => {
    const slug = getOrgSlug()
    if (!slug) {
      return path
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const trimmedPath = cleanPath.endsWith('/') && cleanPath !== '/' ? cleanPath.slice(0, -1) : cleanPath
    return `/${slug}${trimmedPath}`
  }

  const orgNavigateTo = (pathOrRoute: string | RouteLocationRaw, options?: Parameters<typeof navigateTo>[1]) => {
    if (typeof pathOrRoute === 'string') {
      return navigateTo(orgPath(pathOrRoute), options)
    }
    if ('path' in pathOrRoute && typeof pathOrRoute.path === 'string') {
      return navigateTo(
        {
          ...pathOrRoute,
          path: orgPath(pathOrRoute.path)
        },
        options
      )
    }
    return navigateTo(pathOrRoute, options)
  }

  return {
    getOrgSlug,
    orgPath,
    orgNavigateTo
  }
}

export const useOrgRoute = _useOrgRoute
