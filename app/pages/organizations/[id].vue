<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isLoading: isPending } = useFullOrganization(() => route.params.id as string)

  const childSegment = computed(() => {
    const parts = route.path.split('/')
    const last = parts[parts.length - 1]
    if (!last || last === route.params.id) return ''
    return last
  })

  const tabLabelMap: Record<string, string> = {
    '': 'Profil',
    legal: 'Informations légales',
    pricing: 'Tarifs',
    scheduling: 'Planification',
    clinical: 'Configuration clinique',
    notifications: 'Notifications',
    appearance: 'Apparence',
    rooms: 'Salles',
    advanced: 'Avancé'
  }

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Cabinets', to: '/organizations' },
    { label: tabLabelMap[childSegment.value] ?? 'Profil' }
  ])
</script>

<template>
  <AppDashboardPage id="organization-profile" title="Cabinet" :breadcrumbs="breadcrumbItems">
    <div v-if="isPending" class="flex items-center justify-center py-12">
      <UIcon name="i-hugeicons-loading-03" class="text-muted size-8 animate-spin" />
    </div>
    <UCard v-else-if="organization" :ui="{ body: 'sm:py-4 py-3' }">
      <!-- Organization Header -->
      <div class="relative z-10 flex flex-col gap-4 md:flex-row">
        <div class="flex flex-1 gap-x-4">
          <div class="flex flex-1 items-start gap-x-4">
            <div class="mx-auto shrink-0 sm:mx-0">
              <UAvatar
                icon="i-hugeicons-building-02"
                :alt="organization.name"
                color="primary"
                class="size-16 text-3xl"
              />
            </div>
            <div class="flex-1 space-y-1.5">
              <div class="flex items-center gap-2">
                <h1 class="text-xl tracking-tight">{{ organization.name }}</h1>
                <UBadge
                  :color="organization.status === 'active' ? 'success' : 'neutral'"
                  variant="subtle"
                  class="rounded-full uppercase"
                >
                  {{ organization.status === 'active' ? 'Active' : 'Inactive' }}
                </UBadge>
              </div>
              <div class="text-muted flex flex-wrap items-start gap-x-5 gap-y-1 text-[13px]">
                <div class="flex items-center gap-1.5">
                  <AppIconBox size="md" name="i-hugeicons-hashtag" class="p-1" />
                  <span>{{ organization.slug }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <AppIconBox size="md" name="i-hugeicons-calendar-user" class="p-1" />
                  <span>Créé le: {{ new Date(organization.createdAt).toLocaleDateString('fr-FR') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <NuxtPage />
  </AppDashboardPage>
</template>
