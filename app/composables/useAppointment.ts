import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'
import type { AppointmentWithSession } from '~~/shared/types/appointment.type'

export const APPOINTMENT_KEYS = {
  root: ['appointments'] as const,
  list: (params: AppointmentQuery) => [...APPOINTMENT_KEYS.root, params],
  listWithSessions: (params: AppointmentQuery) => [...APPOINTMENT_KEYS.root, 'with-sessions', params],
  single: (id: string) => [...APPOINTMENT_KEYS.root, id],
  therapist: (therapistId: string, date: string) => [...APPOINTMENT_KEYS.root, 'therapist', therapistId, date],
  therapistRoot: () => [...APPOINTMENT_KEYS.root, 'therapist']
}

const _useAppointmentsList = (queryParams?: MaybeRefOrGetter<AppointmentQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => {
      const queryParamsValue = toValue(queryParams) || {}
      return APPOINTMENT_KEYS.list(queryParamsValue)
    },
    query: async () => {
      const queryParamsValue = toValue(queryParams) || {}
      const validatedQuery = appointmentQuerySchema.parse(queryParamsValue)
      const resp = await requestFetch('/api/appointments', {
        query: Object.fromEntries(
          Object.entries(validatedQuery).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),

        updatedAt: parseISO(item.updatedAt),
        confirmedAt: safeParseISODate(item.confirmedAt),
        cancelledAt: safeParseISODate(item.cancelledAt)
      }))
    }
  })
}

const _useAppointmentsListWithSessions = (queryParams?: MaybeRefOrGetter<AppointmentQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery<AppointmentWithSession[]>({
    key: () => {
      const queryParamsValue = toValue(queryParams) || {}
      return APPOINTMENT_KEYS.listWithSessions(queryParamsValue)
    },
    query: async () => {
      const queryParamsValue = toValue(queryParams) || {}
      const validatedQuery = appointmentQuerySchema.parse({ ...queryParamsValue, include: 'treatmentSession' })
      const resp = await requestFetch('/api/appointments', {
        query: Object.fromEntries(
          Object.entries(validatedQuery).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
      })
      return (
        resp?.map((item) => ({
          ...item,
          createdAt: parseISO(item.createdAt),
          updatedAt: parseISO(item.updatedAt),
          confirmedAt: safeParseISODate(item.confirmedAt),
          cancelledAt: safeParseISODate(item.cancelledAt)
        })) ?? []
      )
    }
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
    mutation: async ({ appointmentData }: CreateAppointmentParams) =>
      requestFetch('/api/appointments', {
        method: 'POST',
        body: appointmentData
      }),
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
    mutation: async ({ appointmentId, appointmentData }: UpdateAppointmentParams) =>
      requestFetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        body: appointmentData
      }),
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
      const data = await requestFetch(`/api/appointments/${toValue(appointmentId)}`)
      if (!data) return null

      return {
        ...data,
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt),
        confirmedAt: safeParseISODate(data.confirmedAt),
        cancelledAt: safeParseISODate(data.cancelledAt)
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
    mutation: async ({ appointmentId }: { appointmentId: string; patientId?: string; onSuccess?: () => void }) =>
      requestFetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      }),
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
    }) =>
      requestFetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        body: { status }
      }),
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
        cancelledAt: safeParseISODate(item.cancelledAt)
      }))
    },
    enabled: () => !!toValue(therapistId) && !!toValue(date)
  })
}

export const useAppointmentsList = _useAppointmentsList
export const useAppointmentsListWithSessions = _useAppointmentsListWithSessions
export const useAppointment = _useAppointment
export const useCreateAppointment = createSharedComposable(_useCreateAppointment)
export const useUpdateAppointment = createSharedComposable(_useUpdateAppointment)
export const useDeleteAppointment = createSharedComposable(_useDeleteAppointment)
export const useUpdateAppointmentStatus = createSharedComposable(_useUpdateAppointmentStatus)
export const useTherapistAppointments = _useTherapistAppointments
