import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

/**
 * Query for fetching availability templates
 * @param therapistId - The therapist's ID to fetch templates for
 * @returns Query result with templates data and loading state
 */
/**
 * Query for fetching availability templates
 * @param therapistId - The therapist's ID to fetch templates for
 * @returns Query result with templates data and loading state
 */
const _useAvailabilityTemplatesList = (therapistId: MaybeRefOrGetter<string | undefined>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const id = toValue(therapistId)
      return id ? ['availability-templates', id] : ['availability-templates']
    },
    query: async () => {
      const resp = await requestFetch('/api/availability/templates', {
        query: { therapistId: toValue(therapistId) }
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    },
    enabled: () => !!toValue(therapistId)
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
    mutation: async (templateData: WeeklyAvailabilityTemplateCreate & { onSuccess?: () => void }) =>
      requestFetch('/api/availability/templates', {
        method: 'POST',
        body: templateData
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
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
        description: parseError(error, 'Échec de la création du modèle de disponibilité').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for updating an existing availability template
 * @returns Mutation with update functionality and error handling
 */

type UpdateAvailabilityTemplateParams = {
  id: string
  data: WeeklyAvailabilityTemplateUpdate
  onSuccess?: () => void
}
const _useUpdateAvailabilityTemplate = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ id, data }: UpdateAvailabilityTemplateParams) =>
      requestFetch(`/api/availability/templates/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
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
        description: parseError(error, 'Échec de la mise à jour du modèle de disponibilité').message,
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
    mutation: async ({ id, onSuccess }: { id: string; onSuccess?: () => void }) =>
      requestFetch(`/api/availability/templates/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
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
        description: parseError(error, 'Échec de la suppression du modèle de disponibilité').message,
        color: 'error'
      })
    }
  })
}

export const useAvailabilityTemplatesList = _useAvailabilityTemplatesList
export const useCreateAvailabilityTemplate = createSharedComposable(_useCreateAvailabilityTemplate)
export const useUpdateAvailabilityTemplate = createSharedComposable(_useUpdateAvailabilityTemplate)
export const useDeleteAvailabilityTemplate = createSharedComposable(_useDeleteAvailabilityTemplate)
