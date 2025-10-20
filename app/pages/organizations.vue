<script setup lang="ts">
  import { h, resolveComponent } from 'vue'
  import type { TableColumn } from '@nuxt/ui'

  const UButton = resolveComponent('UButton')
  const UBadge = resolveComponent('UBadge')
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UFormField = resolveComponent('UFormField')
  const UTextarea = resolveComponent('UTextarea')

  const toast = useToast()

  // Modal state
  const isOpen = ref(false)
  const isCreating = ref(false)

  // Form state
  const name = ref('')
  const slug = ref('')
  const logo = ref('')
  const metadata = ref({})

  // Table data
  const orgList = authClient.useListOrganizations()
  const organizations = computed<any[]>(() => Array.from(orgList.value?.data ?? []))
  const isPending = computed(() => orgList.value?.isPending ?? false)

  // Generate slug from name
  watch(name, (newName, oldName) => {
    if (newName != oldName) {
      slug.value = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
  })

  // Create organization
  async function createOrganization() {
    if (!name.value || !slug.value) {
      toast.add({
        title: 'Validation Error',
        description: 'Name and slug are required',
        color: 'error'
      })
      return
    }

    isCreating.value = true

    try {
      const { data, error } = await authClient.organization.create({
        name: name.value,
        slug: slug.value,
        logo: logo.value || undefined,
        metadata: metadata.value || undefined,
        keepCurrentActiveOrganization: false
      })

      if (error) {
        toast.add({
          title: 'Error',
          description: error.message || 'Failed to create organization',
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Success',
          description: 'Organization created successfully',
          color: 'success'
        })

        // Reset form and close modal
        name.value = ''
        slug.value = ''
        logo.value = ''
        metadata.value = {}
        isOpen.value = false

        // Optionally refetch organizations list
        orgList.value?.refetch?.()
      }
    } catch (err) {
      toast.add({
        title: 'Error',
        description: 'An unexpected error occurred',
        color: 'error'
      })
    } finally {
      isCreating.value = false
    }
  }

  // Table columns
  const columns: TableColumn<any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const org = row.original
        return h('div', { class: 'flex items-center gap-3' }, [
          org.logo
            ? h('img', {
                src: org.logo,
                alt: `${org.name} logo`,
                class: 'w-8 h-8 rounded-lg object-cover'
              })
            : h(
                'div',
                {
                  class: 'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'
                },
                h('span', { class: 'text-primary text-sm font-medium' }, org.name.charAt(0).toUpperCase())
              ),
          h('div', [
            h('p', { class: 'font-medium text-highlighted' }, org.name),
            h('p', { class: 'text-muted text-sm' }, org.slug)
          ])
        ])
      }
    },
    {
      accessorKey: 'memberCount',
      header: 'Members',
      cell: ({ row }) => {
        const count = row.original.memberCount || 0
        return h(UBadge, { variant: 'subtle', color: 'neutral' }, () => `${count} members`)
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return h('div', { class: 'text-sm text-muted' }, date.toLocaleDateString())
      }
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const org = row.original

        const items = [
          {
            type: 'label',
            label: 'Actions'
          },
          {
            label: 'View members',
            icon: 'i-lucide-users',
            onSelect: () => {
              toast.add({
                title: 'Navigate',
                description: `Viewing members of ${org.name}`,
                color: 'info'
              })
            }
          },
          {
            label: 'Settings',
            icon: 'i-lucide-settings',
            onSelect: () => {
              toast.add({
                title: 'Navigate',
                description: `Opening settings for ${org.name}`,
                color: 'info'
              })
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Set as active',
            icon: 'i-lucide-check',
            onSelect: async () => {
              try {
                const { error } = await authClient.organization.setActive({
                  organizationId: org.id,
                  organizationSlug: org.slug
                })

                if (error) {
                  toast.add({
                    title: 'Error',
                    description: error.message || 'Failed to set active organization',
                    color: 'error'
                  })
                } else {
                  toast.add({
                    title: 'Success',
                    description: `${org.name} is now your active organization`,
                    color: 'success'
                  })
                }
              } catch (err) {
                toast.add({
                  title: 'Error',
                  description: 'An unexpected error occurred',
                  color: 'error'
                })
              }
            }
          }
        ]

        return h(
          'div',
          { class: 'text-right' },
          h(
            UDropdownMenu,
            {
              content: { align: 'end' },
              items,
              'aria-label': 'Actions dropdown'
            },
            () =>
              h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                class: 'ml-auto',
                'aria-label': 'Actions dropdown'
              })
          )
        )
      }
    }
  ]

  // Check if slug is available
  async function checkSlugAvailability() {
    if (!slug.value) return

    try {
      const { data, error } = await authClient.organization.checkSlug({
        slug: slug.value
      })

      if (error) {
        toast.add({
          title: 'Error',
          description: error.message || 'Failed to check slug availability',
          color: 'error'
        })
      } else if (data?.status === false) {
        toast.add({
          title: 'Slug Taken',
          description: 'This slug is already taken. Please choose another.',
          color: 'warning'
        })
      }
    } catch (err) {
      // Ignore errors for slug checking
    }
  }

  // Debounce slug check
  const debouncedSlugCheck = useDebounceFn(checkSlugAvailability, 500)

  watch(slug, debouncedSlugCheck)
</script>

<template>
  <UDashboardPanel id="organizations">
    <template #header>
      <UDashboardNavbar title="Organizations">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton label="Create Organization" icon="i-lucide-plus" @click="isOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <UTable
          :data="organizations"
          :columns="columns"
          :loading="isPending"
          empty="No organizations found. Create your first organization to get started."
          class="flex-1"
        />
      </UCard>

      <!-- Create Organization Modal -->
      <UModal v-model:open="isOpen" title="Create Organization">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Name" description="The name of your organization">
              <UInput v-model="name" placeholder="Acme Corporation" :disabled="isCreating" required />
            </UFormField>

            <UFormField label="Slug" description="Unique identifier for your organization">
              <UInput v-model="slug" placeholder="acme-corporation" :disabled="isCreating" required />
            </UFormField>

            <UFormField label="Logo" description="URL to your organization logo (optional)">
              <UInput v-model="logo" placeholder="https://example.com/logo.png" :disabled="isCreating" />
            </UFormField>

            <UFormField label="Metadata" description="Additional metadata as JSON (optional)">
              <UTextarea
                :model-value="JSON.stringify(metadata, null, 2)"
                placeholder='{"industry": "technology", "size": "startup"}'
                :disabled="isCreating"
                @update:model-value="
                  (val: string) => {
                    try {
                      metadata = JSON.parse(val || '{}')
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }
                "
              />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" color="neutral" variant="outline" :disabled="isCreating" @click="isOpen = false" />
            <UButton
              label="Create Organization"
              :loading="isCreating"
              :disabled="!name || !slug || isCreating"
              @click="createOrganization"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
