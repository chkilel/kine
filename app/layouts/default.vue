<script setup lang="ts">
  import type { CommandPaletteGroup, CommandPaletteItem, NavigationMenuItem } from '@nuxt/ui'

  const open = ref(true)
  const { orgPath, getOrgSlug } = await useOrgRoute()

  const hasOrgSlug = computed(() => !!getOrgSlug())

  const links = computed<NavigationMenuItem[][]>(() => [
    [
      {
        label: 'Accueil',
        icon: 'i-lucide-house',
        to: orgPath('/'),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Messagerie',
        icon: 'i-lucide-message-square',
        to: orgPath('inbox'),
        badge: '4',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Patients',
        icon: 'i-lucide-users',
        to: orgPath('/patients'),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Planning quotidien',
        icon: 'i-lucide-calendar',
        to: orgPath('/therapists/day'),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Cabinets',
        icon: 'i-lucide-building-2',
        to: '/organizations',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Paramètres',
        to: orgPath('/settings'),
        icon: 'i-lucide-settings',
        defaultOpen: true,
        type: 'trigger',
        children: [
          {
            label: 'Général',
            to: orgPath('/settings'),
            exact: true,
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Membres',
            to: orgPath('/settings/members'),
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Notifications',
            to: orgPath('/settings/notifications'),
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Sécurité',
            to: orgPath('/settings/security'),
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
        icon: 'i-lucide-help-circle',
        to: 'mailto:support@kine.com',
        target: '_blank'
      }
    ]
  ])

  const groups = computed<CommandPaletteGroup[]>(() => [
    {
      id: 'navigation',
      label: 'Navigation',
      items: (links.value.flat() as CommandPaletteItem[]) || []
    },
    {
      id: 'help',
      label: 'Aide',
      items: [
        {
          id: 'support',
          label: 'Contacter le support',
          icon: 'i-lucide-mail',
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
      collapsible
      resizable
      default-open
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <OrganizationSwitchMenu :collapsed />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="ring-default bg-transparent" />

        <UNavigationMenu :collapsed="collapsed" :items="links[0] || []" orientation="vertical" tooltip popover />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1] || []"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch v-if="hasOrgSlug" :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
