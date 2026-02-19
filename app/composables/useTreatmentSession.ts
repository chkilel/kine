import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

export const TREATMENT_SESSION_KEYS = {
  root: ['treatment-sessions'] as const,
  list: (params: TreatmentSessionQuery) => [...TREATMENT_SESSION_KEYS.root, 'list', params],
  single: (id: string) => [...TREATMENT_SESSION_KEYS.root, id]
}

const _useTreatmentSession = (sessionId: MaybeRefOrGetter<string | undefined>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const id = toValue(sessionId)
      return id ? TREATMENT_SESSION_KEYS.single(id) : TREATMENT_SESSION_KEYS.root
    },
    query: async () => {
      const data = await requestFetch(`/api/treatment-sessions/${toValue(sessionId)}`)
      if (!data) return null

      return {
        ...data,
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt)
      }
    },
    enabled: () => !!toValue(sessionId)
  })
}

const _useCreateTreatmentSession = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ appointmentId }: { appointmentId: string }) =>
      requestFetch('/api/treatment-sessions', {
        method: 'POST',
        body: { appointmentId }
      }),
    onSuccess: (data, { appointmentId }) => {
      const treatmentSessionId = data?.data?.id
      queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.single(appointmentId) })
      if (treatmentSessionId) {
        queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.single(treatmentSessionId) })
      }
    },
    onError: (error) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de créer la séance de traitement').message,
        color: 'error'
      })
    }
  })
}

type SessionActionParams = {
  sessionId: string
  appointmentId?: string
}

type StartParams = SessionActionParams & { actualStartTime: string }
type PauseParams = SessionActionParams & { pauseStartTime: string }
type ResumeParams = SessionActionParams & { pauseDurationSeconds: number }
type EndParams = SessionActionParams & {
  actualDurationSeconds?: number
  tags?: string[]
  painLevelAfter?: number
  notes?: string
}
type UpdateTagsParams = SessionActionParams & { tags: string[] }
type ExtendParams = SessionActionParams & { extendedDurationMinutes: number }

const _useTreatmentSessionActions = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  const mutation = useMutation({
    mutation: async (
      params: StartParams | PauseParams | ResumeParams | EndParams | UpdateTagsParams | ExtendParams
    ) => {
      const { sessionId, appointmentId, ...body } = params
      return requestFetch(`/api/treatment-sessions/${sessionId}`, {
        method: 'PATCH',
        body
      })
    },
    onSuccess: (data, { sessionId }) => {
      const appointmentId = data?.data?.appointmentId
      queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.single(sessionId) })
      queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
      if (appointmentId) {
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.single(appointmentId) })
      }
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour la séance').message,
        color: 'error'
      })
    }
  })

  return {
    ...mutation,
    // Start is handled by create, but we keep it for consistency
    start: (params: StartParams) => mutation.mutate(params),
    startAsync: (params: StartParams) => mutation.mutateAsync(params),
    pause: (params: PauseParams) => mutation.mutate(params),
    pauseAsync: (params: PauseParams) => mutation.mutateAsync(params),
    resume: (params: ResumeParams) => mutation.mutate(params),
    resumeAsync: (params: ResumeParams) => mutation.mutateAsync(params),
    end: (params: EndParams) => mutation.mutate(params),
    endAsync: (params: EndParams) => mutation.mutateAsync(params),
    updateTags: (params: UpdateTagsParams) => mutation.mutate(params),
    updateTagsAsync: (params: UpdateTagsParams) => mutation.mutateAsync(params),
    extend: (params: ExtendParams) => mutation.mutate(params),
    extendAsync: (params: ExtendParams) => mutation.mutateAsync(params)
  }
}

const _useTreatmentSessionsList = (queryParams?: MaybeRefOrGetter<TreatmentSessionQuery>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const queryParamsValue = toValue(queryParams) || {}
      return TREATMENT_SESSION_KEYS.list(queryParamsValue as TreatmentSessionQuery)
    },
    query: async () => {
      const queryParamsValue = (toValue(queryParams) || {}) as TreatmentSessionQuery
      const query: Record<string, string> = {}

      if (queryParamsValue.patientId) query.patientId = queryParamsValue.patientId
      if (queryParamsValue.therapistId) query.therapistId = queryParamsValue.therapistId
      if (queryParamsValue.date) query.date = queryParamsValue.date
      if (queryParamsValue.status) query.status = queryParamsValue.status
      if (queryParamsValue.page) query.page = queryParamsValue.page.toString()
      if (queryParamsValue.limit) query.limit = queryParamsValue.limit.toString()

      const resp = await requestFetch('/api/treatment-sessions', { query })

      return resp?.data?.map((item: any) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt)
      }))
    }
  })
}

export const useTreatmentSession = _useTreatmentSession
export const useCreateTreatmentSession = createSharedComposable(_useCreateTreatmentSession)
export const useTreatmentSessionActions = createSharedComposable(_useTreatmentSessionActions)
export const useTreatmentSessionsList = _useTreatmentSessionsList
