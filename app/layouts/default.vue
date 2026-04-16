<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui'

  const open = ref(false)

  const links = [
    [
      {
        label: 'Acceuil',
        icon: 'i-hugeicons-home-03',
        to: '/',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Patients',
        icon: 'i-hugeicons-user-multiple',
        to: '/patients',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Cabinets',
        icon: 'i-hugeicons-building-06',
        to: '/organizations',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Messagerie',
        icon: 'i-hugeicons-mail-01',
        to: '/inbox',
        badge: '4',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Cabinet',
        to: '/cabinet',
        icon: 'i-hugeicons-customize',
        defaultOpen: true,
        type: 'trigger',
        children: [
          {
            label: 'Assurances',
            to: '/cabinet/insurances',
            exact: true,
            onSelect: () => {
              open.value = false
            }
          }
        ]
      },
      {
        label: 'Paramètres',
        to: '/settings',
        icon: 'i-hugeicons-customize',
        defaultOpen: true,
        type: 'trigger',
        children: [
          {
            label: 'Général',
            to: '/settings',
            exact: true,
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Membres',
            to: '/settings/members',
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Notifications',
            to: '/settings/notifications',
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Sécurité',
            to: '/settings/security',
            onSelect: () => {
              open.value = false
            }
          }
        ]
      }
    ],
    [
      {
        label: 'Support',
        icon: 'i-hugeicons-help-circle',
        to: 'mailto:support@kine.com',
        target: '_blank'
      }
    ]
  ] satisfies NavigationMenuItem[][]

  const groups = computed(() => [
    {
      id: 'navigation',
      label: 'Navigation',
      items: links.flat()
    },
    {
      id: 'help',
      label: 'Aide',
      items: [
        {
          id: 'support',
          label: 'Contacter le support',
          icon: 'i-hugeicons-mail-01',
          to: 'mailto:support@kine.com',
          target: '_blank'
        }
      ]
    }
  ])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <OrganizationSwitchMenu :collapsed />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="ring-default bg-transparent" />

        <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />

        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
