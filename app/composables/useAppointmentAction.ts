import { createSharedComposable } from '@vueuse/core'
import { APPOINTMENT_KEYS } from './useAppointment'

type StartParams = { id: string; actualStartTime: string }
type PauseParams = { id: string; pauseStartTime: string }
type ResumeParams = { id: string; pauseDurationSeconds: number }
type EndParams = {
  id: string
  actualDurationSeconds?: number
  tags?: string[]
  painLevelAfter?: number
  notes?: string
}
type UpdateTagsParams = { id: string; tags: string[] }
type ExtendParams = { id: string; extendedDurationMinutes: number }

type AppointmentActionParams = StartParams | PauseParams | ResumeParams | EndParams | UpdateTagsParams | ExtendParams

const _useAppointmentAction = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  const mutation = useMutation({
    mutation: async (params: AppointmentActionParams) => {
      const { id, ...body } = params
      return requestFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        body
      })
    },
    onSuccess: (data, { id }) => {
      toast.add({
        title: 'Succès',
        description: data?.message || 'Rendez-vous mise à jour',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['appointments', id] })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
    },
    onError: (error) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le Rendez-vous').message,
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
    extendAsync: (params: ExtendParams) => mutation.mutateAsync(params)
  }
}

export const useAppointmentAction = createSharedComposable(_useAppointmentAction)
