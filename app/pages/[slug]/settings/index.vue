<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const fileRef = ref<HTMLInputElement>()

  const profileSchema = z.object({
    name: z.string().min(2, 'Trop court'),
    email: z.string().email('Email invalide'),
    username: z.string().min(2, 'Trop court'),
    avatar: z.string().optional(),
    bio: z.string().optional()
  })

  type ProfileSchema = z.output<typeof profileSchema>

  const profile = reactive<Partial<ProfileSchema>>({
    name: 'Benjamin Canac',
    email: 'ben@nuxtlabs.com',
    username: 'benjamincanac',
    avatar: undefined,
    bio: undefined
  })
  const toast = useToast()
  async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
    toast.add({
      title: 'Succès',
      description: 'Vos paramètres ont été mis à jour.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    console.log(event.data)
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement

    if (!input.files?.length) {
      return
    }

    profile.avatar = URL.createObjectURL(input.files[0]!)
  }

  function onFileClick() {
    fileRef.value?.click()
  }
</script>

<template>
  <AppDashboardPage id="settings-profile" title="Profil">
    <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
      <UPageCard
        title="Profil"
        description="Ces informations seront affichées publiquement."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="settings"
          label="Enregistrer les modifications"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          label="Name"
          description="Will appear on receipts, invoices, and other communication."
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.name" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="email"
          label="Email"
          description="Utilisé pour se connecter, pour les reçus par email et les mises à jour produit."
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.email" type="email" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="username"
          label="Nom d'utilisateur"
          description="Votre nom d'utilisateur unique pour la connexion et votre URL de profil."
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.username" type="username" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="avatar"
          label="Avatar"
          description="JPG, GIF ou PNG. 1 Mo max."
          class="flex justify-between gap-4 max-sm:flex-col sm:items-center"
        >
          <div class="flex flex-wrap items-center gap-3">
            <UAvatar :src="profile.avatar" :alt="profile.name" size="lg" />
            <UButton label="Choisir" color="neutral" @click="onFileClick" />
            <input ref="fileRef" type="file" class="hidden" accept=".jpg, .jpeg, .png, .gif" @change="onFileChange" />
          </div>
        </UFormField>
        <USeparator />
        <UFormField
          name="bio"
          label="Bio"
          description="Brève description pour votre profil. Les URL sont liées."
          class="flex items-start justify-between gap-4 max-sm:flex-col"
          :ui="{ container: 'w-full' }"
        >
          <UTextarea v-model="profile.bio" :rows="5" autoresize class="w-full" />
        </UFormField>
      </UPageCard>
    </UForm>
  </AppDashboardPage>
</template>
