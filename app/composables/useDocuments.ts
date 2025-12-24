/**
 * Query for fetching documents for a patient
 */
const _useDocumentsList = (patientId: MaybeRefOrGetter<string>, treatmentPlanId?: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  const parsedPatientId = toValue(patientId)
  const parsedTreatmentPlanId = toValue(treatmentPlanId)

  return useQuery({
    key: () => ['documents', parsedPatientId, parsedTreatmentPlanId || 'all'],
    query: async () => {
      const params = parsedTreatmentPlanId ? `?treatmentPlanId=${parsedTreatmentPlanId}` : ''
      return requestFetch<PatientDocument[]>(`/api/patients/${parsedPatientId}/documents${params}`)
    },
    enabled: () => !!parsedPatientId
  })
}

/**
 * Query for getting document download URL
 */
const _useDocumentDownloadUrl = (patientId: MaybeRefOrGetter<string>, documentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  const parsedPatientId = toValue(patientId)
  const parsedDocumentId = toValue(documentId)

  return useQuery({
    key: () => ['document-download-url', parsedPatientId, parsedDocumentId],
    query: async () => {
      return requestFetch<{ downloadUrl: string }>(`/api/patients/${parsedPatientId}/documents/${parsedDocumentId}`)
    },
    enabled: () => !!parsedPatientId && !!parsedDocumentId
  })
}

/**
 * Mutation for updating a document
 */
const _useUpdateDocument = (patientId: MaybeRefOrGetter<string>) => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()
  const parsedPatientId = toValue(patientId)

  return useMutation({
    mutation: ({ documentId, data }: { documentId: string; data: PatientDocumentUpdate }) =>
      requestFetch<PatientDocument>(`/api/patients/${parsedPatientId}/documents/${documentId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryCache.invalidateQueries({
        key: ['documents', parsedPatientId],
        exact: false
      })
      toast.add({
        title: 'Succès',
        description: 'Le document a été mis à jour avec succès.',
        color: 'success'
      })
    },
    onError: (error: unknown) => {
      console.error('Error updating document:', error)
      toast.add({
        title: 'Erreur',
        description:
          (error as Error & { data?: { statusMessage?: string } })?.data?.statusMessage ||
          'Impossible de mettre à jour le document',
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting a document
 */
const _useDeleteDocument = (patientId: MaybeRefOrGetter<string>) => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()
  const parsedPatientId = toValue(patientId)

  return useMutation({
    mutation: (documentId: string) =>
      requestFetch(`/api/patients/${parsedPatientId}/documents/${documentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryCache.invalidateQueries({
        key: ['documents', parsedPatientId],
        exact: false
      })
      toast.add({
        title: 'Succès',
        description: 'Le document a été supprimé avec succès.',
        color: 'success'
      })
    },
    onError: (error: unknown) => {
      console.error('Error deleting document:', error)
      toast.add({
        title: 'Erreur',
        description:
          (error as Error & { data?: { statusMessage?: string } })?.data?.statusMessage ||
          'Impossible de supprimer le document',
        color: 'error'
      })
    }
  })
}

export const useDocumentsList = createSharedComposable(_useDocumentsList)
export const useDocumentDownloadUrl = createSharedComposable(_useDocumentDownloadUrl)
export const useUpdateDocument = createSharedComposable(_useUpdateDocument)
export const useDeleteDocument = createSharedComposable(_useDeleteDocument)
