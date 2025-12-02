<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import type { SerializeObject } from 'nitropack/types'

  const UAvatar = resolveComponent('UAvatar')
  const UButton = resolveComponent('UButton')
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UBreadcrumb = resolveComponent('UBreadcrumb')
  const UIcon = resolveComponent('UIcon')

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

  const { data, status, isPending } = useQuery({
    key: () => {
      const params = queryParams.value
      return ['patients', params]
    },
    query: () => requestFetch('/api/patients', { query: queryParams.value })
  })

  const table = useTemplateRef('table')
  const columnVisibility = ref({})

  const columns: TableColumn<SerializeObject<Patient>>[] = [
    { accessorKey: 'name', header: 'Nom' },
    { accessorKey: 'contact', header: 'Contact' },
    { accessorKey: 'dateOfBirth', header: 'Date de Naissance' },
    { accessorKey: 'status', header: 'Statut' },
    { accessorKey: 'insuranceProvider', header: 'Assurance' }
  ]

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
</script>

<template>
  <UDashboardPanel id="patients" class="bg-elevated">
    <template #header>
      <UDashboardNavbar title="Patients">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>notif</template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <!-- Breadcrumbs -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <UBreadcrumb :items="BREADCRUMBS" />

            <UButton
              icon="i-lucide-plus"
              label="Ajouter un patient"
              @click="navigateTo('/patients/new')"
              class="hidden sm:flex"
            />
            <UButton icon="i-lucide-plus" label="Patient" @click="navigateTo('/patients/new')" class="sm:hidden" />
          </div>

          <!-- Page Header -->

          <!-- Filters Card -->
          <UCard class="mb-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <!-- Search Input -->
              <div class="lg:col-span-1">
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
              <div class="flex items-center justify-start gap-3 overflow-x-auto md:justify-end lg:col-span-2">
                <USelect
                  v-model="statusFilter"
                  :items="STATUS_FILTER_OPTIONS"
                  placeholder="Filtrer par statut"
                  class="min-w-40"
                />

                <UDropdownMenu
                  :items="
                    table?.tableApi
                      ?.getAllColumns()
                      .filter((column: any) => column.getCanHide())
                      .map((column: any) => ({
                        label: column.columnDef.header,
                        type: 'checkbox' as const,
                        checked: column.getIsVisible(),
                        onUpdateChecked(checked: boolean) {
                          table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                        },
                        onSelect(e?: Event) {
                          e?.preventDefault()
                        }
                      }))
                  "
                  :content="{ align: 'end' }"
                >
                  <UButton label="Affichage" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
                </UDropdownMenu>
              </div>
            </div>
          </UCard>

          <!-- Table Card -->
          <UCard>
            <UTable
              ref="table"
              v-model:column-visibility="columnVisibility"
              :data="data?.data || []"
              :columns="columns"
              :loading="isPending"
              @select="(_e, row) => navigateTo(`/patients/${row.original.id}`)"
              :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                tr: 'cursor-pointer hover:bg-muted/50'
              }"
            >
              <!-- Custom cell for the 'name' column -->
              <template #name-cell="{ row }">
                <div class="flex items-center gap-3">
                  <UAvatar
                    size="lg"
                    :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(formatFullName(row.original))}&background=random`"
                  />
                  <div class="group">
                    <p class="text-foreground group-hover:text-primary font-semibold transition-colors">
                      {{ formatFullName(row.original) }}
                    </p>
                    <div v-if="row.original.email" class="text-muted text-xs">
                      {{ row.original.email }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Custom cell for the 'phone' column -->
              <template #contact-cell="{ row }">
                <div v-if="row.original.phone" class="text-sm">
                  {{ row.original.phone }}
                </div>
                <span v-else class="text-muted">-</span>
              </template>

              <!-- Custom cell for the 'dateOfBirth' column -->
              <template #dateOfBirth-cell="{ row }">
                <p class="font-semibold">{{ formatDate(row.original.dateOfBirth) }}</p>
                <div class="text-muted text-xs">({{ getAge(row.original.dateOfBirth) }} ans)</div>
              </template>
              <!-- Custom cell for the 'status' column -->
              <template #status-cell="{ row }">
                <UBadge
                  variant="subtle"
                  :color="STATUS_CONFIG[row.original.status]?.color || 'neutral'"
                  class="capitalize"
                >
                  {{ STATUS_CONFIG[row.original.status]?.label || row.original.status }}
                </UBadge>
              </template>
            </UTable>
            <!-- Table Footer with Pagination -->
            <div v-if="data?.data && data.data.length > 0" class="border-accented border-t px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="text-muted text-sm">
                  Affichage de
                  <span class="font-medium">
                    {{ (data.pagination.page - 1) * data.pagination.limit + 1 }}-{{
                      Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)
                    }}
                  </span>
                  sur
                  <span class="font-medium">{{ data.pagination.total }}</span>
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

            <!-- Empty State -->
            <div v-else-if="status === 'success' && data?.data && data.data.length === 0" class="py-12 text-center">
              <UIcon name="i-lucide-users" class="text-muted mx-auto mb-4 text-6xl" />
              <h3 class="text-foreground mb-2 text-lg font-medium">Aucun patient trouvé</h3>
              <p class="text-muted mb-4">Commencez par ajouter votre premier patient</p>
              <UButton label="Ajouter un patient" icon="i-lucide-plus" @click="navigateTo('/patients/new')" />
            </div>
          </UCard>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
