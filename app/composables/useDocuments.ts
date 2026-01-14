const _useDocumentsList = (patientId: MaybeRefOrGetter<string>, treatmentPlanId?: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => ['documents', toValue(patientId), toValue(treatmentPlanId) || 'all'],
    query: async () => {
      const params = toValue(treatmentPlanId) ? `?treatmentPlanId=${toValue(treatmentPlanId)}` : ''
      return requestFetch<PatientDocument[]>(`/api/patients/${toValue(patientId)}/documents${params}`)
    },
    enabled: () => !!toValue(patientId)
  })
}

const _useDocumentDownloadUrl = (patientId: MaybeRefOrGetter<string>, documentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => ['document-download-url', toValue(patientId), toValue(documentId)],
    query: async () => {
      return requestFetch<{ downloadUrl: string }>(
        `/api/patients/${toValue(patientId)}/documents/${toValue(documentId)}`
      )
    },
    enabled: () => !!toValue(patientId) && !!toValue(documentId)
  })
}

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

export const useDocumentsList = _useDocumentsList
export const useDocumentDownloadUrl = _useDocumentDownloadUrl
export const useUpdateDocument = _useUpdateDocument
export const useDeleteDocument = _useDeleteDocument
