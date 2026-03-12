<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    pricing: {
      sessionRates: {
        clinic: org?.pricing?.sessionRates?.clinic,
        home: org?.pricing?.sessionRates?.home,
        telehealth: org?.pricing?.sessionRates?.telehealth
      },
      packages: org?.pricing?.packages ?? []
    },
    scheduling: {
      bookingWindowDays: org?.scheduling?.bookingWindowDays ?? 30,
      cancellationHours: org?.scheduling?.cancellationHours ?? 24,
      allowSameDay: org?.scheduling?.allowSameDay ?? false,
      requirePaymentUpfront: org?.scheduling?.requirePaymentUpfront ?? false,
      remindersEnabled: org?.scheduling?.remindersEnabled ?? true,
      reminderIntervals: org?.scheduling?.reminderIntervals ?? [24, 48]
    }
  })

  const state = reactive<OrgPricingScheduling>(defaultForm())

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

  function onSubmit(event: FormSubmitEvent<OrgPricingScheduling>) {
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
    :schema="orgPricingSchedulingSchema"
    class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2"
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
              <UFormField label="Cabinet (MAD)" name="pricing.sessionRates.cabinet">
                <UInput v-model.number="state.pricing.sessionRates.clinic" type="number" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Domicile (MAD)" name="pricing.sessionRates.domicile">
                <UInput v-model.number="state.pricing.sessionRates.home" type="number" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Téléconsultation (MAD)" name="pricing.sessionRates.teleconsultation">
                <UInput v-model.number="state.pricing.sessionRates.telehealth" type="number" class="w-full" />
              </UFormField>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard variant="outline" title="Règles de rendez-vous">
        <div class="flex flex-col gap-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Fenêtre de réservation (jours)" name="scheduling.bookingWindowDays">
                <UInput v-model.number="state.scheduling.bookingWindowDays" type="number" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Délai d'annulation (heures)" name="scheduling.cancellationHours">
                <UInput v-model.number="state.scheduling.cancellationHours" type="number" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Rappels (heures avant)" name="scheduling.reminderIntervals">
                <UTextarea
                  :model-value="state.scheduling.reminderIntervals?.join(', ') || ''"
                  @update:model-value="
                    (value: string) =>
                      (state.scheduling.reminderIntervals = value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean)
                        .map(Number))
                  "
                  placeholder="24, 48, 72"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
          <div class="bg-elevated/50 border-border mt-2 flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Réservation le jour même</span>
            <UFormField name="scheduling.allowSameDay">
              <USwitch v-model="state.scheduling.allowSameDay" />
            </UFormField>
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Paiement à l'avance requis</span>
            <UFormField name="scheduling.requirePaymentUpfront">
              <USwitch v-model="state.scheduling.requirePaymentUpfront" />
            </UFormField>
          </div>
        </div>
      </AppCard>
    </div>

    <div class="flex w-full flex-col gap-6">
      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon
          :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-calendar-clock'"
          :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
        />
        <div>
          <p class="text-highlighted text-sm font-bold">
            {{ isSaving ? 'Enregistrement en cours…' : 'Tarifs et réservations à jour' }}
          </p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>

      <AppCard variant="outline" title="À propos des tarifs">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted text-sm">
            Les tarifs configurés ici sont les tarifs par défaut pour votre organisation. Vous pouvez les adapter pour
            chaque plan de traitement ou séance individuelle si nécessaire.
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
</template>
