<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import { upperFirst } from 'scule'
  import { getPaginationRowModel } from '@tanstack/table-core'
  import type { Row } from '@tanstack/table-core'

  const UButton = resolveComponent('UButton')
  const UBadge = resolveComponent('UBadge')
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UAvatar = resolveComponent('UAvatar')
  const UCheckbox = resolveComponent('UCheckbox')

  const toast = useToast()
  const { uploadFile } = useUploads()
  const table = useTemplateRef('table')

  // Modal state
  const isOpen = ref(false)
  const isCreating = ref(false)

  // Table state
  const columnFilters = ref([
    {
      id: 'name',
      value: ''
    }
  ])
  const columnVisibility = ref()
  const rowSelection = ref({})

  // ✅ Unified reactive form state
  const form = reactive({
    name: '',
    slug: '',
    logo: '',
    logoFile: null as File | null,
    metadata: {} as Record<string, any>
  })

  // Table data
  const orgList = authClient.useListOrganizations()
  const organizations = computed(() => Array.from(orgList.value?.data ?? []))

  // Logo map
  const logoUrlMap = ref<Record<string, string>>({})
  const logoKeys = computed(() => (organizations.value || []).map((org) => org.logo).filter((k) => !!k))

  watch(
    logoKeys,
    async (keys) => {
      const newKeys = keys.filter((k) => k && !(k in logoUrlMap.value))
      if (!newKeys.length) return

      try {
        const response = await $fetch('/api/r2/blobs', {
          params: { keys: newKeys }
        })

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

  // ✅ Auto-generate slug from name
  watch(
    () => form.name,
    (newName, oldName) => {
      if (newName != oldName) {
        form.slug = slugify(newName)
      }
    }
  )

  // ✅ Create organization
  async function createOrganization() {
    isCreating.value = true

    try {
      // Upload logo if provided
      if (form.logoFile) {
        const result = await uploadFile({
          file: form.logoFile,
          folder: 'org-logos',
          name: `${form.slug}-logo`
        })
        form.logo = result.key
      }

      const { error } = await authClient.organization.create({
        name: form.name,
        slug: form.slug,
        logo: form.logo || undefined,
        metadata: form.metadata || undefined,
        keepCurrentActiveOrganization: false
      })

      if (error) {
        toast.add({
          title: 'Erreur',
          description: error.message || "Échec de la création de l'organisation",
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Organisation créée avec succès',
          color: 'success'
        })

        // ✅ Reset form & modal
        Object.assign(form, { name: '', slug: '', logo: '', logoFile: null, metadata: {} })
        isOpen.value = false

        orgList.value?.refetch?.()
      }
    } catch {
      toast.add({
        title: 'Erreur',
        description: "Une erreur inattendue s'est produite",
        color: 'error'
      })
    } finally {
      isCreating.value = false
    }
  }

  // ✅ Check if slug is available
  async function checkSlugAvailability() {
    if (!form.slug) return

    try {
      const { data, error } = await authClient.organization.checkSlug({
        slug: form.slug
      })

      if (error) {
        toast.add({
          title: 'Erreur',
          description: error.message || 'Échec de la vérification du slug',
          color: 'error'
        })
      } else if (data?.status === false) {
        toast.add({
          title: 'Slug déjà utilisé',
          description: 'Ce slug est déjà pris, choisissez-en un autre.',
          color: 'warning'
        })
      }
    } catch {
      // Ignore network errors here
    }
  }

  // Debounce slug check
  const debouncedSlugCheck = useDebounceFn(checkSlugAvailability, 500)
  watch(() => form.slug, debouncedSlugCheck)

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

  // Status filter (for member count ranges)
  const statusFilter = ref('all')
  console.log('🚀 >>> ', 'statusFilter.value', ': ', statusFilter.value)

  watch(statusFilter, (newVal) => {
    if (!table?.value?.tableApi) return
    console.log('🚀 >>> ', 'newVal', ': ', newVal)

    const memberCountColumn = table.value.tableApi.getColumn('memberCount')
    if (!memberCountColumn) return

    if (newVal === 'all') {
      memberCountColumn.setFilterValue(undefined)
    } else {
      // Custom filter logic for member count ranges
      memberCountColumn.setFilterValue((value: number) => {
        console.log('🚀 >>> ', 'value', ': ', value)

        const count = value ?? 0 // Use nullish coalescing to handle 0 properly
        switch (newVal) {
          case '0':
            return count === 0
          case '1-5':
            return count >= 1 && count <= 5
          case '6+':
            return count >= 6
          default:
            return true
        }
      })
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
          <UButton label="Créer une organisation" icon="i-lucide-plus" @click="isOpen = true" />
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
          {{ statusFilter }}
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

      <!-- ✅ Create Organization Modal -->
      <UModal v-model:open="isOpen" title="Créer une organisation">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Nom" description="Le nom de votre organisation">
              <UInput v-model="form.name" placeholder="Acme Corporation" :disabled="isCreating" required />
            </UFormField>

            <UFormField label="Slug" description="Identifiant unique de votre organisation">
              <UInput v-model="form.slug" placeholder="acme-corporation" :disabled="isCreating" required />
            </UFormField>

            <UFormField label="Logo" description="Image du logo (optionnel)">
              <UFileUpload
                v-model="form.logoFile"
                accept="image/*"
                :disabled="isCreating"
                variant="button"
                label="Choisir le logo"
              />
            </UFormField>

            <UFormField label="Métadonnées" description="Format JSON (optionnel)">
              <UTextarea
                :model-value="JSON.stringify(form.metadata, null, 2)"
                placeholder='{"industrie": "technologie", "taille": "startup"}'
                :disabled="isCreating"
                @update:model-value="
                  (val: string) => {
                    try {
                      form.metadata = JSON.parse(val || '{}')
                    } catch {}
                  }
                "
              />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Annuler" color="neutral" variant="outline" :disabled="isCreating" @click="isOpen = false" />
            <UButton
              label="Créer une organisation"
              :loading="isCreating"
              :disabled="!form.name || !form.slug || isCreating"
              @click="createOrganization"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
