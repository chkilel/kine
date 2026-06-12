<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    rateCent: {
      clinic: org?.pricing?.rateCent?.clinic ? centsToCurrency(org.pricing.rateCent.clinic) : 100,
      home: org?.pricing?.rateCent?.home ? centsToCurrency(org.pricing.rateCent.home) : 100,
      telehealth: org?.pricing?.rateCent?.telehealth ? centsToCurrency(org.pricing.rateCent.telehealth) : 100
    },
    packages:
      org?.pricing?.packages?.map((pkg) => ({
        ...pkg,
        priceCent: pkg.priceCent ? centsToCurrency(pkg.priceCent) : 100
      })) ?? []
  })

  const state = reactive<OrgPricing>(defaultForm())

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

  function onSubmit(event: FormSubmitEvent<OrgPricing>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        pricing: event.data
      }
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
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="isPending" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
    </div>
    <UForm
      v-else
      ref="form"
      :state="state"
      :schema="orgPricingSchema"
      class="grid grid-cols-1 items-start gap-x-12 gap-y-6 lg:grid-cols-2"
      @submit="onSubmit"
    >
      <div class="flex w-full flex-col gap-6">
        <AppCard variant="outline" title="Tarifs de séance">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Ces tarifs sont utilisés par défaut pour les séances. Ils peuvent être surchargés au niveau du plan de
              traitement ou de la séance.
            </p>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <UFormField label="Cabinet (MAD)" name="rateCent.clinic">
                  <UInput v-model.number="state.rateCent.clinic" type="number" class="w-full" />
                </UFormField>
              </div>
              <div>
                <UFormField label="Domicile (MAD)" name="rateCent.home">
                  <UInput v-model.number="state.rateCent.home" type="number" class="w-full" />
                </UFormField>
              </div>
              <div>
                <UFormField label="Téléconsultation (MAD)" name="rateCent.telehealth">
                  <UInput v-model.number="state.rateCent.telehealth" type="number" class="w-full" />
                </UFormField>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <div class="flex w-full flex-col gap-6">
        <div
          class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
        >
          <UIcon
            :name="isSaving ? 'i-lucide-loader-2' : 'i-hugeicons-dollar-circle'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Tarifs à jour' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>

        <AppCard variant="outline" title="À propos des tarifs">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Les tarifs configurés ici sont les tarifs par défaut pour votre organisation. Pour configurer les règles
              de réservation (fenêtre de réservation, délai d'annulation, rappels), rendez-vous sur la page
              <NuxtLink :to="`/organizations/${route.params.id}/scheduling`" class="text-primary underline">
                Planification
              </NuxtLink>
              .
            </p>
            <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
              <UIcon name="i-lucide-info" class="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p class="text-primary text-sm font-bold">Conseil</p>
                <p class="text-muted mt-1 text-xs">
                  Assurez-vous de mettre à jour les tarifs régulièrement pour refléter vos prix actuels.
                </p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </UForm>

    <div class="border-default border-t pt-4">
      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Annuler les changements"
          color="neutral"
          variant="outline"
          :disabled="isSaving"
          @click="handleCancel"
        />
        <UButton
          label="Enregistrer les modifications"
          icon="i-hugeicons-save"
          :loading="isSaving"
          :disabled="isSaving"
          @click="form?.submit()"
        />
      </div>
    </div>
  </div>
</template>
