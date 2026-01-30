<script setup lang="ts">
  const BREADCRUMBS = [{ label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' }, { label: 'Patients' }]

  const page = useRouteQuery('page', '1', { transform: Number })
  const limit = useRouteQuery('limit', '10', { transform: Number })
  const search = useRouteQuery<string>('search', '')
  const status = useRouteQuery<PatientStatus | undefined>('status', undefined)

  const queryParams = computed<PatientQuery>(() => ({
    page: page.value,
    limit: limit.value,
    status: status.value,
    search: search.value
  }))

  const { data: patients, isPending, error, refresh } = usePatientsList(queryParams)

  // Local search input state (separate from URL state for better UX)
  const searchInput = ref('')

  // Sync URL search to input on mount and when URL changes
  watch(
    search,
    (newVal) => {
      searchInput.value = newVal
    },
    { immediate: true }
  )

  const debouncedSearch = useDebounceFn((value: string) => {
    search.value = value
    page.value = 1
  }, 300)

  // Reset page when limit changes
  watch(limit, () => {
    page.value = 1
  })

  const hasActiveFilters = computed(() => search.value || status.value)

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

  const clearFilters = () => {
    search.value = ''
    status.value = undefined
    page.value = 1
  }

  const clearSearch = () => {
    searchInput.value = ''
    search.value = ''
    page.value = 1
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

  const handlePageChange = (newPage: number) => {
    page.value = newPage
  }

  const handleStatusChange = () => {
    page.value = 1
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
            v-model="searchInput"
            @input="debouncedSearch($event.target.value)"
            icon="i-hugeicons-search-01"
            placeholder="Rechercher par nom ou prénom"
            size="lg"
            class="w-full"
            aria-label="Rechercher des patients"
          >
            <template v-if="searchInput" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-hugeicons-cancel-01"
                aria-label="Effacer la recherche"
                @click="clearSearch"
              />
            </template>
          </UInput>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-3">
          <USelect
            v-model="status"
            :items="STATUS_FILTER_OPTIONS"
            size="lg"
            placeholder="Statut: Tous"
            class="min-w-40"
            aria-label="Filtrer par statut"
            @update:model-value="handleStatusChange"
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
    <div v-if="isPending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="i in 6" :key="i" variant="outline" class="h-48">
        <div class="flex items-start gap-4">
          <USkeleton class="h-14 w-14 shrink-0 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
        <div class="mt-6 space-y-3">
          <div class="flex items-center gap-3">
            <USkeleton class="h-8 w-8 shrink-0 rounded-md" />
            <USkeleton class="h-4 w-32" />
          </div>
          <div class="flex items-center gap-3">
            <USkeleton class="h-8 w-8 shrink-0 rounded-md" />
            <USkeleton class="h-4 w-40" />
          </div>
          <div class="flex items-center gap-3">
            <USkeleton class="h-8 w-8 shrink-0 rounded-md" />
            <USkeleton class="h-4 w-24" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      icon="i-hugeicons-warning-01"
      color="error"
      variant="solid"
      title="Erreur de chargement"
      :description="error.message"
      :actions="[
        {
          label: 'Réessayer',
          icon: 'i-hugeicons-refresh-01',
          onClick: () => {
            refresh()
          }
        }
      ]"
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
