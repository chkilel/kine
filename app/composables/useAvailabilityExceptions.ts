export function useAvailabilityExceptions() {
  const toast = useToast()
  const requestFetch = useRequestFetch()

  // Query for fetching exceptions
  const {
    state,
    isLoading: loading,
    refetch: fetchExceptions
  } = useQuery({
    key: ['availability-exceptions'],
    query: () => requestFetch('/api/availability/exceptions')
  })

  // Mutation for creating exceptions
  const createExceptionMutation = useMutation({
    mutation: async (exceptionData: AvailabilityExceptionCreate) => {
      const response = await requestFetch('/api/availability/exceptions', {
        method: 'POST',
        body: exceptionData
      })

      return response
    },
    onSettled: (_, error) => {
      if (error) {
        const errorMessage =
          (error as any)?.data?.statusMessage || (error as any)?.message || "Impossible de créer l'exception"
        toast.add({
          title: 'Erreur',
          description: errorMessage,
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Exception créée',
          color: 'success'
        })
      }
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
    onSettled: (_, error) => {
      if (error) {
        const errorMessage =
          (error as any)?.data?.statusMessage || (error as any)?.message || "Impossible de mettre à jour l'exception"
        toast.add({
          title: 'Erreur',
          description: errorMessage,
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Exception mise à jour',
          color: 'success'
        })
      }
    }
  })

  // Mutation for deleting exceptions
  const deleteExceptionMutation = useMutation({
    mutation: async (id: string) => {
      await requestFetch(`/api/availability/exceptions/${id}`, {
        method: 'DELETE'
      })

      return true
    },
    onSettled: (_, error) => {
      if (error) {
        const errorMessage =
          (error as any)?.data?.statusMessage || (error as any)?.message || "Impossible de supprimer l'exception"
        toast.add({
          title: 'Erreur',
          description: errorMessage,
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Exception supprimée',
          color: 'success'
        })
      }
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
    exceptions: readonly(computed(() => state.value?.data?.data || [])),
    loading,
    error: readonly(computed(() => state.value?.error)),
    fetchExceptions,
    createException,
    updateException,
    deleteException
  }
}
