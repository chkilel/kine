import type { PatientDocument, PatientDocumentUpdate } from '~~/shared/types/patient.types'

export function useDocuments(patientId: MaybeRefOrGetter<string>) {
  const requestFetch = useRequestFetch()
  const queryCache = useQueryCache()
  const toast = useToast()

  // Update Document mutation
  const updateDocumentMutation = useMutation({
    mutation: ({ documentId, data }: { documentId: string; data: PatientDocumentUpdate }) =>
      requestFetch<PatientDocument>(`/api/patients/${toValue(patientId)}/documents/${documentId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['documents', toValue(patientId)] })
      toast.add({
        title: 'Succès',
        description: 'Le document a été mis à jour avec succès.',
        color: 'success'
      })
    },
    onError: (error: any) => {
      console.error('Error updating document:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Impossible de mettre à jour le document',
        color: 'error'
      })
    }
  })

  // Delete Document mutation
  const deleteDocumentMutation = useMutation({
    mutation: (documentId: string) =>
      requestFetch(`/api/patients/${toValue(patientId)}/documents/${documentId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['documents', toValue(patientId)] })
      toast.add({
        title: 'Succès',
        description: 'Le document a été supprimé avec succès.',
        color: 'success'
      })
    },
    onError: (error: any) => {
      console.error('Error deleting document:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Impossible de supprimer le document',
        color: 'error'
      })
    }
  })

  return {
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,

    // Expose mutation states for UI - check if mutation is currently executing
    isUpdating: computed(() => updateDocumentMutation.isLoading.value),
    isDeleting: computed(() => deleteDocumentMutation.isLoading.value),

    // Expose raw mutations for advanced usage
    updateDocumentMutation,
    deleteDocumentMutation
  }
}
