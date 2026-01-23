import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

const _useConsultationsList = (queryParams?: MaybeRefOrGetter<ConsultationQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => {
      const query = toValue(queryParams)
      return query ? ['consultations', query] : ['consultations']
    },
    query: async () => {
      const resp = await requestFetch('/api/consultations', {
        query: toValue(queryParams)
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    }
  })
}

type CreateConsultationParams = {
  consultationData: ConsultationCreate
  onSuccess?: () => void
}

const _useCreateConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ consultationData }: CreateConsultationParams) =>
      requestFetch('/api/consultations', {
        method: 'POST',
        body: consultationData
      }),
    onSuccess: (_, { consultationData, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Consultation créée avec succès',
        color: 'success'
      })
      if (consultationData.patientId) {
        queryCache.invalidateQueries({ key: ['consultations', { patientId: consultationData.patientId }] })
      }
      queryCache.invalidateQueries({ key: ['consultations'] })
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

type UpdateConsultationParams = {
  consultationId: string
  consultationData: ConsultationUpdate
  patientId?: string
  onSuccess?: () => void
}
const _useUpdateConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ consultationId, consultationData }: UpdateConsultationParams) =>
      requestFetch(`/api/consultations/${consultationId}`, {
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
      if (patientId) {
        queryCache.invalidateQueries({ key: ['consultations', { patientId }] })
      }
      queryCache.invalidateQueries({ key: ['consultations'] })
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

const _useConsultation = (consultationId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const id = toValue(consultationId)
      return id ? ['consultations', id] : ['consultations']
    },
    query: async () => {
      const data = await requestFetch(`/api/consultations/${toValue(consultationId)}`)
      if (!data) return null

      return {
        ...data,
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt)
      }
    },
    enabled: () => !!toValue(consultationId)
  })
}

const _useDeleteConsultation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      consultationId,
      patientId
    }: {
      consultationId: string
      patientId?: string
      onSuccess?: () => void
    }) =>
      requestFetch(`/api/consultations/${consultationId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Consultation supprimée avec succès',
        color: 'success'
      })
      if (patientId) {
        queryCache.invalidateQueries({ key: ['consultations', { patientId }] })
      }
      queryCache.invalidateQueries({ key: ['consultations'] })
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

const _useUpdateConsultationStatus = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      consultationId,
      patientId,
      status
    }: {
      consultationId: string
      patientId?: string
      status: ConsultationStatus
    }) =>
      requestFetch(`/api/consultations/${consultationId}`, {
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
      if (patientId) {
        queryCache.invalidateQueries({ key: ['consultations', { patientId }] })
      }
      queryCache.invalidateQueries({ key: ['consultations'] })
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
