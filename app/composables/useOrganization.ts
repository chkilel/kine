import { createSharedComposable } from '@vueuse/core'
import { authClient } from '~/utils/auth-client'

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

export const useOrganization = createSharedComposable(_useOrg)
