<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'
  import type { OrganizationSchema } from '~~/shared/types/org.types'

  defineProps<{ collapsed?: boolean }>()

  // Better Auth organization hooks
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()

  const toast = useToast()

  // Logo map for organization logos
  const logoUrlMap = ref<Record<string, string>>({})
  const logoKeys = computed(() => (organizations.value?.data ?? []).map((org) => org.logo).filter((k) => !!k))

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
    const createOrgItem = { label: 'Créer une équipe', icon: 'i-lucide-circle-plus' }
    const manageOrgItem = { label: 'Gérer les équipes', icon: 'i-lucide-cog' }

    if (organizations.value.data.length === 0) {
      return [items, [createOrgItem, manageOrgItem]]
    }

    return [items, [manageOrgItem]]
  })

  // Active organization item for dropdown
  const activeOrg = computed(() => {
    if (!activeOrganization.value?.data) return null
    const logoKey = activeOrganization.value?.data.logo
    const logoUrl = logoKey ? logoUrlMap.value[logoKey] : undefined
    return {
      label: activeOrganization.value?.data.name || 'Select Organization',
      avatar: {
        src: logoUrl ?? undefined,
        alt: activeOrganization.value?.data.name || 'Select Organization'
      }
    }
  })

  // Watch for logo keys and fetch URLs
  watch(
    logoKeys,
    async (keys) => {
      const newKeys = keys.filter((k) => k && !(k in logoUrlMap.value))
      if (!newKeys.length) return

      try {
        const response = await $fetch('/api/r2/signed-url', { params: { keys: newKeys } })

        if (response?.urls) {
          for (const [k, u] of Object.entries(response.urls)) {
            if (typeof u === 'string') logoUrlMap.value[k] = u
          }
        }
      } catch {
        // Ignore logo fetch errors
      }
    },
    { immediate: true }
  )

  // Switch organization using Better Auth
  async function switchOrganization(organizationId: string) {
    try {
      const { data, error } = await authClient.organization.setActive({ organizationId })
      if (error) {
        console.error('Failed to switch organization:', error)
        toast.add({
          title: 'Erreur',
          description: "Impossible de changer d'organisation",
          color: 'error'
        })
      } else {
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

  // TODO: Create organization using the same approach as in the organisation page
</script>

<template>
  <UDropdownMenu
    :items="organizationItems"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...activeOrg,
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
    />
  </UDropdownMenu>
</template>
