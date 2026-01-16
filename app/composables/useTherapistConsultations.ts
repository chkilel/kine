import { createSharedComposable } from '@vueuse/core'

type TherapistConsultation = {
  id: string
  patientId: string
  patientName: string
  treatmentPlanId: string | null
  roomId: string | null
  roomName: string | null
  date: string
  startTime: string
  endTime: string
  duration: number
  type: ConsultationType | null
  status: ConsultationStatus
  chiefComplaint: string | null
  location: ConsultationLocation | null
}

const _useTherapistConsultations = (date: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => ['therapist-consultations', toValue(date)],
    query: async () => {
      const resp = await requestFetch('/api/therapists/consultations', {
        query: { date: toValue(date) }
      })
      return resp || []
    }
  })
}

export const useTherapistConsultations = createSharedComposable(_useTherapistConsultations)
export type { TherapistConsultation }
