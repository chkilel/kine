import { parseISO } from 'date-fns'

export function useAvailabilityTemplates() {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const queryCache = useQueryCache()

  // Query for fetching templates
  const {
    state,
    isLoading: loading,
    refetch: fetchTemplates
  } = useQuery({
    key: ['availability-templates'],
    query: () =>
      requestFetch('/api/availability/templates').then((resp) =>
        resp.map((item) => ({
          ...item,
          createdAt: parseISO(item.createdAt),
          updatedAt: parseISO(item.updatedAt)
        }))
      )
  })

  // Mutation for creating templates
  const createTemplateMutation = useMutation({
    mutation: async (templateData: WeeklyAvailabilityTemplateCreate) => {
      const response = await requestFetch('/api/availability/templates', {
        method: 'POST',
        body: templateData
      })

      return response
    },
    onSuccess() {
      queryCache.invalidateQueries({ key: ['availability-templates'] })
      toast.add({
        title: 'Succès',
        description: 'Modèle de disponibilité créé',
        color: 'success'
      })
    },
    onError(error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error).message,
        color: 'error'
      })
    }
  })

  // Mutation for updating templates
  const updateTemplateMutation = useMutation({
    mutation: async ({ id, data }: { id: string; data: WeeklyAvailabilityTemplateUpdate }) => {
      const response = await requestFetch(`/api/availability/templates/${id}`, {
        method: 'PUT',
        body: data
      })

      return response
    },
    onSuccess() {
      queryCache.invalidateQueries({ key: ['availability-templates'] })
      toast.add({
        title: 'Succès',
        description: 'Modèle mis à jour',
        color: 'success'
      })
    },
    onError(error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error).message,
        color: 'error'
      })
    }
  })

  // Mutation for deleting templates
  const deleteTemplateMutation = useMutation({
    mutation: async (id: string) => {
      await requestFetch(`/api/availability/templates/${id}`, { method: 'DELETE' })
      return true
    },
    onSuccess() {
      queryCache.invalidateQueries({ key: ['availability-templates'] })
      toast.add({
        title: 'Succès',
        description: 'Modèle supprimé',
        color: 'success'
      })
    },
    onError(error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error).message,
        color: 'error'
      })
    }
  })

  return {
    templates: readonly(computed(() => state.value?.data || [])),
    loading,
    error: readonly(computed(() => state.value?.error)),
    fetchTemplates,
    createTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation
  }
}
