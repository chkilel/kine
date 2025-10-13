<script setup lang="ts">
  import type { AuthFormField, FormSubmitEvent } from '#ui/types'
  import * as z from 'zod/v4'

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
      required: true
    }
  ]

  const { signUp } = await useAuth()

  const schema = z.object({
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom de famille est requis'),
    email: z.email('Adresse email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  })

  type Schema = z.output<typeof schema>

  const pending = ref(false)

  const toast = useToast()
  async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log('Register form submitted', event.data)
    await signUp.email(
      {
        name: `${event.data.firstName} ${event.data.lastName}`,
        firstName: event.data.firstName,
        lastName: event.data.lastName,
        email: event.data.email,
        password: event.data.password
      },
      {
        onRequest: () => {
          pending.value = true
        },
        onResponse: () => {
          pending.value = false
        },
        onSuccess: () => {
          toast.add({
            title: 'Success',
            description: 'You have successfully signed up!',
            color: 'success'
          })

          navigateTo('/app')
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
      <UAuthForm
        :schema="schema"
        title="Inscription"
        description="Entrez vos identifiants pour vous inscrire."
        icon="i-lucide-user"
        :fields="fields"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
</template>
