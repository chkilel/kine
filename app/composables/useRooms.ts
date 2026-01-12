import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

/**
 * Query for fetching rooms list with optional filters
 * @param queryParams - Reactive query parameters for pagination and filtering
 * @returns Query result with data and loading state
 */
const _useRoomsList = (queryParams: Ref<RoomQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => ['rooms', queryParams.value],
    query: async () => {
      const resp = await requestFetch('/api/rooms', { query: queryParams.value })
      return resp?.map((data) => ({
        ...data,
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt),
        deletedAt: data.deletedAt ? parseISO(data.deletedAt) : null
      })) as Room[]
    }
  })
}

/**
 * Mutation for creating a new room
 * @returns Mutation with create functionality and error handling
 */
const _useCreateRoom = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ roomData }: { roomData: RoomCreate; onSuccess?: () => void }) =>
      requestFetch('/api/rooms', {
        method: 'POST',
        body: roomData
      }),
    onSuccess: (_, { roomData, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: `Salle ${roomData.name} ajoutée avec succès`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: ['rooms'] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la création de la salle').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for updating an existing room
 * @returns Mutation with update functionality and error handling
 */
const _useUpdateRoom = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ roomId, roomData }: { roomId: string; roomData: RoomUpdate; onSuccess?: () => void }) =>
      requestFetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        body: roomData
      }),
    onSuccess: (_, { roomId, roomData, onSuccess }) => {
      onSuccess?.()

      toast.add({
        title: 'Succès',
        description: `Salle ${roomData.name} mise à jour avec succès`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: ['rooms'] })
      queryCache.invalidateQueries({ key: ['room', roomId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la mise à jour de la salle').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting a room
 * @returns Mutation with delete functionality and error handling
 */
const _useDeleteRoom = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ roomId, onSuccess }: { roomId: string; onSuccess?: () => void }) =>
      requestFetch(`/api/rooms/${roomId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { roomId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Salle supprimée avec succès',
        color: 'success'
      })

      queryCache.invalidateQueries({ key: ['rooms'] })
      queryCache.invalidateQueries({ key: ['room', roomId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la suppression de la salle').message,
        color: 'error'
      })
    }
  })
}

export const useRoomsList = createSharedComposable(_useRoomsList)
export const useCreateRoom = createSharedComposable(_useCreateRoom)
export const useUpdateRoom = createSharedComposable(_useUpdateRoom)
export const useDeleteRoom = createSharedComposable(_useDeleteRoom)
