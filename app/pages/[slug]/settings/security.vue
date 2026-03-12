<script setup lang="ts">
  import * as z from 'zod'
  import type { FormError } from '@nuxt/ui'

  const passwordSchema = z.object({
    current: z.string().min(8, 'Doit comporter au moins 8 caractères'),
    new: z.string().min(8, 'Doit comporter au moins 8 caractères')
  })

  type PasswordSchema = z.output<typeof passwordSchema>

  const password = reactive<Partial<PasswordSchema>>({
    current: undefined,
    new: undefined
  })

  const validate = (state: Partial<PasswordSchema>): FormError[] => {
    const errors: FormError[] = []
    if (state.current && state.new && state.current === state.new) {
      errors.push({ name: 'new', message: 'Les mots de passe doivent être différents' })
    }
    return errors
  }
</script>

<template>
  <AppDashboardPage id="settings-security" title="Sécurité">
    <UPageCard
      title="Mot de passe"
      description="Confirmez votre mot de passe actuel avant d'en définir un nouveau."
      variant="subtle"
    >
      <UForm :schema="passwordSchema" :state="password" :validate="validate" class="flex max-w-xs flex-col gap-4">
        <UFormField name="current">
          <UInput v-model="password.current" type="password" placeholder="Mot de passe actuel" class="w-full" />
        </UFormField>

        <UFormField name="new">
          <UInput v-model="password.new" type="password" placeholder="Nouveau mot de passe" class="w-full" />
        </UFormField>

        <UButton label="Mettre à jour" class="w-fit" type="submit" />
      </UForm>
    </UPageCard>

    <UPageCard
      title="Compte"
      description="Vous ne souhaitez plus utiliser notre service ? Vous pouvez supprimer votre compte ici. Cette action n'est pas réversible. Toutes les informations liées à ce compte seront supprimées définitivement."
      class="from-error/10 to-default bg-gradient-to-tl from-5%"
    >
      <template #footer>
        <UButton label="Supprimer le compte" color="error" />
      </template>
    </UPageCard>
  </AppDashboardPage>
</template>
