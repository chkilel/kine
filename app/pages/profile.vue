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

  // Toast notifications
  const toast = useToast()

  // Get auth session
  const { user, sessionData } = await useAuth()

  // Form state
  const profile = reactive<UpdateUser>({
    firstName: '',
    lastName: '',
    specialization: undefined,
    licenseNumber: undefined,
    defaultSessionDuration: undefined,
    phoneNumbers: [] as PhoneNumber[]
  })

  const therapistSpecializations = computed(() =>
    profile.specialization?.map((item) => getSpecializationLabel(item)).join(', ')
  )

  // Initialize form data from session
  watchEffect(() => {
    if (user.value) {
      profile.firstName = user.value.firstName
      profile.lastName = user.value.lastName
      profile.specialization = user.value.specialization
      profile.licenseNumber = user.value.licenseNumber
      profile.defaultSessionDuration = user.value.defaultSessionDuration
      profile.phoneNumbers = (user.value.phoneNumbers as PhoneNumber[]) || []
    }
  })

  // Update profile function
  async function updateProfile() {
    try {
      const result = await authClient.updateUser({
        name: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        specialization: profile.specialization,
        licenseNumber: profile.licenseNumber,
        defaultSessionDuration: profile.defaultSessionDuration,
        phoneNumbers: profile.phoneNumbers
      })

      if (result.error) {
        toast.add({
          title: 'Erreur',
          description: result.error.message || 'Une erreur est survenue',
          icon: 'i-lucide-alert-circle',
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Succès',
          description: 'Votre profil a été mis à jour',
          icon: 'i-lucide-check-circle',
          color: 'success'
        })
        // Refetch session to get updated data
        const newSessionData = await authClient.useSession(useFetch)
        Object.assign(sessionData, newSessionData)
      }
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
  }
</script>

<template>
  <UDashboardPanel id="profile" class="bg-elevated">
    <template #header>
      <UDashboardNavbar title="Profil">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #title>
          <div class="flex items-center gap-4">
            <!-- <h1 class="text-foreground text-xl font-bold">Profil</h1> -->
            <div class="bg-border h-4 w-px"></div>
            <!-- Breadcrumb -->
            <UBreadcrumb :items="breadcrumbItems" />
          </div>
        </template>

        <template #right>
          <UChip inset size="xl">
            <UButton icon="i-lucide-bell" color="neutral" variant="soft" class="rounded-full" />
          </UChip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div v-if="!user" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
        </div>

        <div v-else class="space-y-6">
          <!-- User Header -->
          <UCard
            variant="soft"
            :ui="{
              body: 'px-0 sm:px-0'
            }"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div class="mx-auto shrink-0 sm:mx-0">
                <UAvatar
                  :src="user.image as string | undefined"
                  :alt="`${profile.firstName} ${profile.lastName}`"
                  :class="[
                    'size-24 text-4xl',
                    getAvatarBgColor(profile.firstName, profile.lastName),
                    getAvatarTextColor(profile.firstName, profile.lastName)
                  ]"
                />
              </div>
              <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
                <h1 class="text-2xl leading-tight font-bold md:text-3xl">
                  {{ profile.firstName }} {{ profile.lastName }}
                </h1>
                <div class="text-muted flex flex-col flex-wrap items-center gap-y-2 text-sm sm:items-start">
                  <div v-if="user.email" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-mail" class="text-base" />
                    <a class="hover:text-primary truncate hover:underline" :href="`mailto:${user.email}`">
                      {{ user.email }}
                    </a>
                  </div>
                  <div v-if="profile.specialization" class="flex items-center gap-1.5">
                    <ClientOnly>
                      <template #fallback>
                        <USkeleton class="bg-accented size-5" />
                        <USkeleton class="bg-accented h-5 w-[250px]" />
                      </template>
                      <UIcon name="i-lucide-briefcase" class="text-base" />
                      <span>{{ therapistSpecializations }}</span>
                    </ClientOnly>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Tabs -->
          <UTabs :items="tabs" default-value="profile" variant="link" class="w-full">
            <!-- Profile Tab -->
            <template #profile>
              <ProfileTab :user="user" :profile="profile" @update-profile="updateProfile" />
            </template>

            <!-- Availability Tab -->
            <template #availability>
              <ProfileAvailabilityTab />
            </template>

            <!-- Statistics Tab -->
            <template #statistics>
              <ProfileStatisticsTab />
            </template>
          </UTabs>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
