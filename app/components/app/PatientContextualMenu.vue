<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui'
  import type { RouteLocationRaw } from 'vue-router'

  const { collapsed = false } = defineProps<{ collapsed?: boolean }>()

  // ─── Composables ───
  const route = useRoute()

  // ─── State ───
  const open = ref(false)

  // ─── Computed ───
const patientId = computed(() => route.params.id as string | undefined)
const isPatientContext = computed(() => {
  return !!patientId.value && route.path.startsWith('/patients/')
})
  const contextualLinks = computed<NavigationMenuItem[][]>(() => {
    if (!patientId.value) return []

    const id = patientId.value
    const currentPath = route.path

    return [
      [
        {
          label: "Vue d'Ensemble",
          icon: 'i-hugeicons-user-account',
          to: `/patients/${id}`,
          exact: true,
          ariaCurrent: currentPath === `/patients/${id}` ? 'page' : undefined
        },
        {
          label: 'Plan de traitement',
          icon: 'i-hugeicons-first-aid-kit',
          to: `/patients/${id}/plan`,
          ariaCurrent: currentPath === `/patients/${id}/plan` ? 'page' : undefined
        },
        {
          label: 'Hors Plan',
          icon: 'i-hugeicons-calendar-01',
          to: `/patients/${id}/seances`,
          ariaCurrent: currentPath === `/patients/${id}/seances` ? 'page' : undefined
        },
        {
          label: 'Documents',
          icon: 'i-hugeicons-folder-library',
          to: `/patients/${id}/documents`,
          ariaCurrent: currentPath === `/patients/${id}/documents` ? 'page' : undefined
        },
        {
          label: 'Facturation',
          icon: 'i-hugeicons-wallet-02',
          to: `/patients/${id}/facturation`,
          ariaCurrent: currentPath === `/patients/${id}/facturation` ? 'page' : undefined
        }
      ]
    ]
  })

  // ─── Handlers ─────────────────────────────────────
  const handleNavigate = (to: RouteLocationRaw | undefined | null) => {
    open.value = false
    navigateTo(to)
  }

  const handleReturn = () => {
    open.value = false
    navigateTo('/patients')
  }
</script>

<template>
  <div v-if="isPatientContext" class="flex h-full flex-col gap-4">
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
        label="Retour aux patients"
        variant="subtle"
        color="neutral"
        block
        :aria-label="'Retour à la liste des patients'"
        @click="handleReturn"
      />
    </div>
  </div>
</template>
