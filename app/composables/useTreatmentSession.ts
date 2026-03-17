import { createSharedComposable } from '@vueuse/core'

export const TREATMENT_SESSION_KEYS = {
  root: ['treatment-sessions'] as const,
  list: (params: TreatmentSessionQuery) => [...TREATMENT_SESSION_KEYS.root, 'list', params],
  single: (id: string) => [...TREATMENT_SESSION_KEYS.root, id]
}

const _useCreateTreatmentSession = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ appointmentId, primaryConcern, treatmentSummary }: WithOnSuccess<CreateTreatmentSession>) =>
      requestFetch('/api/treatment-sessions', {
        method: 'POST',
        body: { appointmentId, primaryConcern, treatmentSummary }
      }),
    onSuccess: (data, { appointmentId, onSuccess }) => {
      onSuccess?.()
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
      const parsedError = parseError(error, 'Impossible de créer la séance de traitement')
      if (parsedError.statusCode === 409) return
      toast.add({
        title: 'Erreur',
        description: parsedError.message,
        color: 'error'
      })
    }
  })
}

type SessionActionParams = {
  sessionId: string
  appointmentId?: string
}

type StartParams = WithOnSuccess<SessionActionParams> & StartAction
type PauseParams = WithOnSuccess<SessionActionParams> & PauseAction
type ResumeParams = WithOnSuccess<SessionActionParams> & ResumeAction
type EndParams = WithOnSuccess<SessionActionParams> & EndAction
type UpdateTagsParams = WithOnSuccess<SessionActionParams> & UpdateTagsAction
type ExtendParams = WithOnSuccess<SessionActionParams> & ExtendAction
type CancelParams = WithOnSuccess<SessionActionParams> & CancelAction
type UpdateClinicalNotesParams = WithOnSuccess<SessionActionParams> & UpdateClinicalNotesAction
type UpdateCostParams = WithOnSuccess<SessionActionParams> & UpdateCostAction

const _useTreatmentSessionActions = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  const mutation = useMutation({
    mutation: async (
      params:
        | StartParams
        | PauseParams
        | ResumeParams
        | EndParams
        | UpdateTagsParams
        | ExtendParams
        | CancelParams
        | UpdateClinicalNotesParams
        | UpdateCostParams
    ) => {
      const { sessionId, appointmentId, ...body } = params
      return requestFetch(`/api/treatment-sessions/${sessionId}`, {
        method: 'PATCH',
        body
      })
    },
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
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
    extendAsync: (params: ExtendParams) => mutation.mutateAsync(params),
    cancel: (params: CancelParams) => mutation.mutate({ ...params, action: 'cancel' }),
    cancelAsync: (params: CancelParams) => mutation.mutateAsync({ ...params, action: 'cancel' }),
    updateClinicalNotes: (params: UpdateClinicalNotesParams) => mutation.mutate(params),
    updateClinicalNotesAsync: (params: UpdateClinicalNotesParams) => mutation.mutateAsync(params),
    updateCost: (params: UpdateCostParams) => mutation.mutate(params),
    updateCostAsync: (params: UpdateCostParams) => mutation.mutateAsync(params)
  }
}

export const useCreateTreatmentSession = createSharedComposable(_useCreateTreatmentSession)
export const useTreatmentSessionActions = createSharedComposable(_useTreatmentSessionActions)
