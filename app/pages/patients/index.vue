<script setup lang="ts">
  // Constants
  const BREADCRUMBS = [{ label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' }, { label: 'Patients' }]

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
  const { data: patients, isPending, error } = usePatientsList(queryParams)

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
        icon: 'i-hugeicons-user-search-01',
        title: 'Aucun patient trouvé',
        description: 'Essayez de modifier votre recherche ou vos filtres pour trouver des résultats',
        actions: [
          {
            icon: 'i-hugeicons-refresh-01',
            label: 'Effacer les filtres',
            variant: 'subtle' as const,
            onClick: clearFilters
          }
        ]
      }
    }

    return {
      icon: 'i-hugeicons-user-group-01',
      title: 'Aucun patient',
      description: 'Commencez par ajouter votre premier patient',
      actions: [
        {
          icon: 'i-hugeicons-plus-sign',
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

    updateURL()
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
  <AppDashboardPage id="patients" title="Patients" :breadcrumbs="BREADCRUMBS">
    <!-- Filters Section -->
    <UCard variant="outline">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <!-- Search Input -->
        <div class="flex-1">
          <UInput
            v-model="queryParams.search"
            icon="i-hugeicons-search-01"
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
                icon="i-hugeicons-cancel-01"
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
            icon="i-hugeicons-plus-sign"
            label="Ajouter un patient"
            size="lg"
            @click="navigateTo('/patients/new')"
            class="hidden sm:flex"
          />
          <UButton
            icon="i-hugeicons-plus-sign"
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
      icon="i-hugeicons-warning-01"
      color="error"
      variant="solid"
      title="Erreur de chargement"
      :description="error.message"
    />

    <!-- Patient List -->
    <template v-else>
      <!-- Empty State -->
      <UCard v-if="!patients?.data?.length" variant="outline" class="overflow-hidden">
        <UEmpty
          :icon="emptyStateConfig.icon"
          :title="emptyStateConfig.title"
          :description="emptyStateConfig.description"
          :actions="emptyStateConfig.actions"
          size="xl"
          class="py-12"
        />
      </UCard>

      <!-- Patient Cards -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="patient in patients.data"
          :key="patient.id"
          variant="outline"
          class="group hover:ring-accented flex flex-col justify-between ring transition-all duration-200 hover:shadow-md focus-visible:shadow focus-visible:outline-none"
          :ui="{ body: 'p-5' }"
          tabindex="0"
          role="button"
          aria-label="Voir les détails du patient"
          @click="handlePatientClick(patient)"
          @keydown="handlePatientKeydown($event, patient)"
        >
          <div>
            <!-- Top Section: Avatar, Name, Status -->
            <div class="mb-4 flex cursor-pointer items-start justify-between">
              <!-- LEFT SIDE -->
              <div class="group/link flex min-w-0 items-center gap-3">
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
                <div class="min-w-0">
                  <h3 class="text-foreground group-hover/link:text-primary truncate font-bold transition-colors">
                    {{ patient.lastName }}
                    <span class="text-muted-foreground font-normal">
                      {{ patient.firstName }}
                    </span>
                  </h3>
                  <p class="text-muted-foreground truncate text-xs">Dossier #{{ patient.id }}</p>
                </div>
              </div>

              <!-- RIGHT SIDE -->
              <UBadge
                variant="subtle"
                size="lg"
                :color="STATUS_CONFIG[patient.status]?.color || 'neutral'"
                class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {{ STATUS_CONFIG[patient.status]?.label || patient.status }}
              </UBadge>
            </div>

            <!-- Section: Contact Info -->
            <div class="flex flex-col gap-3">
              <!-- Phone -->
              <div v-if="patient.phone" class="flex items-center gap-3 text-sm">
                <div class="bg-muted text-muted-foreground flex place-content-center rounded-md p-1.5">
                  <UIcon name="i-hugeicons-call-02" class="size-4.5" />
                </div>
                <a
                  class="text-foreground hover:text-primary font-medium hover:underline"
                  :href="`tel:${patient.phone}`"
                  @click.stop
                >
                  {{ patient.phone }}
                </a>
              </div>

              <!-- Email -->
              <div v-if="patient.email" class="flex items-center gap-3 text-sm">
                <div class="bg-muted text-muted-foreground flex place-content-center rounded-md p-1.5">
                  <UIcon name="i-hugeicons-mail-01" class="size-4.5" />
                </div>
                <a
                  class="text-muted-foreground hover:text-primary truncate hover:underline"
                  :href="`mailto:${patient.email}`"
                  @click.stop
                >
                  {{ patient.email }}
                </a>
              </div>

              <!-- Date of Birth -->
              <div class="flex items-center gap-2 text-sm">
                <div class="bg-muted text-muted-foreground flex place-content-center rounded-md p-1.5">
                  <UIcon name="i-hugeicons-birthday-cake" class="size-4.5" />
                </div>
                <span class="text-foreground">
                  {{ formatFrenchDate(patient.dateOfBirth) }}
                </span>
                &middot
                <UBadge color="neutral" variant="soft" class="font-medium">
                  {{ calculateAge(patient.dateOfBirth) }} ans
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Pagination -->
      <div
        v-if="patients?.pagination && patients?.pagination?.total > 0"
        class="border-default flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="text-muted text-sm">
          Affichage de
          <span class="text-foreground font-medium">
            {{ (patients.pagination.page - 1) * patients.pagination.limit + 1 }}-{{
              Math.min(patients.pagination.page * patients.pagination.limit, patients.pagination.total)
            }}
          </span>
          sur
          <span class="text-foreground font-medium">{{ patients.pagination.total }}</span>
          résultats
        </div>

        <UPagination
          :page="patients.pagination.page"
          :items-per-page="patients.pagination.limit"
          :total="patients.pagination.total"
          @update:page="handlePageChange"
        />
      </div>
    </template>
  </AppDashboardPage>
</template>
