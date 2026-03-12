<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'

  // Tabs configuration
  const tabs = [
    { label: 'Profil', slot: 'profile', value: 'profile', icon: 'i-lucide-user' },
    { label: 'Disponibilités', slot: 'availability', value: 'availability', icon: 'i-lucide-calendar-check' },
    { label: 'Statistiques', slot: 'statistics', value: 'statistics', icon: 'i-lucide-bar-chart' }
  ]

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [{ label: 'Accueil', icon: 'i-lucide-home', to: '/' }, { label: 'Profil' }]

  // User session
  const { user } = await useAuth()

  const therapistSpecializations = computed(() =>
    user.value?.specialization?.map((item) => getSpecializationLabel(item))
  )
</script>

<template>
  <AppDashboardPage id="profile" title="Profil" :breadcrumbs="breadcrumbItems">
    <div v-if="!user" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
    </div>

    <div v-else class="space-y-6">
      <!-- User Header -->
      <UCard variant="soft" :ui="{ body: 'px-0 sm:px-0' }">
        <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div class="mx-auto shrink-0 sm:mx-0">
            <UAvatar
              :src="user.image as string | undefined"
              :alt="`${user.firstName} ${user.lastName}`"
              :class="[
                'size-24 text-4xl',
                getAvatarBgColor(user.firstName, user.lastName),
                getAvatarTextColor(user.firstName, user.lastName)
              ]"
            />
          </div>
          <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
            <h1 class="text-2xl leading-tight font-bold md:text-3xl">{{ user.firstName }} {{ user.lastName }}</h1>
            <div class="text-muted flex flex-col flex-wrap items-center gap-y-2 text-sm sm:items-start">
              <div v-if="user.email" class="flex items-center gap-1.5">
                <UIcon name="i-lucide-mail" class="text-base" />
                <a class="hover:text-primary truncate hover:underline" :href="`mailto:${user.email}`">
                  {{ user.email }}
                </a>
              </div>
              <ClientOnly>
                <template #fallback>
                  <div class="flex items-center gap-1.5 bg-amber-50">
                    <UIcon name="i-lucide-briefcase" class="animate-pulse text-base" />
                    <USkeleton class="bg-accented h-5 w-42" />
                  </div>
                </template>
                <div v-if="therapistSpecializations" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-briefcase" class="text-base" />
                  <div class="flex flex-col items-center gap-1.5 sm:flex-row">
                    <template v-for="(item, index) in therapistSpecializations" :key="index">
                      <span class="text-primary text-sm font-medium">{{ item }}</span>
                      <!-- Render dot only if not last item -->
                      <span
                        v-if="index < therapistSpecializations.length - 1"
                        class="hidden size-1 rounded-full bg-(--ui-text-muted) sm:block"
                      />
                    </template>
                  </div>
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tabs -->
      <UTabs :items="tabs" default-value="profile" variant="link" class="w-full">
        <!-- Profile Tab -->
        <template #profile>
          <TherapistProfileTab />
        </template>

        <!-- Availability Tab -->
        <template #availability>
          <TherapistAvailabilityTab />
        </template>

        <!-- Statistics Tab -->
        <template #statistics>
          <TherapistStatisticsTab />
        </template>
      </UTabs>
    </div>
  </AppDashboardPage>
</template>
