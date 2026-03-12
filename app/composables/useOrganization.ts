import { createSharedComposable } from '@vueuse/core'

export const ORGANIZATION_KEYS = {
  root: ['organizations'] as const,
  single: (id: string) => [...ORGANIZATION_KEYS.root, id] as const
}

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

const _useFullOrganization = (organizationId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => ORGANIZATION_KEYS.single(toValue(organizationId)),
    enabled: !!toValue(organizationId),
    query: async () => {
      return await requestFetch<Organization>(`/api/organizations/${toValue(organizationId)}`)
    }
  })
}

type UpdateOrg = {
  organizationId: string
  organizationData: Partial<Organization>
}
const _useUpdateOrganization = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ organizationId, organizationData }: UpdateOrg) =>
      requestFetch<Organization>(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        body: organizationData
      }),
    onSuccess: (_, { organizationId, organizationData }) => {
      toast.add({
        title: 'Succès',
        description: `Organisation ${organizationData.name || ''} mise à jour avec succès`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: ORGANIZATION_KEYS.root, exact: false })
      queryCache.invalidateQueries({ key: ORGANIZATION_KEYS.single(organizationId) })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Échec de la mise à jour de l'organisation").message,
        color: 'error'
      })
    }
  })
}

export const useOrganization = createSharedComposable(_useOrg)
export const useFullOrganization = _useFullOrganization
export const useUpdateOrganization = _useUpdateOrganization
