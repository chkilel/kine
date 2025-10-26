<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import { upperFirst } from 'scule'
  import { getPaginationRowModel } from '@tanstack/table-core'
  import type { Row } from '@tanstack/table-core'
  import { LazyOrganizationsCreateModal } from '#components'

  const UButton = resolveComponent('UButton')
  const UBadge = resolveComponent('UBadge')
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UAvatar = resolveComponent('UAvatar')
  const UCheckbox = resolveComponent('UCheckbox')

  const toast = useToast()
  const table = useTemplateRef('table')
  const overlay = useOverlay()

  // Logo map
  const logoUrlMap = ref<Record<string, string>>({})
  const logoKeys = computed(() => (organizations.value || []).map((org) => org.logo).filter((k) => !!k))

  // Table state
  const columnFilters = ref([{ id: 'name', value: '' }])
  const columnVisibility = ref()
  const rowSelection = ref({})

  // Table data
  const orgList = authClient.useListOrganizations()
  const organizations = computed(() => Array.from(orgList.value?.data ?? []))

  // Create modal instance
  const createOrganizationModal = overlay.create(LazyOrganizationsCreateModal)

  // Function to open the create organization modal
  async function openCreateOrganizationModal() {
    const result = await createOrganizationModal.open({
      title: 'Créer une organisation'
    })
  }

  watch(
    logoKeys,
    async (keys) => {
      const newKeys = keys.filter((k) => k && !(k in logoUrlMap.value))
      if (!newKeys.length) return

      try {
        const response = await $fetch('/api/r2/blobs', { params: { keys: newKeys } })

        if (response?.urls) {
          for (const [k, u] of Object.entries(response.urls)) {
            if (u) logoUrlMap.value[k] = u
          }
        }
      } catch {
        // Ignore logo fetch errors
      }
    },
    { immediate: true }
  )

  // Row actions
  function getRowItems(row: Row<any>) {
    const org = row.original
    return [
      { type: 'label', label: 'Actions' },
      {
        label: "Copier l'ID de l'organisation",
        icon: 'i-lucide-copy',
        onSelect() {
          navigator.clipboard.writeText(org.id.toString())
          toast.add({
            title: 'Copié dans le presse-papiers',
            description: "ID de l'organisation copié dans le presse-papiers"
          })
        }
      },
      { type: 'separator' },
      {
        label: 'Voir les membres',
        icon: 'i-lucide-users',
        onSelect: () => toast.add({ title: 'Navigation', description: `Membres de ${org.name}`, color: 'info' })
      },
      {
        label: 'Paramètres',
        icon: 'i-lucide-settings',
        onSelect: () => toast.add({ title: 'Navigation', description: `Paramètres de ${org.name}`, color: 'info' })
      },
      { type: 'separator' },
      {
        label: 'Définir comme active',
        icon: 'i-lucide-check',
        onSelect: async () => {
          try {
            const { error } = await authClient.organization.setActive({
              organizationId: org.id,
              organizationSlug: org.slug
            })
            if (error) throw new Error(error.message)
            toast.add({ title: 'Succès', description: `${org.name} est maintenant active`, color: 'success' })
          } catch {
            toast.add({ title: 'Erreur', description: 'Impossible de définir comme active', color: 'error' })
          }
        }
      },
      { type: 'separator' },
      {
        label: "Supprimer l'organisation",
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect() {
          toast.add({
            title: 'Organisation supprimée',
            description: "L'organisation a été supprimée."
          })
        }
      }
    ]
  }

  // Column labels mapping for localized names
  const columnLabels: Record<string, string> = {
    name: 'Nom',
    memberCount: 'Membres',
    createdAt: 'Créée'
  }

  // Custom filter function for member count
  const memberCountFilterFn = (row: any, columnId: string, filterValue: string) => {
    const memberCount = row.original.memberCount || 0

    switch (filterValue) {
      case '0':
        return memberCount === 0
      case '1-5':
        return memberCount >= 1 && memberCount <= 5
      case '6+':
        return memberCount >= 6
      default:
        return true
    }
  }

  // ✅ Table columns with selection
  const columns: TableColumn<any>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
          ariaLabel: 'Tout sélectionner'
        }),
      cell: ({ row }) =>
        h(UCheckbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
          ariaLabel: 'Sélectionner la ligne'
        })
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()

        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: columnLabels.name,
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      },
      cell: ({ row }) => {
        const org = row.original
        const logoKey = org.logo
        const logoUrl = logoKey ? logoUrlMap.value[logoKey] : undefined

        return h('div', { class: 'flex items-center gap-3' }, [
          h(UAvatar, {
            src: logoUrl,
            alt: `logo de ${org.name}`,
            text: org.name.charAt(0).toUpperCase(),
            size: 'lg',
            ui: {
              fallback: 'text-primary'
            }
          }),
          h('div', [
            h('p', { class: 'font-medium text-highlighted' }, org.name),
            h('p', { class: 'text-muted text-sm' }, org.slug)
          ])
        ])
      }
    },
    {
      accessorKey: 'memberCount',
      header: columnLabels.memberCount,
      filterFn: memberCountFilterFn,
      cell: ({ row }) => {
        const count = row.original.memberCount || 0
        return h(UBadge, { variant: 'subtle', color: 'neutral' }, () => `${count} membres`)
      }
    },
    {
      accessorKey: 'createdAt',
      header: columnLabels.createdAt,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return h('div', { class: 'text-sm text-muted' }, date.toLocaleDateString())
      }
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return h(
          'div',
          { class: 'text-right' },
          h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) }, () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
          )
        )
      }
    }
  ]

  // Status filter (for member count ranges)
  const statusFilter = ref('all')

  watch(statusFilter, (newVal) => {
    if (!table?.value?.tableApi) return

    const memberCountColumn = table.value.tableApi.getColumn('memberCount')
    if (!memberCountColumn) return

    if (newVal === 'all') {
      memberCountColumn.setFilterValue(undefined)
    } else {
      memberCountColumn.setFilterValue(newVal)
    }
  })

  // Pagination
  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })
</script>

<template>
  <UDashboardPanel id="organizations">
    <template #header>
      <UDashboardNavbar title="Organisations">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Créer une organisation" icon="i-lucide-plus" @click="openCreateOrganizationModal" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="table?.tableApi?.getColumn('name')?.getFilterValue() as string"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filtrer les noms..."
          @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Supprimer"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="
              toast.add({
                title: 'Suppression',
                description: 'Organisations sélectionnées supprimées',
                color: 'success'
              })
            "
          >
            <template #trailing>
              <UKbd>
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Toutes', value: 'all' },
              { label: '0 membres', value: '0' },
              { label: '1-5 membres', value: '1-5' },
              { label: '6+ membres', value: '6+' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filtrer par taille"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return {
                    label: columnLabels[column.id] || upperFirst(column.id),
                    type: 'checkbox' as const,
                    checked: column.getIsVisible(),
                    onUpdateChecked(checked: boolean) {
                      table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                    },
                    onSelect(e?: Event) {
                      e?.preventDefault()
                    }
                  }
                })
            "
            :content="{ align: 'end' }"
          >
            <UButton label="Affichage" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="organizations"
        :columns="columns"
        :loading="orgList.isPending"
        empty="Aucune organisation trouvée. Créez votre première organisation pour commencer."
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />

      <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <div class="text-muted text-sm">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} sur
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} ligne(s) sélectionnée(s).
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
