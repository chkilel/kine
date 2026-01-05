import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

/**
 * Query for fetching consultations for a patient
 * @param patientId - Patient ID to fetch consultations for
 * @param queryParams - Optional query parameters for filtering and pagination
 * @returns Query result with consultations data and loading state
 */
const _useConsultationsList = (patientId: MaybeRefOrGetter<string>, queryParams?: Ref<ConsultationQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    enabled: () => !!toValue(patientId),
    key: () => {
      const query = queryParams?.value
      return query ? ['consultations', toValue(patientId), query] : ['consultations', toValue(patientId)]
    },
    query: async () => {
      const id = toValue(patientId)
      const resp = await requestFetch(`/api/patients/${id}/consultations`, {
        query: queryParams?.value
      })
      // return resp?.data || []
      return resp?.data.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    }
  })
}

/**
 * Mutation for creating a new consultation
 * @returns Mutation with create functionality and error handling
 */
const _useCreateConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, consultationData }: { patientId: string; consultationData: ConsultationCreate }) =>
      requestFetch(`/api/patients/${patientId}/consultations`, {
        method: 'POST',
        body: consultationData
      }),
    onSuccess: (_, { patientId }) => {
      toast.add({
        title: 'Succès',
        description: 'Consultation créée avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['consultations', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de créer la consultation').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for updating an existing consultation
 * @returns Mutation with update functionality and error handling
 */
const _useUpdateConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      patientId,
      consultationId,
      consultationData
    }: {
      patientId: string
      consultationId: string
      consultationData: ConsultationUpdate
    }) =>
      requestFetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'PUT',
        body: consultationData
      }),
    onSuccess: (_, { patientId }) => {
      toast.add({
        title: 'Succès',
        description: 'Consultation mise à jour avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['consultations', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour la consultation').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting a consultation
 * @returns Mutation with delete functionality and error handling
 */
const _useDeleteConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, consultationId }: { patientId: string; consultationId: string }) =>
      requestFetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { patientId }) => {
      toast.add({
        title: 'Succès',
        description: 'Consultation supprimée avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['consultations', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de supprimer la consultation').message,
        color: 'error'
      })
    }
  })
}

export const useConsultationsList = createSharedComposable(_useConsultationsList)
export const useCreateConsultation = createSharedComposable(_useCreateConsultation)
export const useUpdateConsultation = createSharedComposable(_useUpdateConsultation)
export const useDeleteConsultation = createSharedComposable(_useDeleteConsultation)
