export function useAvailabilityTemplates() {
  const toast = useToast()
  const requestFetch = useRequestFetch()

  // Query for fetching templates
  const {
    state,
    isLoading: loading,
    refetch: fetchTemplates
  } = useQuery({
    key: ['availability-templates'],
    query: () => requestFetch('/api/availability/templates')
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
    onSettled: (_, error) => {
      if (error) {
        const errorMessage =
          (error as any)?.data?.statusMessage || (error as any)?.message || 'Impossible de créer le modèle'
        toast.add({
          title: 'Erreur',
          description: errorMessage,
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Modèle de disponibilité créé',
          color: 'success'
        })
      }
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
    onSettled: (_, error) => {
      if (error) {
        const errorMessage =
          (error as any)?.data?.statusMessage || (error as any)?.message || 'Impossible de mettre à jour le modèle'
        toast.add({
          title: 'Erreur',
          description: errorMessage,
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Modèle mis à jour',
          color: 'success'
        })
      }
    }
  })

  // Mutation for deleting templates
  const deleteTemplateMutation = useMutation({
    mutation: async (id: string) => {
      await requestFetch(`/api/availability/templates/${id}`, {
        method: 'DELETE'
      })

      return true
    },
    onSettled: (_, error) => {
      if (error) {
        const errorMessage =
          (error as any)?.data?.statusMessage || (error as any)?.message || 'Impossible de supprimer le modèle'
        toast.add({
          title: 'Erreur',
          description: errorMessage,
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Modèle supprimé',
          color: 'success'
        })
      }
    }
  })

  // Convenience methods
  const createTemplate = (templateData: WeeklyAvailabilityTemplateCreate) => {
    return createTemplateMutation.mutate(templateData)
  }

  const updateTemplate = (id: string, templateData: WeeklyAvailabilityTemplateUpdate) => {
    return updateTemplateMutation.mutate({ id, data: templateData })
  }

  const deleteTemplate = (id: string) => {
    return deleteTemplateMutation.mutate(id)
  }

  return {
    templates: readonly(computed(() => state.value?.data?.data || [])),
    loading,
    error: readonly(computed(() => state.value?.error)),
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
}
