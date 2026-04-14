<script setup lang="ts">
  import { LazyInsuranceCompanyForm, LazyAppModalConfirm } from '#components'

  const overlay = useOverlay()
  const formOverlay = overlay.create(LazyInsuranceCompanyForm)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const q = ref('')
  const statusFilter = ref<ConventionStatus | 'all'>('all')
  const page = ref(1)
  const limit = ref(20)

  const query = computed(() => ({
    search: q.value || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    page: page.value,
    limit: limit.value
  }))

  const { data: response, isLoading, error, refresh } = useInsuranceCompaniesList(query)

  const companies = computed(() => response.value?.data || [])
  const pagination = computed(() => response.value?.pagination)

  const openCreateModal = () => {
    formOverlay.open({
      onSuccess: async () => {
        await refresh()
      }
    })
  }

  const openEditModal = async (company: InsuranceCompany) => {
    await formOverlay.open({
      company,
      onSuccess: async () => {
        await refresh()
      }
    })
  }

  const handleDelete = async (company: InsuranceCompany) => {
    const confirmed = await confirmModal.open({
      title: "Supprimer la compagnie d'assurance",
      message: `Êtes-vous sûr de vouloir supprimer "${company.name}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-alert-02'
    })

    if (confirmed) {
      try {
        await useDeleteInsuranceCompany().mutateAsync(company.id)
        await refresh()
      } catch (err) {
        console.error('Failed to delete insurance company:', err)
      }
    }
  }

  watch([q, statusFilter], () => {
    page.value = 1
  })
</script>

<template>
  <AppDashboardPage id="settings-insurance-companies" title="Assurances">
    <UPageCard
      title="Compagnies d'assurance"
      description="Gérez vos conventions et partenaires d'assurance pour la facturation."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Nouvelle compagnie d'assurance"
        icon="i-hugeicons-plus-sign"
        color="neutral"
        class="w-fit lg:ms-auto"
        @click="openCreateModal"
      />
    </UPageCard>

    <UPageCard
      variant="subtle"
      :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }"
    >
      <template #header>
        <div class="flex flex-col gap-4 sm:flex-row">
          <UInput
            v-model="q"
            icon="i-hugeicons-search-01"
            placeholder="Rechercher une compagnie d'assurance"
            autofocus
            class="flex-1"
          />
          <USelect
            v-model="statusFilter"
            :options="[
              { label: 'Tous les statuts', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Suspendue', value: 'suspended' },
              { label: 'Terminée', value: 'terminated' }
            ]"
            class="w-full sm:w-48"
          />
        </div>
      </template>

      <div v-if="isLoading" class="p-8 text-center text-gray-500">
        <UIcon name="i-lucide-loader-2" class="mb-2 animate-spin text-4xl" />
        <p>Chargement...</p>
      </div>

      <div v-else-if="error" class="p-8 text-center text-red-500">
        <UIcon name="i-lucide-alert-circle" class="mb-2 text-4xl" />
        <p>Erreur lors du chargement des compagnies d'assurance</p>
      </div>

      <div v-else-if="companies.length === 0" class="p-8 text-center text-gray-500">
        <UIcon name="i-hugeicons-shield-01" class="mb-2 text-4xl" />
        <p>Aucune compagnie d'assurance trouvée</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="company in companies"
          :key="company.id"
          class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h3 class="truncate font-medium text-gray-900">{{ company.name }}</h3>

              <UBadge
                size="md"
                :color="company.status === 'active' ? 'success' : company.status === 'suspended' ? 'warning' : 'error'"
                variant="subtle"
                class="rounded-full uppercase"
              >
                <UChip standalone inset />
                {{ company.status }}
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-gray-500">Code: {{ company.code }}</p>
            <div class="mt-2 flex items-center gap-4 text-sm">
              <span class="text-gray-600">
                <UIcon name="i-hugeicons-percent" class="mr-1 inline h-4 w-4" />
                Couverture: {{ company.coveragePercentage }}%
              </span>
              <span class="text-gray-600">
                <UIcon name="i-hugeicons-tag-01" class="mr-1 inline h-4 w-4" />
                Prix: {{ company.sessionPriceCents / 100 }} DH
              </span>
              <span class="text-gray-600">
                <UIcon name="i-hugeicons-wallet-02" class="mr-1 inline h-4 w-4" />
                Co-paiement:
                {{
                  company.coPayRule === 'fixed'
                    ? `${company.coPayAmountCents! / 100} DH`
                    : `${company.coPayPercentage}%`
                }}
              </span>
            </div>
          </div>
          <div class="ml-4 flex items-center gap-2">
            <UButton
              icon="i-hugeicons-edit-01"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="openEditModal(company)"
            />
            <UButton
              icon="i-hugeicons-delete-01"
              variant="ghost"
              color="error"
              size="sm"
              @click="handleDelete(company)"
            />
          </div>
        </div>
      </div>

      <template v-if="pagination && pagination.totalPages > 1" #footer>
        <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p class="text-sm text-gray-600">
            Affichage de {{ (pagination.page - 1) * pagination.limit + 1 }} à
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} sur {{ pagination.total }} compagnies
          </p>
          <div class="flex gap-2">
            <UButton variant="ghost" size="sm" :disabled="!pagination.hasPrev" @click="page--">Précédent</UButton>
            <UButton variant="ghost" size="sm" :disabled="!pagination.hasNext" @click="page++">Suivant</UButton>
          </div>
        </div>
      </template>
    </UPageCard>
  </AppDashboardPage>
</template>
