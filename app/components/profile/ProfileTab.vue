<script setup lang="ts">
  import ProfilePhoneNumbers from './ProfilePhoneNumbers.vue'

  interface Props {
    user: any
    profile: any
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    'update:profile': [value: any]
    'update-profile': []
  }>()

  const toast = useToast()

  async function updateProfile() {
    emit('update-profile')
  }

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
</script>

<template>
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

            <ProfilePhoneNumbers v-model="profile.phoneNumbers" />

            <div class="flex justify-end gap-3 pt-4">
              <UButton type="submit" color="primary">Enregistrer les modifications</UButton>
            </div>
          </UForm>
        </ClientOnly>
      </UCard>
    </div>

    <div class="col-span-1 flex flex-col gap-6">
      <UCard>
        <h3 class="mb-5 text-lg font-bold">Avatar</h3>
        <div class="flex flex-col items-center gap-4">
          <UAvatar
            :src="user.image as string | undefined"
            :alt="`${profile.firstName} ${profile.lastName}`"
            size="3xl"
          />
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
