<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui'

  const { orgPath } = await useOrgRoute()
  const links = [
    [
      {
        label: 'Général',
        icon: 'i-lucide-user',
        to: orgPath('/settings'),
        exact: true
      },
      {
        label: 'Membres',
        icon: 'i-lucide-users',
        to: orgPath('/settings/members')
      },
      {
        label: 'Notifications',
        icon: 'i-lucide-bell',
        to: orgPath('/settings/notifications')
      },
      {
        label: 'Sécurité',
        icon: 'i-lucide-shield',
        to: orgPath('/settings/security')
      }
    ],
    [
      {
        label: 'Documentation',
        icon: 'i-lucide-book-open',
        to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
        target: '_blank'
      }
    ]
  ] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Paramètres">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
