<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'
  import { authClient } from '~~/app/utils/auth-client'

  defineProps<{
    collapsed?: boolean
  }>()

  interface Organization {
    id: string
    name: string
    slug: string
    logo?: string
  }

  // Use Better Auth organization hooks
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()

  // Switch organization using Better Auth
  async function switchOrganization(organizationId: string, organizationSlug: string) {
    try {
      const { data, error } = await authClient.organization.setActive({
        organizationId,
        organizationSlug
      })

      if (error) {
        console.error('Failed to switch organization:', error)
      }
    } catch (error) {
      console.error('Failed to switch organization:', error)
    }
  }

  // Create organization function
  async function createOrganization() {
    try {
      const { data, error } = await authClient.organization.create({
        name: `Organization ${Date.now()}`, // Generate unique name
        slug: `org-${Date.now()}`, // Generate unique slug
        keepCurrentActiveOrganization: false
      })

      if (error) {
        console.error('Failed to create organization:', error)
      } else {
        console.log('Organization created successfully:', data)
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
    }
  }

  // Computed items for dropdown
  const organizationItems = computed(() => {
    if (!organizations.value.data) return [[]]
    const items = organizations.value.data.map((org) => ({
      label: org.name,
      onSelect: () => switchOrganization(org.id, org.slug),
      logo: org.logo,
      badge: activeOrganization.value?.id === org.id ? 'Active' : undefined
    }))

    // Add "Create Organization" option if user has no organizations
    if (organizations.value.data.length === 0) {
      items.push({
        label: 'Create Organization',
        icon: 'i-lucide-plus',
        onSelect: createOrganization
      })
    }

    return [items]
  })
</script>

<template>
  <UDropdownMenu
    :items="organizationItems"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      :label="activeOrganization.data?.name || 'Select Organization'"
      :loading="organizations.isPending"
      trailing-icon="i-lucide-chevrons-up-down"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
