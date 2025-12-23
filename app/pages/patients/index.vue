<script setup lang="ts">
  // Constants
  const BREADCRUMBS = [{ label: 'Accueil', icon: 'i-lucide-home', to: '/' }, { label: 'Patients' }]

  const route = useRoute()
  const router = useRouter()

  // Query state - single source of truth
  const queryParams = ref<PatientQuery>({
    page: Number(route.query.page) || 1,
    limit: Number(route.query.limit) || 10,
    status: (route.query.status as PatientStatus) || undefined,
    search: (route.query.search as string) || ''
  })

  // Fetch data
  const { data, isPending, error } = usePatientsList(queryParams)

  // Debounced search
  const debouncedSearch = useDebounceFn((searchValue: string) => {
    queryParams.value.search = searchValue
    queryParams.value.page = 1 // Reset to first page when searching
    updateURL()
  }, 300)

  // Watch search and trigger debounced search
  watch(
    () => queryParams.value.search,
    () => queryParams.value.search && debouncedSearch(queryParams.value.search)
  )

  // Update URL with current query params
  const updateURL = () => {
    const query: Record<string, string> = {}

    if (queryParams.value.page > 1) query.page = queryParams.value.page.toString()
    if (queryParams.value.limit !== 10) query.limit = queryParams.value.limit.toString()
    if (queryParams.value.search) query.search = queryParams.value.search
    if (queryParams.value.status) query.status = queryParams.value.status

    router.replace({ query })
  }

  // Watch all query params and update URL
  watch(
    () => [queryParams.value.status, queryParams.value.limit],
    () => {
      queryParams.value.page = 1 // Reset page when filters change
      updateURL()
    }
  )

  watch(() => queryParams.value.page, updateURL)

  // Computed properties
  const hasActiveFilters = computed(() => {
    return queryParams.value.search || queryParams.value.status
  })

  const emptyStateConfig = computed(() => {
    if (hasActiveFilters.value) {
      return {
        icon: 'i-lucide-search-x',
        title: 'Aucun patient trouvé',
        description: 'Essayez de modifier votre recherche ou vos filtres pour trouver des résultats',
        actions: [
          {
            icon: 'i-lucide-refresh-ccw',
            label: 'Effacer les filtres',
            variant: 'subtle' as const,
            onClick: clearFilters
          }
        ]
      }
    }

    return {
      icon: 'i-lucide-users',
      title: 'Aucun patient',
      description: 'Commencez par ajouter votre premier patient',
      actions: [
        {
          icon: 'i-lucide-plus',
          label: 'Ajouter un patient',
          variant: 'subtle' as const,
          onClick: () => navigateTo('/patients/new')
        }
      ]
    }
  })

  // Methods
  const clearFilters = () => {
    queryParams.value.search = ''
    queryParams.value.status = undefined
  }

  const handlePatientClick = (patient: Patient) => {
    navigateTo(`/patients/${patient.id}`)
  }

  const handlePatientKeydown = (event: KeyboardEvent, patient: Patient) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigateTo(`/patients/${patient.id}`)
    }
  }

  const handlePageChange = (page: number) => {
    queryParams.value.page = page
  }
</script>

<template>
  <UDashboardPanel id="patients" class="bg-elevated">
    <template #header>
      <UDashboardNavbar class="bg-default/75">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <div class="flex items-center gap-4">
            <h1 class="text-foreground text-xl font-bold">Patients</h1>
            <div class="bg-border h-4 w-px" />
            <UBreadcrumb :items="BREADCRUMBS" />
          </div>
        </template>

        <template #right>
          <UChip inset size="xl">
            <UButton
              icon="i-lucide-bell"
              color="neutral"
              variant="soft"
              class="rounded-full"
              aria-label="Notifications"
            />
          </UChip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="space-y-6">
          <!-- Filters Section -->
          <UCard variant="outline">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <!-- Search Input -->
              <div class="flex-1">
                <UInput
                  v-model="queryParams.search"
                  icon="i-lucide-search"
                  placeholder="Rechercher par nom ou prénom"
                  size="lg"
                  class="w-full"
                  aria-label="Rechercher des patients"
                >
                  <template v-if="queryParams.search" #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-x"
                      aria-label="Effacer la recherche"
                      @click="queryParams.search = ''"
                    />
                  </template>
                </UInput>
              </div>

              <!-- Filters -->
              <div class="flex items-center gap-3">
                <USelect
                  v-model="queryParams.status"
                  :items="STATUS_FILTER_OPTIONS"
                  size="lg"
                  placeholder="Statut: Tous"
                  class="min-w-40"
                  aria-label="Filtrer par statut"
                />

                <UButton
                  icon="i-lucide-plus"
                  label="Ajouter un patient"
                  size="lg"
                  @click="navigateTo('/patients/new')"
                  class="hidden sm:flex"
                />
                <UButton
                  icon="i-lucide-plus"
                  block
                  label="Patient"
                  @click="navigateTo('/patients/new')"
                  class="sm:hidden"
                />
              </div>
            </div>
          </UCard>

          <!-- Loading State -->
          <div v-if="isPending" class="space-y-4">
            <USkeleton v-for="i in 5" :key="i" class="h-24 w-full" :ui="{ background: 'bg-default' }" />
          </div>

          <!-- Error State -->
          <UAlert
            v-else-if="error"
            icon="i-lucide-alert-circle"
            color="error"
            variant="solid"
            title="Erreur de chargement"
            :description="error.message"
          />

          <!-- Patient List -->
          <template v-else>
            <!-- Empty State -->
            <UCard v-if="!data?.data?.length" variant="outline" class="overflow-hidden">
              <UEmpty
                :icon="emptyStateConfig.icon"
                :title="emptyStateConfig.title"
                :description="emptyStateConfig.description"
                :actions="emptyStateConfig.actions"
                class="py-12"
              />
            </UCard>

            <!-- Patient Cards -->
            <div v-else class="space-y-2">
              <UCard
                v-for="patient in data.data"
                :key="patient.id"
                variant="outline"
                class="group hover:border-primary/20 focus-visible:border-primary cursor-pointer border border-transparent transition-all duration-200 hover:shadow-md focus-visible:shadow focus-visible:outline-none"
                :ui="{
                  body: 'p-4 sm:p-5'
                }"
                tabindex="0"
                role="button"
                aria-label="Voir les détails du patient"
                @click="handlePatientClick(patient)"
                @keydown="handlePatientKeydown($event, patient)"
              >
                <div class="grid gap-4 sm:grid-cols-5">
                  <!-- Patient Info -->
                  <div class="col-span-2 flex min-w-0 gap-4">
                    <!-- Avatar -->
                    <div
                      class="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                      :class="[
                        getAvatarBgColor(patient.firstName, patient.lastName),
                        getAvatarTextColor(patient.firstName, patient.lastName)
                      ]"
                    >
                      {{ patient.firstName[0] }}{{ patient.lastName[0] }}
                    </div>

                    <!-- Name -->
                    <div class="min-w-0 flex-1">
                      <h3 class="text-foreground group-hover:text-primary truncate font-semibold transition-colors">
                        {{ patient.firstName }}
                        <br />
                        {{ patient.lastName }}
                      </h3>
                    </div>
                  </div>

                  <!-- Contact Info -->
                  <div class="min-w-0 space-y-2 self-center">
                    <div v-if="patient.phone" class="text-foreground flex items-center gap-2 text-sm font-medium">
                      <UIcon name="i-lucide-phone" class="text-muted size-4" />
                      {{ patient.phone }}
                    </div>
                    <span v-else class="text-muted text-sm">-</span>

                    <div v-if="patient.email" class="text-muted flex items-center gap-1 text-sm">
                      <UIcon name="i-lucide-mail" class="size-4" />
                      <span class="truncate">{{ patient.email }}</span>
                    </div>
                  </div>

                  <!-- Date of Birth -->
                  <div class="hidden min-w-0 self-center md:block">
                    <p class="text-foreground font-medium">
                      {{ formatFrenchDate (patient.dateOfBirth) }}
                    </p>
                    <p class="text-muted text-xs">({{ calculateAge(patient.dateOfBirth) }} ans)</p>
                  </div>

                  <!-- Status -->
                  <div class="self-center sm:justify-self-end">
                    <UBadge
                      variant="subtle"
                      size="lg"
                      :color="STATUS_CONFIG[patient.status]?.color || 'neutral'"
                      class="rounded-full px-4 font-semibold capitalize"
                    >
                      {{ STATUS_CONFIG[patient.status]?.label || patient.status }}
                    </UBadge>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Pagination -->
            <div
              v-if="data?.pagination && data?.pagination?.total > 0"
              class="border-default flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="text-muted text-sm">
                Affichage de
                <span class="text-foreground font-medium">
                  {{ (data.pagination.page - 1) * data.pagination.limit + 1 }}-{{
                    Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)
                  }}
                </span>
                sur
                <span class="text-foreground font-medium">{{ data.pagination.total }}</span>
                résultats
              </div>

              <UPagination
                :page="data.pagination.page"
                :items-per-page="data.pagination.limit"
                :total="data.pagination.total"
                @update:page="handlePageChange"
              />
            </div>
          </template>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
