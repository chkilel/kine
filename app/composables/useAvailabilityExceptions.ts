import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'
import { type } from 'os'

/**
 * Query for fetching availability exceptions
 * @param therapistId - The therapist's ID to fetch exceptions for
 * @returns Query result with exceptions data and loading state
 */
/**
 * Query for fetching availability exceptions
 * @param therapistId - The therapist's ID to fetch exceptions for
 * @returns Query result with exceptions data and loading state
 */
const _useAvailabilityExceptionsList = (therapistId: MaybeRefOrGetter<string | undefined>) => {
  const requestFetch = useRequestFetch()
  const id = toValue(therapistId)

  return useQuery({
    key: () => (id ? ['availability-exceptions', id] : ['availability-exceptions']),
    query: async () => {
      const resp = await requestFetch('/api/availability/exceptions', {
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
 * Mutation for creating a new availability exception
 * @returns Mutation with create functionality and error handling
 */
const _useCreateAvailabilityException = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (exceptionData: AvailabilityExceptionCreate & { onSuccess?: () => void }) =>
      requestFetch('/api/availability/exceptions', {
        method: 'POST',
        body: exceptionData
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Exception créée',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['availability-exceptions'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible de créer l'exception").message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for updating an existing availability exception
 * @returns Mutation with update functionality and error handling
 */

type UpdateAvailabilityExceptionParams = {
  id: string
  data: AvailabilityExceptionUpdate
  onSuccess?: () => void
}
const _useUpdateAvailabilityException = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ id, data, onSuccess }: UpdateAvailabilityExceptionParams) =>
      requestFetch(`/api/availability/exceptions/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Exception mise à jour',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['availability-exceptions'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible de mettre à jour l'exception").message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting an availability exception
 * @returns Mutation with delete functionality and error handling
 */
const _useDeleteAvailabilityException = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ id, onSuccess }: { id: string; onSuccess?: () => void }) =>
      requestFetch(`/api/availability/exceptions/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Exception supprimée',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['availability-exceptions'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible de supprimer l'exception").message,
        color: 'error'
      })
    }
  })
}

export const useAvailabilityExceptionsList = createSharedComposable(_useAvailabilityExceptionsList)
export const useCreateAvailabilityException = createSharedComposable(_useCreateAvailabilityException)
export const useUpdateAvailabilityException = createSharedComposable(_useUpdateAvailabilityException)
export const useDeleteAvailabilityException = createSharedComposable(_useDeleteAvailabilityException)
