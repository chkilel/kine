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
  patientId: string
  documentId: string
  data: PatientDocumentUpdate
  onSuccess?: () => void
}
const _useUpdateDocument = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: ({ patientId, documentId, data }: UpdateDocumentParams) =>
      requestFetch<PatientDocument>(`/api/patients/${patientId}/documents/${documentId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      queryCache.invalidateQueries({
        key: ['documents', patientId],
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

type DeleteDocumentParams = {
  patientId: string
  documentId: string
  onSuccess?: () => void
}
const _useDeleteDocument = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: ({ patientId, documentId }: DeleteDocumentParams) =>
      requestFetch(`/api/patients/${patientId}/documents/${documentId}`, { method: 'DELETE' }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      queryCache.invalidateQueries({
        key: ['documents', patientId],
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

const _useDownloadDocument = () => {
  const toast = useToast()
  const { getPresignUrl } = useUploads()

  async function downloadDocument(storageKey: string, fileName: string) {
    try {
      const url = await getPresignUrl(storageKey)
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec du téléchargement du document').message,
        color: 'error'
      })
    }
  }

  return { downloadDocument }
}

export const useDocumentsList = _useDocumentsList
export const useDocumentDownloadUrl = _useDocumentDownloadUrl
export const useUpdateDocument = createSharedComposable(_useUpdateDocument)
export const useDeleteDocument = createSharedComposable(_useDeleteDocument)
export const useDownloadDocument = createSharedComposable(_useDownloadDocument)
