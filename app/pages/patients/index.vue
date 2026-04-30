<script setup lang="ts">
  import type { TableColumn, TableRow } from '@nuxt/ui'

  // ─── Query params ────────────────────────────────────────────
  const page = useRouteQuery('page', 1, { transform: Number })
  const limit = useRouteQuery('limit', 10, { transform: Number })
  const search = useRouteQuery<string>('search', '')
  const status = useRouteQuery<PatientStatus | undefined>('status', undefined)

  const queryParams = computed<PatientQuery>(() => ({
    page: page.value,
    limit: limit.value,
    status: status.value,
    search: search.value
  }))

  // ─── Data fetching ───────────────────────────────────────────
  const { data: patients, isPending, error, refresh } = usePatientsList(queryParams)

  // ─── Search ──────────────────────────────────────────────────
  const searchInput = ref('')

  watch(search, (newVal) => (searchInput.value = newVal), { immediate: true })

  const debouncedSearch = useDebounceFn((value: string) => {
    search.value = value
    page.value = 1
  }, 300)

  watch(limit, () => (page.value = 1))

  function clearSearch() {
    searchInput.value = ''
    search.value = ''
    page.value = 1
  }

  // ─── Computed ────────────────────────────────────────────────
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
      icon: 'i-hugeicons-user-group',
      title: 'Aucun patient',
      description: 'Commencez par ajouter votre premier patient',
      actions: [
        {
          icon: 'i-hugeicons-plus-sign',
          label: 'Ajouter un patient',
          variant: 'subtle' as const,
          onClick: async () => await navigateTo('/patients/new')
        }
      ]
    }
  })

  // ─── Actions ─────────────────────────────────────────────────
  function clearFilters() {
    search.value = ''
    status.value = undefined
    page.value = 1
  }

  async function handlePatientKeydown(event: KeyboardEvent, patient: Patient) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      await navigateTo(`/patients/${patient.id}`)
    }
  }

  function handlePageChange(newPage: number) {
    page.value = newPage
  }

  function handleStatusChange() {
    page.value = 1
  }

  async function handleRowClick(_e: Event, row: TableRow<Patient>) {
    await navigateTo(`/patients/${row.original.id}`)
  }

  // ─── Table columns ───────────────────────────────────────────
  const UIcon = resolveComponent('UIcon')
  const UBadge = resolveComponent('UBadge')
  const UButton = resolveComponent('UButton')

  const columns: TableColumn<Patient>[] = [
    {
      accessorKey: 'name',
      header: 'Patient',
      cell: ({ row }) => {
        const patient = row.original
        return h('div', { class: 'flex items-center gap-3' }, [
          h(
            'div',
            {
              class: [
                'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                getAvatarBgColor(patient.firstName, patient.lastName),
                getAvatarTextColor(patient.firstName, patient.lastName)
              ]
            },
            `${patient.firstName[0]}${patient.lastName[0]}`
          ),
          h('div', { class: 'min-w-0' }, [
            h('div', { class: 'font-semibold text-highlighted' }, `${patient.lastName} ${patient.firstName}`),
            h('div', { class: 'text-xs' }, `Dossier #${patient.id.slice(0, 10)}`)
          ])
        ])
      }
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const patient = row.original
        return h('div', { class: 'flex flex-col gap-1 text-sm' }, [
          patient.phone
            ? h('div', { class: 'flex items-center gap-2' }, [
                h(UIcon, { name: 'i-hugeicons-call-02', class: 'size-4' }),
                h('span', {}, patient.phone)
              ])
            : null,
          patient.email
            ? h('div', { class: 'flex items-center gap-2' }, [
                h(UIcon, { name: 'i-hugeicons-mail-01', class: 'size-4' }),
                h('span', { class: 'truncate max-w-[200px]' }, patient.email)
              ])
            : null
        ])
      }
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Age',
      cell: ({ row }) => {
        const patient = row.original
        const age = calculateAge(patient.dateOfBirth)
        return h('div', { class: 'flex flex-col gap-0.5' }, [
          h('span', { class: ' text-[13px] text-default' }, formatDate(patient.dateOfBirth)),
          h(UBadge, { color: 'neutral', variant: 'soft', size: 'sm', class: 'w-fit' }, () => `${age} ans`)
        ])
      }
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const patient = row.original
        return h(
          UBadge,
          {
            color: getPatientStatusColor(patient.status),
            variant: 'subtle',
            size: 'md'
          },
          () => getPatientStatusLabel(patient.status)
        )
      }
    }
  ]
</script>

<template>
  <AppDashboardPage id="patients">
    <!-- Filters Section -->
    <UPageCard variant="naked" title="Patients" orientation="horizontal">
      <div class="flex items-center gap-2 justify-self-end">
        <UInput
          v-model="searchInput"
          @update:modelValue="debouncedSearch"
          icon="i-hugeicons-search-01"
          placeholder="Rechercher par nom ou prénom"
          size="lg"
          class="flex-1 md:min-w-80"
          aria-label="Rechercher des patients"
        >
          <template v-if="searchInput" #trailing>
            <UButton
              color="neutral"
              variant="link"
              icon="i-hugeicons-cancel-01"
              aria-label="Effacer la recherche"
              @click="clearSearch"
            />
          </template>
        </UInput>
        <!-- Filters -->
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
    </UPageCard>

    <!-- Error State -->
    <UAlert
      v-if="error"
      icon="i-hugeicons-warning-01"
      color="error"
      variant="subtle"
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

    <!-- Patient Table -->
    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="patients?.data"
        :columns="columns"
        :loading="isPending"
        loading-color="primary"
        loading-animation="carousel"
        class="w-full"
        @select="handleRowClick"
        :ui="{
          tbody: 'divide-y divide-(--ui-bg-muted)',
          thead: 'bg-muted',
          th: 'uppercase font-semibold text-xs text-muted',
          td: 'hover:cursor-pointer',
          separator: 'bg-muted'
        }"
      >
        <template #empty>
          <!-- Empty State -->
          <UEmpty
            :icon="emptyStateConfig.icon"
            :title="emptyStateConfig.title"
            :description="emptyStateConfig.description"
            :actions="emptyStateConfig.actions"
            variant="naked"
            size="xl"
            class="py-12"
          />
        </template>
      </UTable>

      <!-- Pagination -->
      <div
        v-if="patients?.pagination && patients?.pagination?.total > 0"
        class="bg-muted flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="text-muted text-sm">
          Affichage de
          <span class="font-medium">
            {{ (patients.pagination.page - 1) * patients.pagination.limit + 1 }}-{{
              Math.min(patients.pagination.page * patients.pagination.limit, patients.pagination.total)
            }}
            sur
          </span>
          <span class="font-medium">{{ patients.pagination.total }}</span>
          résultats
        </div>

        <UPagination
          :page="patients.pagination.page"
          :items-per-page="patients.pagination.limit"
          :total="patients.pagination.total"
          @update:page="handlePageChange"
        />
      </div>
    </UCard>
  </AppDashboardPage>
</template>
