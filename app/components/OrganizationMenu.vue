<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'
  import type { OrganizationSchema } from '~~/shared/types/org.types'

  defineProps<{ collapsed?: boolean }>()

  const selectedOrganization = ref<OrganizationSchema>()
  const toast = useToast()

  // Logo map for organization logos
  const logoUrlMap = ref<Record<string, string>>({})

  // Use Better Auth organization hooks
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()
  const session = await authClient.useSession(useFetch)

  // Extract logo keys from organizations
  const logoKeys = computed(() => (organizations.value?.data ?? []).map((org) => org.logo).filter((k) => !!k))

  // Watch for logo keys and fetch URLs
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

  // Debug logs to understand the data structure
  console.log('🚀 >>> ', 'activeOrganization ', ': ', activeOrganization.value)
  console.log('🚀 >>> ', 'session', ': ', session.data.value)

  // Watch for changes to active organization and update UI
  watch(
    activeOrganization,
    (newVal) => {
      console.log('🚀 >>> ', 'activeOrganization changed:', newVal)
      // Force UI update when active organization changes
    },
    { deep: true }
  )

  // Switch organization using Better Auth
  async function switchOrganization(organizationId: string) {
    try {
      const { data, error } = await authClient.organization.setActive({ organizationId })

      console.log('🚀 >>> ', 'switch organization response:', data)

      if (error) {
        console.error('Failed to switch organization:', error)
        // Show error toast notification
        toast.add({
          title: 'Erreur',
          description: "Impossible de changer d'organisation",
          color: 'error'
        })
      } else {
        console.log('🚀 >>> ', 'activeOrganization after switch:', activeOrganization.value)
        // Show success toast notification
        toast.add({
          title: 'Succès',
          description: 'Organisation changée avec succès',
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to switch organization:', error)
      toast.add({
        title: 'Erreur',
        description: "Une erreur inattendue s'est produite",
        color: 'error'
      })
    }
  }

  // TODO Create organization using the same approach as in the organisation page

  // Computed items for dropdown
  const organizationItems = computed<DropdownMenuItem[][]>(() => {
    if (!organizations.value.data) return [[]]
    const items = organizations.value.data.map((org) => {
      const logoKey = org.logo
      const logoUrl = logoKey ? logoUrlMap.value[logoKey] : undefined
      
      return {
        label: org.name,
        avatar: {
          src: logoUrl ?? undefined,
          alt: org.name
        },
        onSelect: () => switchOrganization(org.id)
      }
    })

    // Add "Create Organization" option if user has no organizations
    const createOrg = { label: 'Créer une équipe', icon: 'i-lucide-circle-plus' }
    const manageOrg = { label: 'Gérer les équipes', icon: 'i-lucide-cog' }

    if (organizations.value.data.length === 0) {
      return [items, [createOrg, manageOrg]]
    }

    return [items, [manageOrg]]
  })
</script>

<template>
  <UDropdownMenu
    :items="organizationItems"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...activeOrganization.data,
        label: collapsed ? undefined : activeOrganization.data?.name || 'Select Organization',
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
      :loading="organizations.isPending"
    >
      <template v-if="collapsed && activeOrganization.data" #leading>
        <UAvatar
          :src="activeOrganization.data.logo ? logoUrlMap[activeOrganization.data.logo] : undefined"
          :alt="activeOrganization.data.name"
          :text="activeOrganization.data.name.charAt(0).toUpperCase()"
          size="sm"
        />
      </template>
    </UButton>
  </UDropdownMenu>

  <div>
    <div v-if="!activeOrganization.data">No active organization.</div>
    <div v-else>
      {{ activeOrganization.data?.name }}
    </div>
  </div>
</template>
