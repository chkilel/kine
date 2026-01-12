import { createSharedComposable } from '@vueuse/core'

export type OrganizationMember = User

/**
 * Query for fetching organization members
 * @returns Query result with members data and helper methods
 */
const _useOrganizationMembers = () => {
  const requestFetch = useRequestFetch()

  const { data, error, isLoading } = useQuery<OrganizationMember[]>({
    key: ['organization-members'],
    query: async () => requestFetch('/api/organizations/members')
  })

  const therapists = computed(() => data.value || [])

  /**
   * Get therapist by ID
   * @param id - Therapist ID to find
   * @returns Therapist object or undefined
   */
  const getTherapistById = (id: string | null): OrganizationMember | undefined => {
    return therapists.value.find((therapist) => therapist.id === id)
  }

  /**
   * Get therapist name by ID
   * @param id - Therapist ID to find
   * @returns Therapist name or "Non assigné"
   */
  const getTherapistName = (id: string | null): string => {
    const therapist = getTherapistById(id)
    return therapist ? therapist.name : 'Non assigné'
  }

  return {
    data: readonly(data),
    error: readonly(error),
    isLoading: readonly(isLoading),
    therapists,
    getTherapistById,
    getTherapistName
  }
}

export const useOrganizationMembers = createSharedComposable(_useOrganizationMembers)
