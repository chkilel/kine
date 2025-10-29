<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import { upperFirst } from 'scule'
  import { getPaginationRowModel } from '@tanstack/table-core'
  import type { Row } from '@tanstack/table-core'
  import type { Patient } from '~~/shared/types/patient.types'

  const UAvatar = resolveComponent('UAvatar')
  const UButton = resolveComponent('UButton')
  const UBadge = resolveComponent('UBadge')
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UCheckbox = resolveComponent('UCheckbox')

  const toast = useToast()
  const table = useTemplateRef('table')

  const columnFilters = ref([
    {
      id: 'email',
      value: ''
    }
  ])
  const columnVisibility = ref()
  const rowSelection = ref({ 1: true })

  const { data, status } = await useFetch<Patient[]>('/api/patients', {
    lazy: true
  })

  function getRowItems(row: Row<Patient>) {
    return [
      {
        type: 'label',
        label: 'Actions'
      },
      {
        label: 'Copy patient ID',
        icon: 'i-lucide-copy',
        onSelect() {
          navigator.clipboard.writeText(row.original.id)
          toast.add({
            title: 'Copied to clipboard',
            description: 'Patient ID copied to clipboard'
          })
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'View patient details',
        icon: 'i-lucide-list',
        onSelect() {
          navigateTo(`/patients/${row.original.id}`)
        }
      },
      {
        label: 'Voir les documents du patient',
        icon: 'i-lucide-file-text',
        onSelect() {
          navigateTo(`/patients/${row.original.id}/documents`)
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Supprimer le patient',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: async () => {
          if (
            confirm(
              `Êtes‑vous sûr de vouloir supprimer ${row.original.firstName} ${row.original.lastName} ? Cette action est irréversible.`
            )
          ) {
            try {
              await $fetch(`/api/patients/${row.original.id}`, {
                method: 'DELETE'
              })

              toast.add({
                title: 'Patient supprimé',
                description: 'Le patient a été supprimé.',
                color: 'success'
              })

              // Refresh the patient list
              await refreshNuxtData()
            } catch (error: any) {
              toast.add({
                title: 'Erreur',
                description: error.data?.statusMessage || 'Échec de la suppression du patient',
                color: 'error'
              })
            }
          }
        }
      }
    ]
  }

  const columns: TableColumn<Patient>[] = [
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
        }),
      
    },
    {
      accessorKey: 'id',
      header: 'ID'
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => {
        const fullName = `${row.original.firstName} ${row.original.lastName}`
        return h('div', { class: 'flex items-center gap-3' }, [
          h(UAvatar, {
            size: 'lg',
            // Generate avatar from initials if no image
            src: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
          }),
          h('div', undefined, [
            h('p', { class: 'font-medium text-highlighted' }, fullName),
            h('p', { class: '' }, `@${row.original.firstName.toLowerCase()}${row.original.lastName.toLowerCase()}`)
          ])
        ])
      }
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()

        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Email',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      }
    },
    {
      accessorKey: 'phone',
      header: 'Téléphone',
      cell: ({ row }) => row.original.phone || '-'
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      filterFn: 'equals',
      cell: ({ row }) => {
        const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
          active: 'success',
          inactive: 'warning',
          discharged: 'error'
        }

        const statusLabels: Record<string, string> = {
          active: 'Actif',
          inactive: 'Inactif',
          discharged: 'Sorti'
        }

        const color = statusColors[row.original.status] || 'neutral'
        const label = statusLabels[row.original.status] || row.original.status

        return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => label)
      }
    },
    {
      accessorKey: 'insuranceProvider',
      header: 'Assurance',
      cell: ({ row }) => row.original.insuranceProvider || '-'
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return h(
          'div',
          { class: 'text-right' },
          h(
            UDropdownMenu,
            {
              content: {
                align: 'end'
              },
              items: getRowItems(row)
            },
            () =>
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

  const statusFilter = ref('all')

  watch(
    () => statusFilter.value,
    (newVal) => {
      if (!table?.value?.tableApi) return

      const statusColumn = table.value.tableApi.getColumn('status')
      if (!statusColumn) return

      if (newVal === 'all') {
        statusColumn.setFilterValue(undefined)
      } else {
        statusColumn.setFilterValue(newVal)
      }
    }
  )

  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })
</script>

<template>
  <UDashboardPanel id="patients">
    <template #header>
      <UDashboardNavbar title="Patients">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <PatientAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filtrer les patients..."
          @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <PatientDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            :selected-ids="table?.tableApi?.getFilteredSelectedRowModel().rows.map((row) => row.original.id) || []"
          >
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Supprimer"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </PatientDeleteModal>

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Tous', value: 'all' },
              { label: 'Actif', value: 'active' },
              { label: 'Inactif', value: 'inactive' },
              { label: 'Sorti', value: 'discharged' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filtrer par statut"
            class="min-w-28"
          />
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
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
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
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
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
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
