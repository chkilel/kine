<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    metadataText: org?.metadata ? JSON.stringify(org.metadata) : ''
  })

  const state = reactive<OrgMetadata>(defaultForm())

  watch(
    organization,
    (org) => {
      if (!org) return
      Object.assign(state, defaultForm(org))
    },
    { immediate: true }
  )

  const updateOrganization = useUpdateOrganization()
  const toast = useToast()
  const isSaving = computed(() => updateOrganization.isLoading.value)
  const form = useTemplateRef('form')

  function onSubmit(event: FormSubmitEvent<OrgMetadata>) {
    const organizationId = route.params.id as string
    const metadataText = event.data.metadataText
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        metadata: metadataText ? JSON.parse(metadataText) : null
      }
    })
  }

  function handleCancel() {
    if (organization.value) {
      Object.assign(state, defaultForm(organization.value))
      toast.add({
        title: 'Annulation',
        description: 'Modifications annulées',
        color: 'neutral'
      })
    }
  }

  defineExpose({
    handleSave: () => form.value?.submit(),
    handleCancel,
    isSaving
  })
</script>

<template>
  <div v-if="isPending" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
  </div>
  <UForm
    v-else
    ref="form"
    :state="state"
    :schema="orgMetadataSchema"
    class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2"
    @submit="onSubmit"
  >
    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Métadonnées">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted mb-2 text-sm">Champs personnalisés pour des besoins futurs (format JSON).</p>
          <UFormField label="Métadonnées" name="metadataText">
            <UTextarea
              v-model="state.metadataText"
              placeholder='{"key": "value"}'
              :rows="12"
              class="w-full font-mono text-sm"
            />
          </UFormField>
        </div>
      </AppCard>
    </div>

    <div class="flex w-full flex-col gap-6">
      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon
          :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-cog'"
          :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
        />
        <div>
          <p class="text-highlighted text-sm font-bold">
            {{ isSaving ? 'Enregistrement en cours…' : 'Paramètres avancés' }}
          </p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>

      <AppCard variant="outline" title="À propos des métadonnées">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted text-sm">
            Les métadonnées permettent d'ajouter des informations personnalisées à votre organisation. Ces données sont
            stockées au format JSON et peuvent être utilisées par des intégrations tierces ou des fonctionnalités
            futures.
          </p>
          <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
            <UIcon name="i-lucide-code" class="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <p class="text-primary text-sm font-bold">Format</p>
              <p class="text-muted mt-1 text-xs">Assurez-vous que le JSON est valide avant d'enregistrer.</p>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </UForm>
</template>
