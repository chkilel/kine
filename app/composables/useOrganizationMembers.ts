import { createSharedComposable } from '@vueuse/core'

export type OrganizationMember = User

const _useOrganizationMembers = () => {
  const requestFetch = useRequestFetch()

  const { data, error, isLoading } = useQuery<OrganizationMember[]>({
    key: ['organization-members'],
    query: async () => requestFetch('/api/organizations/members')
  })

  const therapists = computed(() => data.value || [])

  const getTherapistById = (id: string | null): OrganizationMember | undefined => {
    return therapists.value.find((therapist) => therapist.id === id)
  }

  const getTherapistName = (id: string | null): string => {
    const therapist = getTherapistById(id)
    return therapist ? therapist.name : 'Non assigné'
  }

  return {
    data,
    error,
    isLoading,
    therapists,
    getTherapistById,
    getTherapistName
  }
}

export const useOrganizationMembers = createSharedComposable(_useOrganizationMembers)
