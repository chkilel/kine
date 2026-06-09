<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui'

  // ─── Composables ─────────────────────────────────────────────
  const route = useRoute()
  const { activeOrganization } = useOrganization()

  // ─── State ──────────────────────────────────────────────────
  const open = ref(false)
  const rightOpen = useState('rightSide', () => true)

  // ─── Patient context detection ─────────────────────────────
  const patientId = computed(() => {
    return route.params.id as string | undefined
  })

  const isPatientContext = computed(() => {
    return !!patientId.value && route.path.startsWith('/patients/')
  })

  // ─── Organization context detection ──────────────────────
  const isOrganizationContext = computed(() => {
    const id = route.params.id as string | undefined
    return !!id && route.path.startsWith('/organizations/') && route.path !== '/organizations'
  })

  // ─── Organization link ─────────────────────────────────────
  const activeOrgId = computed(() => activeOrganization.value?.data?.id)
  const hasActiveOrg = computed(() => !!activeOrgId.value && !activeOrganization.value?.isPending)

  // ─── Navigation ──────────────────────────────────────────────
  const links = computed(
    () =>
      [
        [
          {
            label: 'Accueil',
            icon: 'i-hugeicons-home-01',
            to: '/',
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
            label: 'Patients',
            icon: 'i-hugeicons-user-multiple',
            to: '/patients',
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Planning quotidien',
            icon: 'i-hugeicons-calendar-03',
            to: '/therapists/day',
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Organisations',
            icon: 'i-hugeicons-building-02',
            to: '/organizations',
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Cabinet',
            icon: 'i-hugeicons-hospital-02',
            to: hasActiveOrg.value ? `/organizations/${activeOrgId.value}` : undefined,
            onSelect: () => {
              open.value = false
            }
          },
          {
            label: 'Paramètres',
            to: '/settings',
            icon: 'i-hugeicons-settings-02',
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
      ] as NavigationMenuItem[][]
  )

  // ─── Search groups ───────────────────────────────────────────
  const groups = computed(() => [
    {
      id: 'navigation',
      label: 'Navigation',
      items: links.value.flat()
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
      class="bg-muted"
      :ui="{
        root: 'lg:border-r lg:border-muted',
        footer: 'lg:border-t lg:border-muted',
        header: 'lg:border-b lg:border-muted'
      }"
    >
      <template #header="{ collapsed }">
        <OrganizationSwitchMenu :collapsed />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="ring-default bg-transparent" />

        <AppPatientContextualMenu :collapsed="collapsed" />

        <AppOrganizationContextualMenu :collapsed="collapsed" />

        <UNavigationMenu
          v-if="!isPatientContext && !isOrganizationContext"
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
    <USidebar v-model:open="rightOpen" variant="inset" rail collapsible="offcanvas" side="right">
      <div class="h-full" />
    </USidebar>

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
