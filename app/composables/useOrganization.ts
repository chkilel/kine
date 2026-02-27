import { createSharedComposable } from '@vueuse/core'
import { authClient } from '~/utils/auth-client'

/**
 * Composable for managing organization data and operations
 * @returns Organization data, computed properties, and methods
 */
const _useOrg = () => {
  // Organization data
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()

  // Computed properties for convenience
  const hasOrganizations = computed(() => (organizations.value?.data?.length || 0) > 0)

  return {
    // Raw data
    organizations,
    activeOrganization,

    // Convenience computed
    hasOrganizations,

    // Organization methods
    setActiveOrganization: authClient.organization.setActive,
    createOrganization: authClient.organization.create,
    checkSlug: authClient.organization.checkSlug
  }
}

const _useActiveOrganisation = () => {
  const activeOrganization = authClient.useActiveOrganization()
  const organization = computed(() => {
    return { ...activeOrganization.value.data } as Organization
  })

  const isPending = computed(() => {
    return activeOrganization.value.isPending
  })

  return { organization, isPending }
}

const _useFullOrganization = (organizationId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => ['organization', toValue(organizationId)],
    enabled: !!toValue(organizationId),
    query: async () => {
      return await requestFetch<Organization>(`/api/organizations/${toValue(organizationId)}`)
    }
  })
}

export const useOrganization = createSharedComposable(_useOrg)
export const useActiveOrganization = createSharedComposable(_useActiveOrganisation)
export const useFullOrganization = _useFullOrganization
