import { createSharedComposable } from '@vueuse/core'

export const INSURANCE_COMPANY_KEYS = {
  root: ['insuranceCompanies'] as const,
  list: (params: InsuranceCompanyQuery) => [...INSURANCE_COMPANY_KEYS.root, params],
  single: (id: string) => [...INSURANCE_COMPANY_KEYS.root, id]
}

const _useInsuranceCompaniesList = (queryParams: Ref<InsuranceCompanyQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => INSURANCE_COMPANY_KEYS.list(queryParams.value),
    query: async () => {
      const resp = await requestFetch('/api/insurance-companies', { query: queryParams.value })
      if (!resp) return
      return {
        data: resp.data.map((data) => ({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          deletedAt: data.deletedAt ? new Date(data.deletedAt) : null
        })),
        pagination: resp.pagination
      }
    }
  })
}

const _useCreateInsuranceCompany = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (companyData: InsuranceCompanyCreate) =>
      requestFetch('/api/insurance-companies', {
        method: 'POST',
        body: companyData
      }),
    onSuccess: async (_, variables) => {
      toast.add({
        title: 'Succès',
        description: `Nouvelle compagnie d'assurance ${variables.name} ajoutée`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: INSURANCE_COMPANY_KEYS.root })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Échec de la création de la compagnie d'assurance").message,
        color: 'error'
      })
    }
  })
}

const _useInsuranceCompanyById = (companyId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => INSURANCE_COMPANY_KEYS.single(toValue(companyId)),
    query: async () => {
      const data = await requestFetch(`/api/insurance-companies/${toValue(companyId)}`)
      if (!data) return
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        deletedAt: data.deletedAt ? new Date(data.deletedAt) : null
      }
    },
    enabled: () => !!toValue(companyId)
  })
}

type UpdateInsuranceCompanyParams = {
  companyId: string
  companyData: InsuranceCompanyUpdate
  onSuccess?: () => void
}
const _useUpdateInsuranceCompany = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ companyId, companyData }: UpdateInsuranceCompanyParams) =>
      requestFetch(`/api/insurance-companies/${companyId}`, {
        method: 'PATCH',
        body: companyData
      }),
    onSuccess: (_, { companyId, companyData, onSuccess }) => {
      onSuccess?.()

      toast.add({
        title: 'Succès',
        description: `Compagnie d'assurance ${companyData.name || 'mise à jour'} modifiée avec succès`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: INSURANCE_COMPANY_KEYS.root })
      queryCache.invalidateQueries({ key: INSURANCE_COMPANY_KEYS.single(companyId) })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Échec de la mise à jour de la compagnie d'assurance").message,
        color: 'error'
      })
    }
  })
}

const _useDeleteInsuranceCompany = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (companyId: string) =>
      requestFetch(`/api/insurance-companies/${companyId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, companyId) => {
      toast.add({
        title: 'Succès',
        description: "Compagnie d'assurance supprimée avec succès",
        color: 'success'
      })

      queryCache.invalidateQueries({ key: INSURANCE_COMPANY_KEYS.root })
      queryCache.invalidateQueries({ key: INSURANCE_COMPANY_KEYS.single(companyId) })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Échec de la suppression de la compagnie d'assurance").message,
        color: 'error'
      })
    }
  })
}

export const useInsuranceCompaniesList = _useInsuranceCompaniesList
export const useInsuranceCompanyById = _useInsuranceCompanyById
export const useCreateInsuranceCompany = createSharedComposable(_useCreateInsuranceCompany)
export const useUpdateInsuranceCompany = createSharedComposable(_useUpdateInsuranceCompany)
export const useDeleteInsuranceCompany = createSharedComposable(_useDeleteInsuranceCompany)
