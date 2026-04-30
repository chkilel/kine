export const SLOTS_KEYS = {
  root: ['slots'] as const,
  room: (params: { roomId: string; date: string; duration: number; therapistId?: string; roomOnly: boolean }) =>
    [...SLOTS_KEYS.root, 'room', params] as const,
  therapist: (params: { therapistId: string; date: string; duration: number; location: string }) =>
    [...SLOTS_KEYS.root, 'therapist', params] as const
}

type AvailableSlotsParams = {
  location: MaybeRefOrGetter<string>
  roomId: MaybeRefOrGetter<string | undefined>
  therapistId: MaybeRefOrGetter<string | undefined>
  date: MaybeRefOrGetter<string | undefined>
  duration: MaybeRefOrGetter<number>
  showOnlyRoomAvailability: MaybeRefOrGetter<boolean>
}

export const useAvailableSlots = (params: AvailableSlotsParams) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => {
      const location = toValue(params.location)
      const roomId = toValue(params.roomId)
      const therapistId = toValue(params.therapistId)
      const date = toValue(params.date)
      const duration = toValue(params.duration)
      const roomOnly = toValue(params.showOnlyRoomAvailability)

      if (location === 'clinic' && roomId) {
        return SLOTS_KEYS.room({ roomId, date: date || '', duration, therapistId, roomOnly })
      }
      if (therapistId) {
        return SLOTS_KEYS.therapist({ therapistId, date: date || '', duration, location })
      }
      return SLOTS_KEYS.root
    },
    query: async () => {
      const location = toValue(params.location)
      const roomId = toValue(params.roomId)
      const therapistId = toValue(params.therapistId)
      const date = toValue(params.date)
      const duration = toValue(params.duration)
      const roomOnly = toValue(params.showOnlyRoomAvailability)

      if (!date) return []
      if (!therapistId) return []

      if (location === 'clinic') {
        if (!roomId) return []

        const therapistIdParam = !roomOnly ? therapistId : undefined
        const response = await requestFetch(`/api/availability/rooms/${roomId}/slots`, {
          method: 'POST',
          body: { dates: [date], duration, therapistId: therapistIdParam }
        })
        return response.slots[date]?.availableSlots ?? []
      }

      const response = await requestFetch(`/api/availability/therapists/${therapistId}/slots`, {
        method: 'POST',
        body: { dates: [date], duration, location }
      })
      return response.slots[date]?.availableSlots ?? []
    },
    enabled: () => {
      const date = toValue(params.date)
      const therapistId = toValue(params.therapistId)
      const location = toValue(params.location)
      const roomId = toValue(params.roomId)

      if (!date || !therapistId) return false
      if (location === 'clinic' && !roomId) return false
      return true
    }
  })
}
