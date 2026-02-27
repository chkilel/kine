<script setup lang="ts">
  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const branding = reactive({
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    customDomain: '',
    logoUrl: ''
  })

  const address = reactive({
    street: '',
    postalCode: '',
    city: '',
    sector: '',
    country: ''
  })

  watchEffect(() => {
    if (organization.value) {
      Object.assign(
        branding,
        organization.value.branding || {
          primaryColor: '#3B82F6',
          accentColor: '#10B981',
          customDomain: '',
          logoUrl: ''
        }
      )
      Object.assign(
        address,
        organization.value.address || {
          street: '',
          postalCode: '',
          city: '',
          sector: '',
          country: ''
        }
      )
    }
  })

  const isSaving = ref(false)
  const toast = useToast()

  async function handleSave() {
    isSaving.value = true

    try {
      const organizationId = route.params.id as string

      const formData = {
        branding: toRaw(branding),
        address: toRaw(address)
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
        description: "L'apparence a été mise à jour",
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
      <AppCard variant="outline" title="Branding">
        <div class="flex flex-col gap-y-4">
          <div
            class="border-border hover:bg-elevated/50 group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors"
          >
            <div
              class="bg-default border-border flex size-20 items-center justify-center overflow-hidden rounded-full border shadow-sm"
            >
              <UIcon name="i-lucide-building" class="text-muted size-8" />
            </div>
            <div>
              <p class="text-highlighted group-hover:text-primary text-sm font-bold transition-colors">
                Logo de l'organisation
              </p>
              <p class="text-muted mt-1 text-xs">PNG, JPG ou SVG (Max 2MB)</p>
            </div>
            <UButton label="Changer l'image" color="neutral" variant="outline" size="sm" />
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Couleur primaire">
                <UInput v-model="branding.primaryColor" type="color" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Couleur secondaire">
                <UInput v-model="branding.accentColor" type="color" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div>
            <UFormField label="Domaine personnalisé (optionnel)">
              <UInput v-model="branding.customDomain" placeholder="client.monclinique.ma" class="w-full" />
            </UFormField>
          </div>
        </div>
      </AppCard>

      <AppCard variant="outline" title="Localisation">
        <div class="flex flex-col gap-y-4">
          <div>
            <UFormField label="Adresse complète">
              <UTextarea v-model="address.street" :rows="3" class="w-full" />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <UFormField label="Code postal">
                <UInput v-model="address.postalCode" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Ville">
                <UInput v-model="address.city" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div>
            <UFormField label="Quartier/Secteur">
              <UInput v-model="address.sector" placeholder="Ex: Centre-ville" class="w-full" />
            </UFormField>
          </div>
          <div
            class="bg-elevated border-border group relative mt-2 h-32 w-full cursor-pointer overflow-hidden rounded-xl border"
          >
            <div class="absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/10" />
            <div
              class="bg-default/90 text-highlighted border-border absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur"
            >
              <UIcon name="i-lucide-map" class="size-3.5" />
              <span>Voir sur la carte</span>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Aperçu des couleurs">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted text-sm">Voici un aperçu de vos couleurs de marque.</p>
          <div class="flex items-center gap-4">
            <div class="flex flex-col items-center gap-2">
              <div class="size-16 rounded-xl shadow-sm" :style="{ backgroundColor: branding.primaryColor }" />
              <span class="text-muted text-xs">Primaire</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="size-16 rounded-xl shadow-sm" :style="{ backgroundColor: branding.accentColor }" />
              <span class="text-muted text-xs">Secondaire</span>
            </div>
          </div>
        </div>
      </AppCard>

      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon name="i-lucide-palette" class="text-muted size-16" />
        <div>
          <p class="text-highlighted text-sm font-bold">Apparence à jour</p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
