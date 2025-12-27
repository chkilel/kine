import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

/**
 * Query for fetching availability templates
 * @param therapistId - The therapist's ID to fetch templates for
 * @returns Query result with templates data and loading state
 */
const _useAvailabilityTemplatesList = (therapistId: MaybeRefOrGetter<string | undefined>) => {
  const requestFetch = useRequestFetch()
  const id = toValue(therapistId)

  return useQuery({
    key: () => (id ? ['availability-templates', id] : ['availability-templates']),
    query: async () => {
      const resp = await requestFetch('/api/availability/templates', {
        query: { therapistId: id }
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    },
    enabled: () => !!id
  })
}

/**
 * Mutation for creating a new availability template
 * @returns Mutation with create functionality and error handling
 */
const _useCreateAvailabilityTemplate = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (templateData: WeeklyAvailabilityTemplateCreate) =>
      requestFetch('/api/availability/templates', {
        method: 'POST',
        body: templateData
      }),
    onSuccess: () => {
      toast.add({
        title: 'Succès',
        description: 'Modèle de disponibilité créé',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['availability-templates'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error).message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for updating an existing availability template
 * @returns Mutation with update functionality and error handling
 */
const _useUpdateAvailabilityTemplate = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ id, data }: { id: string; data: WeeklyAvailabilityTemplateUpdate }) =>
      requestFetch(`/api/availability/templates/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      toast.add({
        title: 'Succès',
        description: 'Modèle mis à jour',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['availability-templates'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error).message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting an availability template
 * @returns Mutation with delete functionality and error handling
 */
const _useDeleteAvailabilityTemplate = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (id: string) =>
      requestFetch(`/api/availability/templates/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast.add({
        title: 'Succès',
        description: 'Modèle supprimé',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['availability-templates'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error).message,
        color: 'error'
      })
    }
  })
}

export const useAvailabilityTemplatesList = createSharedComposable(_useAvailabilityTemplatesList)
export const useCreateAvailabilityTemplate = createSharedComposable(_useCreateAvailabilityTemplate)
export const useUpdateAvailabilityTemplate = createSharedComposable(_useUpdateAvailabilityTemplate)
export const useDeleteAvailabilityTemplate = createSharedComposable(_useDeleteAvailabilityTemplate)
