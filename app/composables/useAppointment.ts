import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'
import z from 'zod'

export const APPOINTMENT_KEYS = {
  root: ['appointments'] as const,
  list: (params: AppointmentQuery) => [...APPOINTMENT_KEYS.root, params],
  single: (id: string) => [...APPOINTMENT_KEYS.root, id],
  therapist: (therapistId: string, date: string) => [...APPOINTMENT_KEYS.root, 'therapist', therapistId, date],
  therapistRoot: () => [...APPOINTMENT_KEYS.root, 'therapist'],
  plan: (treatmentPlanId: string, patientId: string) => [...APPOINTMENT_KEYS.root, 'plan', treatmentPlanId, patientId]
}

const _useAppointmentsList = (queryParams?: MaybeRefOrGetter<AppointmentQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => {
      const queryParamsValue = toValue(queryParams)
      return queryParamsValue ? APPOINTMENT_KEYS.list(queryParamsValue) : APPOINTMENT_KEYS.root
    },
    query: async () => {
      const queryParamsValue = toValue(queryParams) || {}
      const validatedQuery = appointmentQuerySchema.parse(queryParamsValue)

      const resp = await requestFetch<PaginatedResponse<Appointment>>('/api/appointments', { query: validatedQuery })

      const data = z.array(appointmentSchema).parse(resp.data)

      return { pagination: resp?.pagination, data }
    }
  })
}

const _usePlanAppointments = (
  treatmentPlanId: MaybeRefOrGetter<string | undefined>,
  patientId: MaybeRefOrGetter<string>,
  limit: MaybeRefOrGetter<number> = 10
) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const planId = toValue(treatmentPlanId)
      const pid = toValue(patientId)
      return planId && pid ? APPOINTMENT_KEYS.plan(planId, pid) : APPOINTMENT_KEYS.root
    },
    query: async () => {
      const planId = toValue(treatmentPlanId)
      const pid = toValue(patientId)
      const lim = toValue(limit)

      if (!planId || !pid) return []

      const resp = await requestFetch('/api/appointments/plan', {
        query: {
          treatmentPlanId: planId,
          patientId: pid,
          limit: lim.toString()
        }
      })
      return resp || []
    },
    enabled: () => !!toValue(treatmentPlanId) && !!toValue(patientId)
  })
}

type CreateAppointmentParams = {
  appointmentData: AppointmentCreate
  onSuccess?: () => void
}

const _useCreateAppointment = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ appointmentData }: CreateAppointmentParams) => {
      const resp = requestFetch('/api/appointments', {
        method: 'POST',
        body: appointmentData
      })
      return resp
    },
    onSuccess: (_, { appointmentData, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Rendez-vous créé avec succès',
        color: 'success'
      })
      if (appointmentData.patientId) {
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.list({ patientId: appointmentData.patientId }) })
      }
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de créer le rendez-vous').message,
        color: 'error'
      })
    }
  })
}

type UpdateAppointmentParams = {
  appointmentId: string
  appointmentData: AppointmentUpdate
  patientId?: string
  onSuccess?: () => void
}
const _useUpdateAppointment = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ appointmentId, appointmentData }: UpdateAppointmentParams) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        body: appointmentData
      })
      return resp
    },
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Rendez-vous mis à jour avec succès',
        color: 'success'
      })
      if (patientId) {
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.list({ patientId }) })
      }
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le Rendez-vous').message,
        color: 'error'
      })
    }
  })
}

const _useAppointment = (appointmentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const id = toValue(appointmentId)
      return id ? APPOINTMENT_KEYS.single(id) : APPOINTMENT_KEYS.root
    },
    query: async () => {
      const data = await requestFetch<AppointmentDetail>(`/api/appointments/${toValue(appointmentId)}`)
      if (!data) return null

      return {
        ...data,
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt),
        confirmedAt: safeParseISODate(data.confirmedAt),
        cancelledAt: safeParseISODate(data.cancelledAt),
        lockedAt: safeParseISODate(data.lockedAt)
      }
    },
    enabled: () => !!toValue(appointmentId)
  })
}

const _useDeleteAppointment = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ appointmentId }: { appointmentId: string; patientId?: string; onSuccess?: () => void }) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })
      return resp
    },
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Rendez-vous supprimé avec succès',
        color: 'success'
      })
      if (patientId) {
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.list({ patientId }) })
      }
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de supprimer le rendez-vous').message,
        color: 'error'
      })
    }
  })
}

const _useUpdateAppointmentStatus = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      appointmentId,
      status
    }: {
      appointmentId: string
      patientId?: string
      status: AppointmentStatus
    }) => {
      const resp = requestFetch(`/api/appointments/${appointmentId}`, { method: 'PUT', body: { status } })
      return resp
    },

    onSuccess: (_, { patientId }) => {
      toast.add({
        title: 'Succès',
        description: 'Statut du rendez-vous mis à jour',
        color: 'success'
      })
      if (patientId) {
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.list({ patientId }) })
      }
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
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

const _useTherapistAppointments = (
  therapistId: MaybeRefOrGetter<string | undefined>,
  date: MaybeRefOrGetter<string>
) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const therapistIdValue = toValue(therapistId)
      const dateValue = toValue(date)
      return therapistIdValue && dateValue
        ? APPOINTMENT_KEYS.therapist(therapistIdValue, dateValue)
        : APPOINTMENT_KEYS.root
    },
    query: async () => {
      const query = {
        therapistId: toValue(therapistId),
        date: toValue(date)
      }
      const validatedQuery = therapistAppointmentsQuerySchema.parse(query)
      const resp = await requestFetch(`/api/therapists/${validatedQuery.therapistId}/day`, {
        query: { date: validatedQuery.date }
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt),
        confirmedAt: safeParseISODate(item.confirmedAt),
        cancelledAt: safeParseISODate(item.cancelledAt),
        lockedAt: safeParseISODate(item.lockedAt)
      }))
    },
    enabled: () => !!toValue(therapistId) && !!toValue(date)
  })
}

function useAppointmentInvalidation() {
  const queryCache = useQueryCache()
  return (appointmentId?: string) => {
    queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
    queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
    if (appointmentId) {
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.single(appointmentId) })
    }
  }
}

const _useStartAppointment = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & StartAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/start`, { method: 'POST', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de démarrer la séance').message,
        color: 'error'
      })
    }
  })
}

const _usePauseAppointment = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & PauseAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/pause`, { method: 'POST', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre la séance en pause').message,
        color: 'error'
      })
    }
  })
}

const _useResumeAppointment = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & ResumeAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/resume`, { method: 'POST', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de reprendre la séance').message,
        color: 'error'
      })
    }
  })
}

const _useEndAppointment = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & EndAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/end`, { method: 'POST', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de terminer la séance').message,
        color: 'error'
      })
    }
  })
}

const _useCancelAppointment = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId }: WithOnSuccess<{ appointmentId: string }>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/cancel`, { method: 'POST' })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible d'annuler la séance").message,
        color: 'error'
      })
    }
  })
}

const _useUpdateAppointmentTags = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & UpdateTagsAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/tags`, { method: 'PATCH', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour les tags').message,
        color: 'error'
      })
    }
  })
}

const _useExtendAppointment = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & ExtendAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/extend`, { method: 'PATCH', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible d'étendre la durée").message,
        color: 'error'
      })
    }
  })
}

const _useUpdateAppointmentPrice = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({ appointmentId, ...body }: WithOnSuccess<{ appointmentId: string } & UpdatePriceAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/price`, { method: 'PATCH', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown, { onError }) => {
      onError?.()
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le prix').message,
        color: 'error'
      })
    }
  })
}

const _useUpdateAppointmentClinicalNotes = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useAppointmentInvalidation()

  return useMutation({
    mutation: async ({
      appointmentId,
      ...body
    }: WithOnSuccess<{ appointmentId: string } & UpdateClinicalNotesAction>) => {
      const resp = await requestFetch(`/api/appointments/${appointmentId}/clinical-notes`, { method: 'PATCH', body })
      return resp
    },
    onSuccess: (_data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour les notes cliniques').message,
        color: 'error'
      })
    }
  })
}

export const useAppointmentsList = _useAppointmentsList
export const useAppointment = _useAppointment
export const useTherapistAppointments = _useTherapistAppointments
export const usePlanAppointments = _usePlanAppointments

export const useCreateAppointment = createSharedComposable(_useCreateAppointment)
export const useUpdateAppointment = createSharedComposable(_useUpdateAppointment)
export const useDeleteAppointment = createSharedComposable(_useDeleteAppointment)
export const useUpdateAppointmentStatus = createSharedComposable(_useUpdateAppointmentStatus)
export const useStartAppointment = createSharedComposable(_useStartAppointment)
export const usePauseAppointment = createSharedComposable(_usePauseAppointment)
export const useResumeAppointment = createSharedComposable(_useResumeAppointment)
export const useEndAppointment = createSharedComposable(_useEndAppointment)
export const useCancelAppointment = createSharedComposable(_useCancelAppointment)
export const useUpdateAppointmentTags = createSharedComposable(_useUpdateAppointmentTags)
export const useExtendAppointment = createSharedComposable(_useExtendAppointment)
export const useUpdateAppointmentPrice = createSharedComposable(_useUpdateAppointmentPrice)
export const useUpdateAppointmentClinicalNotes = createSharedComposable(_useUpdateAppointmentClinicalNotes)
