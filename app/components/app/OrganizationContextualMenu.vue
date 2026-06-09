<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui'
  import type { RouteLocationRaw } from 'vue-router'

  const { collapsed = false } = defineProps<{ collapsed?: boolean }>()

  const route = useRoute()

  const open = ref(false)

  const organizationId = computed(() => route.params.id as string | undefined)
  const isOrganizationContext = computed(() => {
    return !!organizationId.value && route.path.startsWith('/organizations/')
  })

  const contextualLinks = computed<NavigationMenuItem[][]>(() => {
    if (!organizationId.value) return []

    const id = organizationId.value
    const currentPath = route.path

    return [
      [
        {
          label: 'Informations générales',
          icon: 'i-hugeicons-building-02',
          to: `/organizations/${id}`,
          exact: true,
          ariaCurrent: currentPath === `/organizations/${id}` ? 'page' : undefined
        },
        {
          label: 'Informations légales',
          icon: 'i-hugeicons-justice-scale-01',
          to: `/organizations/${id}/legal`,
          ariaCurrent: currentPath === `/organizations/${id}/legal` ? 'page' : undefined
        },
        {
          label: 'Tarifs & Réservations',
          icon: 'i-hugeicons-appointment-02',
          to: `/organizations/${id}/pricing`,
          ariaCurrent: currentPath === `/organizations/${id}/pricing` ? 'page' : undefined
        },
        {
          label: 'Configuration clinique',
          icon: 'i-hugeicons-stethoscope',
          to: `/organizations/${id}/clinical`,
          ariaCurrent: currentPath === `/organizations/${id}/clinical` ? 'page' : undefined
        },
        {
          label: 'Apparence',
          icon: 'i-hugeicons-paint-board',
          to: `/organizations/${id}/appearance`,
          ariaCurrent: currentPath === `/organizations/${id}/appearance` ? 'page' : undefined
        },
        {
          label: 'Avancé',
          icon: 'i-hugeicons-settings-01',
          to: `/organizations/${id}/advanced`,
          ariaCurrent: currentPath === `/organizations/${id}/advanced` ? 'page' : undefined
        },
        {
          label: 'Gestion des Salles',
          icon: 'i-hugeicons-door-open',
          to: `/organizations/${id}/rooms`,
          ariaCurrent: currentPath === `/organizations/${id}/rooms` ? 'page' : undefined
        }
      ]
    ]
  })

  const handleNavigate = (to: RouteLocationRaw | undefined | null) => {
    open.value = false
    navigateTo(to)
  }

  const handleReturn = () => {
    open.value = false
    navigateTo('/organizations')
  }
</script>

<template>
  <div v-if="isOrganizationContext" class="flex h-full flex-col gap-4">
    <UNavigationMenu
      v-model:open="open"
      :collapsed="collapsed"
      :items="contextualLinks[0]"
      orientation="vertical"
      tooltip
      popover
      @select="(item: NavigationMenuItem) => item.to && handleNavigate(item.to)"
    />

    <div class="border-default border-t pt-4">
      <UButton
        icon="i-hugeicons-arrow-turn-backward"
        label="Retour aux cabinets"
        variant="subtle"
        color="neutral"
        block
        aria-label="Retour à la liste des cabinets"
        @click="handleReturn"
      />
    </div>
  </div>
</template>
