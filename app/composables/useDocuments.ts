/**
 * Query for fetching documents for a patient
 * @param patientId - Patient ID to fetch documents for
 * @param treatmentPlanId - Optional treatment plan ID to filter documents
 * @returns Query result with documents data and loading state
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
 * @param patientId - Patient ID whose document is being fetched
 * @param documentId - Document ID to get download URL for
 * @returns Query result with download URL and loading state
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
 * @param patientId - Patient ID whose document is being updated
 * @returns Mutation with update functionality and error handling
 */

type UpdateDocumentParams = {
  documentId: string
  data: PatientDocumentUpdate
  onSuccess?: () => void
}
const _useUpdateDocument = (patientId: MaybeRefOrGetter<string>) => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()
  const parsedPatientId = toValue(patientId)

  return useMutation({
    mutation: ({ documentId, data, onSuccess }: UpdateDocumentParams) =>
      requestFetch<PatientDocument>(`/api/patients/${parsedPatientId}/documents/${documentId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
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
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le document').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting a document
 * @param patientId - Patient ID whose document is being deleted
 * @returns Mutation with delete functionality and error handling
 */
const _useDeleteDocument = (patientId: MaybeRefOrGetter<string>) => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()
  const parsedPatientId = toValue(patientId)

  return useMutation({
    mutation: ({ documentId, onSuccess }: { documentId: string; onSuccess?: () => void }) =>
      requestFetch(`/api/patients/${parsedPatientId}/documents/${documentId}`, { method: 'DELETE' }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
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
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de supprimer le document').message,
        color: 'error'
      })
    }
  })
}

export const useDocumentsList = createSharedComposable(_useDocumentsList)
export const useDocumentDownloadUrl = createSharedComposable(_useDocumentDownloadUrl)
export const useUpdateDocument = createSharedComposable(_useUpdateDocument)
export const useDeleteDocument = createSharedComposable(_useDeleteDocument)
