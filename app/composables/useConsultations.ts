import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

export const CONSULTATION_KEYS = {
  root: ['consultations'] as const,
  list: (params: ConsultationQuery) => [...CONSULTATION_KEYS.root, params],
  single: (id: string) => [...CONSULTATION_KEYS.root, id],
  therapist: (therapistId: string, date: string) => [...CONSULTATION_KEYS.root, 'therapist', therapistId, date],
  therapistRoot: () => [...CONSULTATION_KEYS.root, 'therapist']
}

const _useConsultationsList = (queryParams?: MaybeRefOrGetter<ConsultationQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => {
      const queryParamsValue = toValue(queryParams) || {}
      const query = {
        therapistId: toValue(queryParamsValue.therapistId),
        patientId: toValue(queryParamsValue.patientId),
        treatmentPlanId: toValue(queryParamsValue.treatmentPlanId),
        consultationStatus: toValue(queryParamsValue.consultationStatus),
        sessionStep: toValue(queryParamsValue.sessionStep),
        status: toValue(queryParamsValue.status),
        type: toValue(queryParamsValue.type),
        date: toValue(queryParamsValue.date),
        dateFrom: toValue(queryParamsValue.dateFrom),
        dateTo: toValue(queryParamsValue.dateTo),
        actualStartTime: toValue(queryParamsValue.actualStartTime),
        actualDurationSeconds: toValue(queryParamsValue.actualDurationSeconds),
        totalPausedSeconds: toValue(queryParamsValue.totalPausedSeconds),
        pauseStartTime: toValue(queryParamsValue.pauseStartTime),
        tags: toValue(queryParamsValue.tags)
      }
      return CONSULTATION_KEYS.list(query as ConsultationQuery)
    },
    query: async () => {
      const queryParamsValue = toValue(queryParams) || {}
      const query = {
        therapistId: toValue(queryParamsValue.therapistId),
        patientId: toValue(queryParamsValue.patientId),
        treatmentPlanId: toValue(queryParamsValue.treatmentPlanId),
        onlyIndependent: toValue(queryParamsValue.onlyIndependent)?.toString(),
        status: toValue(queryParamsValue.status),
        type: toValue(queryParamsValue.type),
        dateFrom: toValue(queryParamsValue.dateFrom),
        dateTo: toValue(queryParamsValue.dateTo),
        date: toValue(queryParamsValue.date)
      }
      const validatedQuery = consultationQuerySchema.parse(query)
      const resp = await requestFetch('/api/consultations', {
        query: Object.fromEntries(
          Object.entries(validatedQuery).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
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
        queryCache.invalidateQueries({ key: CONSULTATION_KEYS.list({ patientId: consultationData.patientId }) })
      }
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.root })
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.therapistRoot() })
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
        queryCache.invalidateQueries({ key: CONSULTATION_KEYS.list({ patientId }) })
      }
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.root })
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.therapistRoot() })
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
      return id ? CONSULTATION_KEYS.single(id) : CONSULTATION_KEYS.root
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
        queryCache.invalidateQueries({ key: CONSULTATION_KEYS.list({ patientId }) })
      }
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.root })
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.therapistRoot() })
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
      if (patientId) {
        queryCache.invalidateQueries({ key: CONSULTATION_KEYS.list({ patientId }) })
      }
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.root })
      queryCache.invalidateQueries({ key: CONSULTATION_KEYS.therapistRoot() })
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

const _useTherapistConsultations = (
  therapistId: MaybeRefOrGetter<string | undefined>,
  date: MaybeRefOrGetter<string>
) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const therapistIdValue = toValue(therapistId)
      const dateValue = toValue(date)
      return therapistIdValue && dateValue
        ? CONSULTATION_KEYS.therapist(therapistIdValue, dateValue)
        : CONSULTATION_KEYS.root
    },
    query: async () => {
      const query = {
        therapistId: toValue(therapistId),
        date: toValue(date)
      }
      const validatedQuery = therapistConsultationsQuerySchema.parse(query)
      const resp = await requestFetch(`/api/therapists/${validatedQuery.therapistId}/day`, {
        query: { date: validatedQuery.date }
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    },
    enabled: () => !!toValue(therapistId) && !!toValue(date)
  })
}

export const useConsultationsList = _useConsultationsList
export const useConsultation = _useConsultation
export const useCreateConsultation = createSharedComposable(_useCreateConsultation)
export const useUpdateConsultation = createSharedComposable(_useUpdateConsultation)
export const useDeleteConsultation = createSharedComposable(_useDeleteConsultation)
export const useUpdateConsultationStatus = createSharedComposable(_useUpdateConsultationStatus)
export const useTherapistConsultations = _useTherapistConsultations
