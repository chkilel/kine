<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'
  import type { WeeklyAvailabilityTemplate, AvailabilityException } from '~~/shared/types/patient.types'

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

  // Availability Management State
  const weeklyTemplates = ref<WeeklyAvailabilityTemplate[]>([
    {
      id: '1',
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '2',
      dayOfWeek: 'Mon',
      startTime: '14:00',
      endTime: '18:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '3',
      dayOfWeek: 'Tue',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '4',
      dayOfWeek: 'Wed',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '5',
      dayOfWeek: 'Thu',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '6',
      dayOfWeek: 'Fri',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    }
  ])

  const exceptions = ref<AvailabilityException[]>([
    {
      id: '1',
      date: '2024-12-25',
      isAvailable: false,
      reason: 'Jour férié - Noël'
    },
    {
      id: '2',
      date: '2024-12-31',
      startTime: '09:00',
      endTime: '12:00',
      isAvailable: true,
      reason: 'Horaires réduits'
    }
  ])

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

  // Template management functions
  function addNewTemplate() {
    const newTemplate: WeeklyAvailabilityTemplate = {
      id: Date.now().toString(),
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    }
    weeklyTemplates.value.push(newTemplate)
  }

  function deleteTemplate(template: WeeklyAvailabilityTemplate) {
    const index = weeklyTemplates.value.findIndex((t: WeeklyAvailabilityTemplate) => t.id === template.id)
    if (index !== -1) {
      weeklyTemplates.value.splice(index, 1)
      toast.add({
        title: 'Succès',
        description: 'Modèle de disponibilité supprimé',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }
  }

  // Exception management functions
  function addNewException() {
    const newException: AvailabilityException = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0] || '',
      startTime: undefined,
      endTime: undefined,
      isAvailable: false,
      reason: undefined
    }
    exceptions.value.push(newException)
  }

  function deleteException(exception: AvailabilityException) {
    const index = exceptions.value.findIndex((e: AvailabilityException) => e.id === exception.id)
    if (index !== -1) {
      exceptions.value.splice(index, 1)
      toast.add({
        title: 'Succès',
        description: 'Exception supprimée',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }
  }

  // Global action functions
  function cancelChanges() {
    // Reset to original data (in real app, this would fetch from API)
    toast.add({
      title: 'Info',
      description: 'Modifications annulées',
      icon: 'i-lucide-info',
      color: 'neutral'
    })
  }

  function saveAllChanges() {
    // Save all changes (in real app, this would send to API)
    toast.add({
      title: 'Succès',
      description: 'Disponibilités enregistrées avec succès',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
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

            <!-- Availability Tab -->
            <template #availability>
              <div class="space-y-6">
                <!-- Weekly Availability Card -->
                <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800/50">
                  <h3 class="mb-4 text-base font-bold text-gray-900 dark:text-white">
                    Modèles de disponibilité hebdomadaire
                  </h3>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                          <th class="px-4 py-3" scope="col">Jour de la semaine</th>
                          <th class="px-4 py-3" scope="col">Heure de début</th>
                          <th class="px-4 py-3" scope="col">Heure de fin</th>
                          <th class="px-4 py-3" scope="col">Lieu</th>
                          <th class="px-4 py-3" scope="col">Max séances</th>
                          <th class="px-4 py-3 text-right" scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(template, index) in weeklyTemplates"
                          :key="template.id"
                          class="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td class="min-w-[150px] px-4 py-3">
                            <USelectMenu
                              v-model="template.dayOfWeek"
                              :items="PREFERRED_DAYS_OPTIONS"
                              value-key="value"
                              size="sm"
                              class="w-full"
                            />
                          </td>
                          <td class="min-w-[120px] px-4 py-3">
                            <UInput v-model="template.startTime" type="time" size="sm" class="w-full" />
                          </td>
                          <td class="min-w-[120px] px-4 py-3">
                            <UInput v-model="template.endTime" type="time" size="sm" class="w-full" />
                          </td>
                          <td class="min-w-[150px] px-4 py-3">
                            <USelectMenu
                              v-model="template.location"
                              :items="CONSULTATION_LOCATION_OPTIONS"
                              value-key="value"
                              size="sm"
                              class="w-full"
                            />
                          </td>
                          <td class="min-w-[120px] px-4 py-3">
                            <UInput
                              v-model="template.maxSessions"
                              type="number"
                              min="1"
                              max="10"
                              size="sm"
                              class="w-full"
                            />
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex items-center justify-end gap-2">
                              <UButton
                                icon="i-lucide-trash"
                                size="xs"
                                color="error"
                                variant="ghost"
                                @click="deleteTemplate(template)"
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <UButton icon="i-lucide-plus" size="sm" variant="outline" class="mt-4" @click="addNewTemplate">
                    Ajouter une plage
                  </UButton>
                </div>

                <!-- Exceptions Card -->
                <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800/50">
                  <h3 class="mb-4 text-base font-bold text-gray-900 dark:text-white">
                    Exceptions (indisponibilités spécifiques)
                  </h3>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                          <th class="px-4 py-3" scope="col">Date</th>
                          <th class="px-4 py-3" scope="col">Heure de début</th>
                          <th class="px-4 py-3" scope="col">Heure de fin</th>
                          <th class="px-4 py-3" scope="col">Disponible</th>
                          <th class="px-4 py-3" scope="col">Motif</th>
                          <th class="px-4 py-3 text-right" scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="exception in exceptions"
                          :key="exception.id"
                          class="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td class="min-w-[150px] px-4 py-3">
                            <UInput v-model="exception.date" type="date" size="sm" class="w-full" />
                          </td>
                          <td class="min-w-[120px] px-4 py-3">
                            <UInput v-model="exception.startTime" type="time" size="sm" class="w-full" />
                          </td>
                          <td class="min-w-[120px] px-4 py-3">
                            <UInput v-model="exception.endTime" type="time" size="sm" class="w-full" />
                          </td>
                          <td class="px-4 py-3">
                            <USwitch v-model="exception.isAvailable" />
                          </td>
                          <td class="min-w-[180px] px-4 py-3">
                            <UInput v-model="exception.reason" placeholder="Motif..." size="sm" class="w-full" />
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex items-center justify-end gap-2">
                              <UButton
                                icon="i-lucide-trash"
                                size="xs"
                                color="error"
                                variant="ghost"
                                @click="deleteException(exception)"
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <UButton icon="i-lucide-plus" size="sm" variant="outline" class="mt-4" @click="addNewException">
                    Ajouter une exception
                  </UButton>
                </div>
              </div>

              <!-- Global Action Buttons -->
              <div class="mt-8 flex justify-end gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
                <UButton variant="outline" @click="cancelChanges">Annuler</UButton>
                <UButton color="primary" @click="saveAllChanges">Enregistrer les modifications</UButton>
              </div>
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
