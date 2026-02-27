<script setup lang="ts">
  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const metadataText = ref('')

  watchEffect(() => {
    if (organization.value) {
      metadataText.value = organization.value.metadata ? JSON.stringify(organization.value.metadata) : ''
    }
  })

  const isSaving = ref(false)
  const toast = useToast()

  async function handleSave() {
    isSaving.value = true

    try {
      const organizationId = route.params.id as string

      const formData = {
        metadata: metadataText.value ? JSON.parse(metadataText.value) : null
      }

      const result = updateOrganizationSchema.safeParse(formData)

      if (!result.success) {
        const errors = result.error.issues
        const firstError = errors[0]
        if (firstError) {
          toast.add({
            title: 'Erreur de validation',
            description: firstError.message,
            color: 'error'
          })
        }
        isSaving.value = false
        return
      }

      await authClient.organization.update({
        organizationId,
        data: formData
      })

      toast.add({
        title: 'Succès',
        description: 'Les métadonnées ont été mises à jour',
        color: 'success'
      })
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.add({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de la mise à jour",
        color: 'error'
      })
    } finally {
      isSaving.value = false
    }
  }

  function handleCancel() {
    toast.add({
      title: 'Annulation',
      description: 'Modifications annulées',
      color: 'neutral'
    })
  }

  defineExpose({
    handleSave
  })
</script>

<template>
  <div v-if="isPending" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
  </div>
  <div v-else class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2">
    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Métadonnées">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted mb-2 text-sm">Champs personnalisés pour des besoins futurs (format JSON).</p>
          <UFormField label="Métadonnées">
            <UTextarea
              v-model="metadataText"
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
        <UIcon name="i-lucide-cog" class="text-muted size-16" />
        <div>
          <p class="text-highlighted text-sm font-bold">Paramètres avancés</p>
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
  </div>
</template>
