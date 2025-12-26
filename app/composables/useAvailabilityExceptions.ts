import { parseISO } from 'date-fns'

export function useAvailabilityExceptions() {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const queryCache = useQueryCache()

  // Query for fetching exceptions
  const {
    state,
    isLoading: loading,
    refetch: fetchExceptions
  } = useQuery({
    key: ['availability-exceptions'],
    query: () =>
      requestFetch('/api/availability/exceptions').then((resp) =>
        resp?.map((item) => ({
          ...item,
          createdAt: parseISO(item.createdAt),
          updatedAt: parseISO(item.updatedAt)
        }))
      )
  })

  // Mutation for creating exceptions
  const createExceptionMutation = useMutation({
    mutation: async (exceptionData: AvailabilityExceptionCreate) => {
      const response = await requestFetch('/api/availability/exceptions', { method: 'POST', body: exceptionData })
      return response
    },
    onSuccess() {
      queryCache.invalidateQueries({ key: ['availability-exceptions'] })
      toast.add({
        title: 'Succès',
        description: 'Exception créée',
        color: 'success'
      })
    },
    onError(error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible de créer l'exception").message,
        color: 'error'
      })
    }
  })

  // Mutation for updating exceptions
  const updateExceptionMutation = useMutation({
    mutation: async ({ id, data }: { id: string; data: AvailabilityExceptionUpdate }) => {
      const response = await requestFetch(`/api/availability/exceptions/${id}`, {
        method: 'PUT',
        body: data
      })

      return response
    },
    onSuccess() {
      queryCache.invalidateQueries({ key: ['availability-exceptions'] })
      toast.add({
        title: 'Succès',
        description: 'Exception mise à jour',
        color: 'success'
      })
    },
    onError(error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible de mettre à jour l'exception").message,
        color: 'error'
      })
    }
  })

  // Mutation for deleting exceptions
  const deleteExceptionMutation = useMutation({
    mutation: async (id: string) => {
      await requestFetch(`/api/availability/exceptions/${id}`, { method: 'DELETE' })
      return true
    },
    onSuccess() {
      queryCache.invalidateQueries({ key: ['availability-exceptions'] })
      toast.add({
        title: 'Succès',
        description: 'Exception supprimée',
        color: 'success'
      })
    },
    onError(error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible de supprimer l'exception").message,
        color: 'error'
      })
    }
  })

  // Convenience methods
  const createException = (exceptionData: AvailabilityExceptionCreate) => {
    return createExceptionMutation.mutate(exceptionData)
  }

  const updateException = (id: string, exceptionData: AvailabilityExceptionUpdate) => {
    return updateExceptionMutation.mutate({ id, data: exceptionData })
  }

  const deleteException = (id: string) => {
    return deleteExceptionMutation.mutate(id)
  }

  return {
    exceptions: readonly(computed(() => state.value?.data || [])),
    loading,
    error: readonly(computed(() => state.value?.error)),
    fetchExceptions,
    createException,
    isCreating: createExceptionMutation.isLoading,
    updateException,
    isUpdating: updateExceptionMutation.isLoading,
    deleteException,
    isDeleting: deleteExceptionMutation.isLoading
  }
}
