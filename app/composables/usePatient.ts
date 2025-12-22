import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

const _usePatient = () => {
  const requestFetch = useRequestFetch()

  /**
   * Query for fetching paginated patients list with optional filters
   * @param queryParams - Reactive query parameters for pagination and filtering
   * @returns Query result with data and loading state
   */
  const usePatientsList = (queryParams: Ref<PatientQuery>) => {
    return useQuery({
      key: () => ['patients', queryParams.value],
      query: async () => {
        const resp = await requestFetch('/api/patients', { query: queryParams.value })
        return {
          data: resp?.data.map((data) => ({
            ...data,
            createdAt: parseISO(data.createdAt),
            updatedAt: parseISO(data.updatedAt),
            deletedAt: toDate(data.deletedAt)
          })),
          pagination: resp?.pagination
        }
      }
    })
  }

  /**
   * Mutation for creating a new patient
   * @returns Mutation with create functionality and error handling
   */
  const useCreatePatient = () => {
    const toast = useToast()
    const router = useRouter()
    const queryCache = useQueryCache()

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

        queryCache.invalidateQueries({ key: ['patients'] })
        router.push('/patients')
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
  const usePatientById = (patientId: MaybeRefOrGetter<string>) => {
    return useQuery({
      enabled: () => !!toValue(patientId),
      key: () => ['patient', toValue(patientId)],
      query: async () => {
        const data = await requestFetch(`/api/patients/${toValue(patientId)}`)
        if (!data) return
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          deletedAt: toDate(data.deletedAt)
        }
      }
    })
  }

  /**
   * Mutation for updating an existing patient
   * @returns Mutation with update functionality and error handling
   */
  const useUpdatePatient = () => {
    const toast = useToast()
    const queryCache = useQueryCache()

    return useMutation({
      mutation: async ({ patientId, patientData }: { patientId: string; patientData: PatientUpdate }) =>
        requestFetch(`/api/patients/${patientId}`, {
          method: 'PUT',
          body: patientData
        }),
      onSuccess: (_, { patientId, patientData }) => {
        toast.add({
          title: 'Succès',
          description: `Patient ${patientData.firstName} ${patientData.lastName} mis à jour avec succès`,
          color: 'success'
        })

        queryCache.invalidateQueries({ key: ['patients'] })
        queryCache.invalidateQueries({ key: ['patient', patientId] })
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
  const useDeletePatient = () => {
    const toast = useToast()
    const queryCache = useQueryCache()

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

        queryCache.invalidateQueries({ key: ['patients'] })
        queryCache.invalidateQueries({ key: ['patient', patientId] })
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

  return {
    usePatientsList,
    useCreatePatient,
    usePatientById,
    useUpdatePatient,
    useDeletePatient
  }
}

export const usePatient = createSharedComposable(_usePatient)
