<script setup lang="ts">
  import type { FormError } from '@nuxt/ui'

  const toast = useToast()

  // Get auth session
  const { sessionData, user } = await useAuth()

  const form = useTemplateRef<HTMLFormElement>('form')

  // Form state
  const profile = reactive<UpdateUser>({
    firstName: user.value?.firstName || '',
    lastName: user.value?.lastName || '',
    specialization: user.value?.specialization,
    licenseNumber: user.value?.licenseNumber,
    defaultSessionDuration: user.value?.defaultSessionDuration,
    phoneNumbers: user.value?.phoneNumbers
  })

  const phoneError = computed(() => {
    return (form.value?.errors as FormError[])?.find((item) => item.name?.includes('phoneNumbers'))?.message || null
  })

  const fileRef = ref<HTMLInputElement>()

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0]
    console.log('Avatar file selected:', file)
  }

  function onFileClick() {
    fileRef.value?.click()
  }

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
  <div class="grid grid-cols-1 gap-8 pt-5 lg:grid-cols-3">
    <div class="col-span-1 flex flex-col gap-6 lg:col-span-2">
      <UCard>
        <h3 class="mb-5 text-lg font-bold">Informations de base</h3>
        <UForm ref="form" :schema="userUpdateSchema" :state="profile" @submit="updateProfile" class="space-y-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UFormField name="firstName" label="Prénom" required>
              <UInput v-model="profile.firstName" class="w-full" />
            </UFormField>

            <UFormField name="lastName" label="Nom" required>
              <UInput v-model="profile.lastName" class="w-full" />
            </UFormField>

            <UFormField name="specialization" label="Spécialisation">
              <ClientOnly>
                <template #fallback>
                  <USkeleton class="border-accented bg-elevated h-8 w-full rounded-lg border" />
                </template>
                <USelectMenu
                  v-model="profile.specialization"
                  :items="SPECIALIZATIONS"
                  value-key="value"
                  multiple
                  placeholder="Sélectionnez une spécialité"
                  class="w-full"
                />
              </ClientOnly>
            </UFormField>

            <UFormField name="licenseNumber" label="INPE">
              <UInput v-model="profile.licenseNumber" class="w-full" />
            </UFormField>
          </div>

          <UFormField name="defaultSessionDuration" label="Durée par défaut de la séance">
            <ClientOnly>
              <template #fallback>
                <div class="grid w-full grid-cols-4 gap-2 sm:grid-cols-7">
                  <USkeleton
                    v-for="duration in SESSION_DURATIONS"
                    :key="duration"
                    class="border-default h-9 rounded-lg border"
                  />
                </div>
              </template>
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
            </ClientOnly>
          </UFormField>

          <ProfilePhoneNumbers v-model="profile.phoneNumbers" :error="phoneError" />

          <div class="flex justify-end gap-3 pt-4">
            <UButton type="submit" color="primary">Enregistrer les modifications</UButton>
          </div>
        </UForm>
      </UCard>
    </div>

    <div class="col-span-1 flex flex-col gap-6">
      <UCard>
        <h3 class="mb-5 text-lg font-bold">Avatar</h3>
        <div class="flex flex-col items-center gap-4">
          <UAvatar :src="user?.image as string" :alt="`${profile.firstName} ${profile.lastName}`" size="3xl" />
          <UButton variant="outline" icon="i-lucide-upload" @click="onFileClick">Changer l'image</UButton>
          <input ref="fileRef" type="file" class="hidden" accept=".jpg,.jpeg,.png,.gif" @change="onFileChange" />
        </div>
      </UCard>

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
