<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types'

  definePageMeta({
    auth: true,
    layout: false
  })

  const toast = useToast()

  const fields = [
    {
      name: 'email',
      type: 'text' as const,
      label: 'Adresse email',
      placeholder: 'Entrez votre adresse email',
      required: true,
      defaultValue: 'adil@chehabi.ma'
    },
    {
      name: 'password',
      label: 'Mot de passe',
      type: 'password' as const,
      placeholder: 'Entrez votre mot de passe',
      required: true,
      defaultValue: 'DEV@1loc'
    },
    {
      name: 'rememberMe',
      label: 'Se souvenir de moi',
      type: 'checkbox' as const
    }
  ]

  const providers = [
    {
      label: 'Google',
      icon: 'i-simple-icons-google',
      onClick: () => {
        toast.add({ title: 'Google', description: 'Connexion avec Google' })
      }
    },
    {
      label: 'GitHub',
      icon: 'i-simple-icons-github',
      onClick: () => {
        toast.add({ title: 'GitHub', description: 'Connexion avec GitHub' })
      }
    }
  ]

  async function onSubmit(event: FormSubmitEvent<LoginSchema>) {
    console.log('Début de la connexion')
    await authClient.signIn.email(
      {
        email: event.data.email,
        password: event.data.password,
        rememberMe: event.data.rememberMe,
        callbackURL: '/'
      },
      {
        onError(context) {
          // TODO: Handle login errors in a cleaner way
          toast.add({ title: 'Erreur', description: 'Adresse email ou mot de passe invalide', color: 'error' })
        }
      }
    )
  }
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-4 p-6 md:p-10">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="loginSchema"
        title="Connexion"
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      >
        <template #description>
          Entrez vos identifiants pour accéder à votre compte. Pas de compte?
          <ULink to="/register" class="text-primary font-medium">Inscrivez-vous</ULink>
          .
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
