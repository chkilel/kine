<script setup lang="ts">
  // Constants
  const BREADCRUMBS = [{ label: 'Accueil', icon: 'i-lucide-home', to: '/' }, { label: 'Patients' }]

  const requestFetch = useRequestFetch()

  // Get current route
  const route = useRoute()
  const router = useRouter()

  // Initialize state from URL query parameters
  const statusFilter = ref((route.query.status as string) || 'all')
  const searchFilter = ref((route.query.search as string) || '')
  const pagination = ref({
    pageIndex: (parseInt(route.query.page as string) || 1) - 1,
    pageSize: parseInt(route.query.limit as string) || 10
  })

  // Debounced search function using VueUse
  const debouncedSearch = useDebounceFn((searchValue: string) => {
    debouncedSearchFilter.value = searchValue
    // Reset to first page when searching
    pagination.value.pageIndex = 0
    updateURL()
  }, 300)

  const debouncedSearchFilter = ref((route.query.search as string) || '')

  // Watch search filter and trigger debounced search
  watch(searchFilter, (newValue) => {
    debouncedSearch(newValue)
  })

  // Update URL with current state
  const updateURL = () => {
    const query: Record<string, string | undefined> = {
      page: pagination.value.pageIndex + 1 > 1 ? String(pagination.value.pageIndex + 1) : undefined,
      limit: pagination.value.pageSize !== 10 ? String(pagination.value.pageSize) : undefined,
      search: debouncedSearchFilter.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined
    }

    // Remove undefined values
    Object.keys(query).forEach((key) => query[key] === undefined && delete query[key])

    router.replace({ query })
  }

  // Reactive query parameters
  const queryParams = computed(() => ({
    page: pagination.value.pageIndex + 1,
    limit: pagination.value.pageSize,
    search: debouncedSearchFilter.value || undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined
  }))

  const { data, isPending } = useQuery({
    key: () => ['patients', queryParams.value],
    query: () => requestFetch('/api/patients', { query: queryParams.value })
  })

  // Reset to first page when filters change and update URL
  watch([statusFilter], () => {
    pagination.value.pageIndex = 0
    updateURL()
  })

  // Update URL when pagination changes
  watch(
    () => pagination.value.pageIndex,
    () => {
      updateURL()
    }
  )

  // Update URL when page size changes
  watch(
    () => pagination.value.pageSize,
    () => {
      pagination.value.pageIndex = 0
      updateURL()
    }
  )

  // Check if any filters are active
  const hasActiveFilters = computed(() => {
    return debouncedSearchFilter.value.length > 0 || statusFilter.value !== 'all'
  })

  // Empty state configuration based on filters
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
            onClick: () => {
              searchFilter.value = ''
              statusFilter.value = 'all'
            }
          }
        ]
      }
    } else {
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
    }
  })
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
            <div class="bg-border h-4 w-px"></div>
            <UBreadcrumb :items="BREADCRUMBS" />
          </div>
        </template>

        <template #right>
          <UChip inset size="xl">
            <UButton icon="i-lucide-bell" color="neutral" variant="soft" class="rounded-full" />
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
                  v-model="searchFilter"
                  icon="i-lucide-search"
                  placeholder="Rechercher par nom ou prénom"
                  size="lg"
                  class="w-full"
                >
                  <template v-if="searchFilter?.length" #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-x"
                      aria-label="Effacer le champ de recherche"
                      @click="searchFilter = ''"
                    />
                  </template>
                </UInput>
              </div>

              <!-- Filters -->
              <div class="flex items-center gap-3">
                <USelect
                  v-model="statusFilter"
                  :items="STATUS_FILTER_OPTIONS"
                  size="lg"
                  placeholder="Statut: Tous"
                  class="min-w-40"
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

          <!-- Patient Cards Grid -->
          <div v-if="isPending" class="space-y-4">
            <USkeleton v-for="i in 5" :key="i" class="bg-default h-24 w-full" />
          </div>

          <div v-else-if="data?.data && data.data.length > 0" class="space-y-2">
            <UCard
              v-for="patient in data.data"
              :key="patient.id"
              variant="outline"
              tabindex="0"
              class="group hover:border-primary/20 focus-visible:border-primary cursor-pointer border border-transparent transition-all duration-200 hover:shadow-md focus-visible:shadow focus-visible:outline-none"
              :ui="{
                body: 'p-4 sm:p-5'
              }"
              @click="navigateTo(`/patients/${patient.id}`)"
              @keydown.enter="navigateTo(`/patients/${patient.id}`)"
            >
              <div class="grid gap-4 sm:grid-cols-5">
                <!-- Patient Info Section -->
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

                <!-- Contact Info - Hidden on mobile -->
                <div class="min-w-0 space-y-2 self-center">
                  <div v-if="patient.phone" class="text-foreground flex items-center gap-2 text-sm font-medium">
                    <UIcon name="i-lucide-phone" class="text-muted size-4" />
                    {{ patient.phone }}
                  </div>
                  <span v-else class="text-muted">-</span>
                  <div v-if="patient.email" class="text-muted flex items-center gap-1 text-sm">
                    <UIcon name="i-lucide-mail" class="size-4" />
                    <span class="truncate">{{ patient.email }}</span>
                  </div>
                </div>

                <!-- Date of Birth - Hidden on mobile, shown on tablet+ -->
                <div class="hidden min-w-0 self-center md:block">
                  <p class="text-foreground font-medium">{{ formatDate(patient.dateOfBirth) }}</p>
                  <p class="text-muted text-xs">({{ getAge(patient.dateOfBirth) }} ans)</p>
                </div>

                <!-- Status and Actions -->
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

          <!-- Empty State -->
          <div v-else>
            <UCard variant="outline">
              <UEmpty
                variant="naked"
                size="xl"
                :icon="emptyStateConfig.icon"
                :title="emptyStateConfig.title"
                :description="emptyStateConfig.description"
                :actions="emptyStateConfig.actions"
              />
            </UCard>
          </div>

          <!-- Pagination -->
          <div
            v-if="data?.data && data.data.length > 0"
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
              @update:page="
                (p: number) => {
                  pagination.pageIndex = p - 1
                }
              "
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
