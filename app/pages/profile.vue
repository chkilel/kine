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

  // File upload for avatar
  const fileRef = ref<HTMLInputElement>()

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    // TODO: Implement avatar upload with R2
    const file = input.files[0]
    console.log('Avatar file selected:', file)
  }

  function onFileClick() {
    fileRef.value?.click()
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
              <div class="grid grid-cols-1 gap-8 pt-5 lg:grid-cols-3">
                <div class="col-span-1 flex flex-col gap-6 lg:col-span-2">
                  <UCard>
                    <h3 class="mb-5 text-lg font-bold">Informations de base</h3>
                    <ClientOnly>
                      <UForm :schema="userUpdateSchema" :state="profile" @submit="updateProfile" class="space-y-6">
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <UFormField name="firstName" label="Prénom" required>
                            <UInput v-model="profile.firstName" class="w-full" />
                          </UFormField>

                          <UFormField name="lastName" label="Nom" required>
                            <UInput v-model="profile.lastName" class="w-full" />
                          </UFormField>

                          <UFormField name="specialization" label="Spécialisation">
                            <USelectMenu
                              v-model="profile.specialization"
                              :items="SPECIALIZATIONS"
                              value-key="value"
                              multiple
                              placeholder="Sélectionnez une spécialité"
                              class="w-full"
                            />
                          </UFormField>

                          <UFormField name="licenseNumber" label="INPE">
                            <UInput v-model="profile.licenseNumber" class="w-full" />
                          </UFormField>
                        </div>

                        <!-- Session Duration -->
                        <UFormField name="defaultSessionDuration" label="Durée par défaut de la séance">
                          <div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
                            <UButton
                              v-for="duration in SESSION_DURATIONS"
                              :key="duration"
                              :variant="profile.defaultSessionDuration === duration ? 'solid' : 'outline'"
                              :color="profile.defaultSessionDuration === duration ? 'primary' : 'neutral'"
                              size="lg"
                              block
                              @click="profile.defaultSessionDuration = duration"
                            >
                              {{ duration }} min
                            </UButton>
                          </div>
                        </UFormField>

                        <!-- Phone Numbers Component -->
                        <ProfilePhoneNumbers v-model="profile.phoneNumbers" />

                        <div class="flex justify-end gap-3 pt-4">
                          <UButton type="submit" color="primary">Enregistrer les modifications</UButton>
                        </div>
                      </UForm>
                    </ClientOnly>
                  </UCard>
                </div>

                <!-- Sidebar -->
                <div class="col-span-1 flex flex-col gap-6">
                  <!-- Avatar Upload -->
                  <UCard>
                    <h3 class="mb-5 text-lg font-bold">Avater</h3>
                    <div class="flex flex-col items-center gap-4">
                      <UAvatar
                        :src="user.image as string | undefined"
                        :alt="`${profile.firstName} ${profile.lastName}`"
                        size="3xl"
                      />
                      <UButton variant="outline" icon="i-lucide-upload" @click="onFileClick">Changer l'image</UButton>
                      <input
                        ref="fileRef"
                        type="file"
                        class="hidden"
                        accept=".jpg,.jpeg,.png,.gif"
                        @change="onFileChange"
                      />
                    </div>
                  </UCard>

                  <!-- Role Information -->
                  <UCard>
                    <h3 class="mb-5 text-lg font-bold">Informations de rôle</h3>
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium">Rôle</span>
                        <UBadge color="primary" variant="subtle">Thérapeute</UBadge>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium">Organisation</span>
                        <span class="text-sm font-semibold">Cabinet SantéPlus</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium">Équipe</span>
                        <span class="text-sm font-semibold">Kiné Sport</span>
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>
            </template>

            <!-- Availability Tab (Placeholder) -->
            <template #availability>
              <UCard class="mt-5">
                <template #header>
                  <h3 class="text-lg font-semibold">Disponibilités</h3>
                </template>
                <div class="py-12 text-center">
                  <UIcon name="i-lucide-calendar-check" class="mx-auto mb-4 text-4xl" />
                  <p>Gestion des disponibilités à venir</p>
                </div>
              </UCard>
            </template>

            <!-- Statistics Tab (Placeholder) -->
            <template #statistics>
              <UCard class="mt-5">
                <template #header>
                  <h3 class="text-lg font-semibold">Statistiques</h3>
                </template>
                <div class="py-12 text-center">
                  <UIcon name="i-lucide-bar-chart" class="mx-auto mb-4 text-4xl" />
                  <p>Statistiques détaillées à venir</p>
                </div>
              </UCard>
            </template>
          </UTabs>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
