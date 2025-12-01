<script setup lang="ts">
  import type { AuthFormField, FormSubmitEvent } from '#ui/types'

  definePageMeta({
    auth: true,
    layout: false
  })

  const fields: AuthFormField[] = [
    {
      name: 'firstName',
      type: 'text' as const,
      label: 'Prénom',
      placeholder: 'Entrez votre prénom',
      required: true,
      defaultValue: 'Adil'
    },
    {
      name: 'lastName',
      type: 'text' as const,
      label: 'Nom de famille',
      placeholder: 'Entrez votre nom de famille',
      required: true,
      defaultValue: 'Chehabi'
    },
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
      defaultValue: ''
    }
  ]

  const pending = ref(false)
  const toast = useToast()
  const { signUp } = await useAuth()

  async function onSubmit(event: FormSubmitEvent<SignUpSchema>) {
    const { firstName, lastName, email, password } = event.data
    await signUp.email(
      {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        password
      },
      {
        onRequest: () => {
          pending.value = true
        },
        onResponse: () => {
          pending.value = false
        },
        onSuccess: () => {
          navigateTo('/')
        },
        onError: (errorContext) => {
          toast.add({
            title: 'Error',
            description: errorContext.error.message,
            color: 'error'
          })
        }
      }
    )
  }
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-4 p-6 md:p-10">
    <UPageCard class="w-full max-w-md">
      <UAuthForm :schema="signUpSchema" title="Inscription" icon="i-lucide-user" :fields="fields" @submit="onSubmit">
        <template #description>
          Entrez vos identifiants pour vous inscrire. Déjà un compte?
          <ULink to="/login" class="text-primary font-medium">Connectez-vous</ULink>
          .
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
