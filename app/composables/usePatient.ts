import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

export const PATIENT_KEYS = {
  root: ['patients'] as const,
  list: (params: PatientQuery) => [...PATIENT_KEYS.root, params],
  single: (id: string) => [...PATIENT_KEYS.root, id]
}

/**
 * Query for fetching paginated patients list with optional filters
 * @param queryParams - Reactive query parameters for pagination and filtering
 * @returns Query result with data and loading state
 */
const _usePatientsList = (queryParams: Ref<PatientQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PATIENT_KEYS.list(queryParams.value),
    query: async () => {
      const resp = await requestFetch('/api/patients', { query: queryParams.value })
      if (!resp) return
      return {
        data: resp.data.map((data) => ({
          ...data,
          notes: data.notes.map((n) => ({
            ...n,
            date: parseISO(n.date)
          })),
          createdAt: parseISO(data.createdAt),
          updatedAt: parseISO(data.updatedAt),
          deletedAt: safeParseISODate(data.deletedAt)
        })),
        pagination: resp.pagination
      }
    }
  })
}

/**
 * Mutation for creating a new patient
 * @returns Mutation with create functionality and error handling
 */
const _useCreatePatient = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (patientData: PatientCreate) =>
      requestFetch('/api/patients', {
        method: 'POST',
        body: patientData
      }),
    onSuccess: (_, variables) => {
      toast.add({
        title: 'Succès',
        description: `Nouveau patient ${variables.firstName} ${variables.lastName} ajouté`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: PATIENT_KEYS.root })
      navigateTo('/patients')
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la création du patient').message,
        color: 'error'
      })
    }
  })
}

/**
 * Query for fetching a single patient by ID
 * @param patientId - Patient ID to fetch
 * @returns Query result with patient data and loading state
 */
const _usePatientById = (patientId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PATIENT_KEYS.single(toValue(patientId)),
    query: async () => {
      const data = await requestFetch(`/api/patients/${toValue(patientId)}`)
      if (!data) return
      return {
        ...data,
        notes: data.notes.map((n) => ({
          ...n,
          date: parseISO(n.date)
        })),
        createdAt: parseISO(data.createdAt),
        updatedAt: parseISO(data.updatedAt),
        deletedAt: safeParseISODate(data.deletedAt)
      }
    },
    enabled: () => !!toValue(patientId)
  })
}

/**
 * Mutation for updating an existing patient
 * @returns Mutation with update functionality and error handling
 */
type UpdatePatientParams = {
  patientId: string
  patientData: PatientUpdate
  onSuccess?: () => void
}
const _useUpdatePatient = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, patientData }: UpdatePatientParams) =>
      requestFetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        body: patientData
      }),
    onSuccess: (_, { patientId, patientData, onSuccess }) => {
      onSuccess?.()

      toast.add({
        title: 'Succès',
        description: `Patient ${patientData.firstName} ${patientData.lastName} mis à jour avec succès`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: PATIENT_KEYS.root })
      queryCache.invalidateQueries({ key: PATIENT_KEYS.single(patientId) })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la mise à jour du patient').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for soft-deleting a patient
 * @returns Mutation with delete functionality and error handling
 */
const _useDeletePatient = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (patientId: string) =>
      requestFetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, patientId) => {
      toast.add({
        title: 'Succès',
        description: 'Patient supprimé avec succès',
        color: 'success'
      })

      queryCache.invalidateQueries({ key: PATIENT_KEYS.root })
      queryCache.invalidateQueries({ key: PATIENT_KEYS.single(patientId) })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la suppression du patient').message,
        color: 'error'
      })
    }
  })
}

export const usePatientsList = _usePatientsList
export const usePatientById = _usePatientById
export const useCreatePatient = createSharedComposable(_useCreatePatient)
export const useUpdatePatient = createSharedComposable(_useUpdatePatient)
export const useDeletePatient = createSharedComposable(_useDeletePatient)
