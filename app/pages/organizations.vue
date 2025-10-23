<script setup lang="ts">
  import { h, resolveComponent } from 'vue'
  import type { TableColumn } from '@nuxt/ui'

  const UButton = resolveComponent('UButton')
  const UBadge = resolveComponent('UBadge')
  const UDropdownMenu = resolveComponent('UDropdownMenu')

  const toast = useToast()

  // Modal state
  const isOpen = ref(false)
  const isCreating = ref(false)

  // Form state
  const name = ref('')
  const slug = ref('')
  const logo = ref('')
  const logoFile = ref<File | null>(null)
  const metadata = ref({})

  const { uploadFile } = useUploads()
  // Table data
  const orgList = authClient.useListOrganizations()
  const organizations = computed(() => Array.from(orgList.value?.data ?? []))

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
            if (u) {
              logoUrlMap.value[k] = u
            }
          }
        }
      } catch {
        // Ignore logo fetch errors
      }
    },
    { immediate: true }
  )
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
        title: 'Erreur de validation',
        description: 'Le nom et le slug sont requis',
        color: 'error'
      })
      return
    }

    isCreating.value = true

    try {
      // Upload logo to R2 if provided
      if (logoFile.value) {
        const result = await uploadFile({ file: logoFile.value, folder: 'org-logos', name: `${slug.value}-logo` })
        // Store only the object key in DB
        logo.value = result.key
      }
      const { data, error } = await authClient.organization.create({
        name: name.value,
        slug: slug.value,
        logo: logo.value || undefined,
        metadata: metadata.value || undefined,
        keepCurrentActiveOrganization: false
      })

      if (error) {
        toast.add({
          title: 'Erreur',
          description: error.message || 'Échec de la création de l’organisation',
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Organisation créée avec succès',
          color: 'success'
        })

        // Reset form and close modal
        name.value = ''
        slug.value = ''
        logo.value = ''
        logoFile.value = null
        metadata.value = {}
        isOpen.value = false

        // Optionally refetch organizations list
        orgList.value?.refetch?.()
      }
    } catch (err) {
      toast.add({
        title: 'Erreur',
        description: 'Une erreur inattendue s’est produite',
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
      header: 'Nom',
      cell: ({ row }) => {
        const org = row.original
        const logoKey = org.logo
        const logoUrl = logoKey ? logoUrlMap.value[logoKey] : undefined
        console.log('✅ logoKey',{logoUrl, logoKey})

        return h('div', { class: 'flex items-center gap-3' }, [
          logoUrl
            ? h('img', {
                src: logoUrl,
                alt: `logo de ${org.name}`,
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
      header: 'Membres',
      cell: ({ row }) => {
        const count = row.original.memberCount || 0
        return h(UBadge, { variant: 'subtle', color: 'neutral' }, () => `${count} membres`)
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Créée',
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
            label: 'Voir les membres',
            icon: 'i-lucide-users',
            onSelect: () => {
              toast.add({
                title: 'Navigation',
                description: `Affichage des membres de ${org.name}`,
                color: 'info'
              })
            }
          },
          {
            label: 'Paramètres',
            icon: 'i-lucide-settings',
            onSelect: () => {
              toast.add({
                title: 'Navigation',
                description: `Ouverture des paramètres pour ${org.name}`,
                color: 'info'
              })
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Définir comme active',
            icon: 'i-lucide-check',
            onSelect: async () => {
              try {
                const { error } = await authClient.organization.setActive({
                  organizationId: org.id,
                  organizationSlug: org.slug
                })

                if (error) {
                  toast.add({
                    title: 'Erreur',
                    description: error.message || 'Impossible de définir l’organisation active',
                    color: 'error'
                  })
                } else {
                  toast.add({
                    title: 'Succès',
                    description: `${org.name} est désormais votre organisation active`,
                    color: 'success'
                  })
                }
              } catch (err) {
                toast.add({
                  title: 'Erreur',
                  description: 'Une erreur inattendue s’est produite',
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
              'aria-label': 'Menu d’actions'
            },
            () =>
              h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                class: 'ml-auto',
                'aria-label': 'Menu d’actions'
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
          title: 'Erreur',
          description: error.message || 'Échec de la vérification de la disponibilité du slug',
          color: 'error'
        })
      } else if (data?.status === false) {
        toast.add({
          title: 'Slug déjà utilisé',
          description: 'Ce slug est déjà utilisé. Veuillez en choisir un autre.',
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
      <UCard>
        <UTable
          :data="organizations"
          :columns="columns"
          :loading="orgList.isPending"
          empty="Aucune organisation trouvée. Créez votre première organisation pour commencer."
          class="flex-1"
        />
      </UCard>

      <!-- Create Organization Modal -->
      <UModal v-model:open="isOpen" title="Créer une organisation">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Nom" description="Le nom de votre organisation">
              <UInput v-model="name" placeholder="Acme Corporation" :disabled="isCreating" required class="w-full" />
            </UFormField>

            <UFormField label="Slug" description="Identifiant unique de votre organisation">
              <UInput v-model="slug" placeholder="acme-corporation" :disabled="isCreating" required class="w-full" />
            </UFormField>

            <UFormField label="Logo" description="Image du logo de votre organisation (optionnel)">
              <UFileUpload
                v-model="logoFile"
                accept="image/*"
                :disabled="isCreating"
                variant="button"
                label="Choisir le logo"
              />
            </UFormField>

            <UFormField label="Métadonnées" description="Métadonnées supplémentaires au format JSON (optionnel)">
              <UTextarea
                :model-value="JSON.stringify(metadata, null, 2)"
                placeholder='{"industrie": "technologie", "taille": "startup"}'
                :disabled="isCreating"
                @update:model-value="
                  (val: string) => {
                    try {
                      metadata = JSON.parse(val || '{}')
                    } catch {
                      // JSON invalide, ignoré
                    }
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
              :disabled="!name || !slug || isCreating"
              @click="createOrganization"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
