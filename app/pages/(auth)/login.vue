<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types'
  import * as z from 'zod/v4'

  definePageMeta({
    auth: true,
    layout: false,
  })

  const schema = z.object({
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Doit contenir au moins 8 caractères'),
  })
  type Schema = z.output<typeof schema>

  const toast = useToast()
  const { signIn } = await useAuth()

  const fields = [
    {
      name: 'email',
      type: 'text' as const,
      label: 'Adresse email',
      placeholder: 'Entrez votre adresse email',
      required: true,
    },
    {
      name: 'password',
      label: 'Mot de passe',
      type: 'password' as const,
      placeholder: 'Entrez votre mot de passe',
    },
    {
      name: 'remember',
      label: 'Se souvenir de moi',
      type: 'checkbox' as const,
    },
  ]

  const providers = [
    {
      label: 'Google',
      icon: 'i-simple-icons-google',
      onClick: () => {
        toast.add({ title: 'Google', description: 'Connexion avec Google' })
      },
    },
    {
      label: 'GitHub',
      icon: 'i-simple-icons-github',
      onClick: () => {
        toast.add({ title: 'GitHub', description: 'Connexion avec GitHub' })
      },
    },
  ]

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log('Début de la connexion')
    await signIn.email(
      {
        email: event.data.email,
        password: event.data.password,
        callbackURL: '/',
      },
      {
        onError(context) {
          console.log('🚀 >>> ', 'Error', ': ', context.error)

          toast.add({ title: 'Erreur', description: 'Adresse email ou mot de passe invalide', color: 'error' })
        },
      }
    )
  }
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-4 p-6 md:p-10">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Connexion"
        description="Entrez vos identifiants pour accéder à votre compte."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
</template>
