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
    <AppCard variant="soft">
      <div v-if="isPending" class="flex items-center justify-center py-12">
        <UIcon name="i-hugeicons-loading-03" class="text-muted size-8 animate-spin" />
      </div>
      <div v-else-if="organization" class="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div class="mx-auto shrink-0 sm:mx-0">
          <UAvatar icon="i-hugeicons-building-02" :alt="organization.name" class="size-24 bg-blue-100 text-4xl" />
        </div>
        <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
          <div class="flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <h1 class="text-2xl leading-tight font-bold md:text-3xl">{{ organization.name }}</h1>
            <UBadge
              :color="organization.status === 'active' ? 'success' : 'neutral'"
              size="lg"
              variant="subtle"
              class="self-center rounded-full uppercase"
            >
              {{ organization.status === 'active' ? 'Active' : 'Inactive' }}
            </UBadge>
          </div>
          <div class="text-muted flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm sm:justify-start">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-hugeicons-hashtag" class="text-base" />
              <span>{{ organization.slug }}</span>
            </div>

            <span>•</span>

            <div>Créé le: {{ new Date(organization.createdAt).toLocaleDateString('fr-FR') }}</div>
          </div>
        </div>
      </div>
    </AppCard>

    <NuxtPage />
  </AppDashboardPage>
</template>
