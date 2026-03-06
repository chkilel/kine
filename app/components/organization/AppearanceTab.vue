<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'
  import type { Organization } from '~~/shared/types/org.types'
  import { orgBrandingOnlySchema, type OrgBrandingOnly } from '~~/shared/types/org.types'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    branding: {
      primaryColor: org?.branding?.primaryColor ?? '#3B82F6',
      accentColor: org?.branding?.accentColor ?? '#10B981',
      customDomain: org?.branding?.customDomain ?? '',
      logoUrl: org?.branding?.logoUrl
    }
  })

  const state = reactive<OrgBrandingOnly>(defaultForm())

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

  function onSubmit(event: FormSubmitEvent<OrgBrandingOnly>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: event.data
    })
  }

  function handleCancel() {
    if (organization.value) {
      Object.assign(state, defaultForm(organization.value))
      form.value?.clear()
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
    :schema="orgBrandingOnlySchema"
    class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2"
    @submit="onSubmit"
  >
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
              <UFormField label="Couleur primaire" name="branding.primaryColor">
                <UInput v-model="state.branding.primaryColor" type="color" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Couleur secondaire" name="branding.accentColor">
                <UInput v-model="state.branding.accentColor" type="color" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div>
            <UFormField label="Domaine personnalisé (optionnel)" name="branding.customDomain">
              <UInput v-model="state.branding.customDomain" placeholder="client.monclinique.ma" class="w-full" />
            </UFormField>
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
              <div class="size-16 rounded-xl shadow-sm" :style="{ backgroundColor: state.branding.primaryColor }" />
              <span class="text-muted text-xs">Primaire</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="size-16 rounded-xl shadow-sm" :style="{ backgroundColor: state.branding.accentColor }" />
              <span class="text-muted text-xs">Secondaire</span>
            </div>
          </div>
        </div>
      </AppCard>

      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon
          :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-palette'"
          :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
        />
        <div>
          <p class="text-highlighted text-sm font-bold">
            {{ isSaving ? 'Enregistrement en cours…' : 'Apparence à jour' }}
          </p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>
    </div>
  </UForm>
</template>
