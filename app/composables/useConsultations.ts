import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

/**
 * Query for fetching consultations for a patient
 * @param patientId - Patient ID to fetch consultations for
 * @param queryParams - Optional query parameters for filtering and pagination
 * @returns Query result with consultations data and loading state
 */
const _useConsultationsList = (
  patientId: MaybeRefOrGetter<string>,
  queryParams?: MaybeRefOrGetter<ConsultationQuery>
) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => {
      const query = toValue(queryParams)
      return query ? ['consultations', toValue(patientId), query] : ['consultations', toValue(patientId)]
    },
    query: async () => {
      const resp = await requestFetch(`/api/patients/${toValue(patientId)}/consultations`, {
        query: toValue(queryParams)
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    },
    enabled: () => !!toValue(patientId)
  })
}

/**
 * Mutation for creating a new consultation
 * @returns Mutation with create functionality and error handling
 */

type CreateConsultationParams = {
  patientId: string
  consultationData: ConsultationCreate
  onSuccess?: () => void
}

const _useCreateConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, consultationData }: CreateConsultationParams) =>
      requestFetch(`/api/patients/${patientId}/consultations`, {
        method: 'POST',
        body: consultationData
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
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
type UpdateConsultationParams = {
  patientId: string
  consultationId: string
  consultationData: ConsultationUpdate
  onSuccess?: () => void
}
const _useUpdateConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, consultationId, consultationData }: UpdateConsultationParams) =>
      requestFetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'PUT',
        body: consultationData
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
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
 * Query for fetching a single consultation
 * @param patientId - Patient ID
 * @param consultationId - Consultation ID to fetch
 * @returns Query result with consultation data and loading state
 */
const _useConsultation = (patientId: MaybeRefOrGetter<string>, consultationId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      if (!!toValue(patientId) && !!toValue(consultationId)) {
        return ['consultations', toValue(patientId), toValue(consultationId)]
      }
      return ['consultations']
    },
    query: async () => {
      const data = await requestFetch(`/api/patients/${toValue(patientId)}/consultations/${toValue(consultationId)}`)
      if (!data) return null

      return {
        ...data,
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt)
      }
    },
    enabled: () => !!toValue(patientId) && !!toValue(consultationId)
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
    mutation: async ({
      patientId,
      consultationId
    }: {
      patientId: string
      consultationId: string
      onSuccess?: () => void
    }) =>
      requestFetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
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

/**
 * Mutation for updating consultation status
 * @returns Mutation with status update functionality and error handling
 */
const _useUpdateConsultationStatus = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      patientId,
      consultationId,
      status
    }: {
      patientId: string
      consultationId: string
      status: ConsultationStatus
    }) =>
      requestFetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'PUT',
        body: { status }
      }),
    onSuccess: (_, { patientId }) => {
      toast.add({
        title: 'Succès',
        description: 'Statut de la consultation mis à jour',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['therapist-consultations'] })
      queryCache.invalidateQueries({ key: ['consultations', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le statut').message,
        color: 'error'
      })
    }
  })
}

export const useConsultationsList = _useConsultationsList
export const useConsultation = _useConsultation
export const useCreateConsultation = createSharedComposable(_useCreateConsultation)
export const useUpdateConsultation = createSharedComposable(_useUpdateConsultation)
export const useDeleteConsultation = createSharedComposable(_useDeleteConsultation)
export const useUpdateConsultationStatus = createSharedComposable(_useUpdateConsultationStatus)
