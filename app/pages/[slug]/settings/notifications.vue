<script setup lang="ts">
  const state = reactive<{ [key: string]: boolean }>({
    email: true,
    desktop: false,
    product_updates: true,
    weekly_digest: false,
    important_updates: true
  })

  const sections = [
    {
      title: 'Canaux de notification',
      description: 'Où pouvons-nous vous notifier ?',
      fields: [
        {
          name: 'email',
          label: 'E-mail',
          description: 'Recevoir un récapitulatif quotidien par e-mail.'
        },
        {
          name: 'desktop',
          label: 'Bureau',
          description: 'Recevoir des notifications de bureau.'
        }
      ]
    },
    {
      title: 'Mises à jour du compte',
      description: 'Recevoir des mises à jour concernant Nuxt UI.',
      fields: [
        {
          name: 'weekly_digest',
          label: 'Récapitulatif hebdomadaire',
          description: 'Recevoir un récapitulatif hebdomadaire des nouveautés.'
        },
        {
          name: 'product_updates',
          label: 'Mises à jour du produit',
          description: 'Recevoir un e-mail mensuel avec toutes les nouvelles fonctionnalités et mises à jour.'
        },
        {
          name: 'important_updates',
          label: 'Mises à jour importantes',
          description:
            'Recevoir des e-mails concernant les mises à jour importantes comme les correctifs de sécurité, la maintenance, etc.'
        }
      ]
    }
  ]

  async function onChange() {
    // Do something with data
    console.log(state)
  }
</script>

<template>
  <AppDashboardPage id="settings-notifications" title="Notifications">
    <div v-for="(section, index) in sections" :key="index">
      <UPageCard :title="section.title" :description="section.description" variant="naked" class="mb-4" />

      <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
        <UFormField
          v-for="field in section.fields"
          :key="field.name"
          :name="field.name"
          :label="field.label"
          :description="field.description"
          class="flex items-center justify-between gap-2 not-last:pb-4"
        >
          <USwitch v-model="state[field.name]" @update:model-value="onChange" />
        </UFormField>
      </UPageCard>
    </div>
  </AppDashboardPage>
</template>
