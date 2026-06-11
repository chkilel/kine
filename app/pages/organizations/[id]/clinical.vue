<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'
  import {
    APPOINTMENT_DURATIONS,
    APPOINTMENT_GAP,
    APPOINTMENT_SLOT_INCREMENT
  } from '~~/shared/utils/constants.appointment'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    scheduling: {
      bookingWindowDays: org?.scheduling?.bookingWindowDays ?? 30,
      cancellationHours: org?.scheduling?.cancellationHours ?? 24,
      allowSameDay: org?.scheduling?.allowSameDay ?? false,
      requirePaymentUpfront: org?.scheduling?.requirePaymentUpfront ?? false,
      remindersEnabled: org?.scheduling?.remindersEnabled ?? true,
      reminderIntervals: org?.scheduling?.reminderIntervals ?? [24, 48],
      defaultAppointmentDuration: org?.scheduling?.defaultAppointmentDuration ?? 45,
      appointmentGapMinutes: org?.scheduling?.appointmentGapMinutes ?? 5,
      slotIncrementMinutes: org?.scheduling?.slotIncrementMinutes ?? 15
    },
    clinical: {
      requirePainAssessment: org?.clinical?.requirePainAssessment ?? true,
      requireGoals: org?.clinical?.requireGoals ?? true,
      requireNextSteps: org?.clinical?.requireNextSteps ?? true,
      noteTemplates: org?.clinical?.noteTemplates ?? []
    },
    intake: {
      requiredFields: org?.intake?.requiredFields ?? [
        'firstName',
        'lastName',
        'dateOfBirth',
        'phone',
        'email',
        'address'
      ],
      consents: {
        privacy: org?.intake?.consents?.privacy ?? false,
        treatment: org?.intake?.consents?.treatment ?? false,
        financial: org?.intake?.consents?.financial ?? false,
        telehealth: org?.intake?.consents?.telehealth ?? false
      }
    },
    notifications: {
      patient: {
        appointmentConfirmation: org?.notifications?.patient?.appointmentConfirmation ?? true,
        appointmentReminder: org?.notifications?.patient?.appointmentReminder ?? true,
        paymentReminder: org?.notifications?.patient?.paymentReminder ?? true
      },
      staff: {
        newAppointment: org?.notifications?.staff?.newAppointment ?? true,
        cancellation: org?.notifications?.staff?.cancellation ?? true
      }
    }
  })

  const state = reactive({
    scheduling: defaultForm().scheduling,
    clinical: defaultForm().clinical,
    intake: defaultForm().intake,
    notifications: defaultForm().notifications
  })

  watch(
    organization,
    (org) => {
      if (!org) return
      const form = defaultForm(org)
      state.scheduling = form.scheduling
      state.clinical = form.clinical
      state.intake = form.intake
      state.notifications = form.notifications
    },
    { immediate: true }
  )

  const updateOrganization = useUpdateOrganization()
  const toast = useToast()
  const isSaving = computed(() => updateOrganization.isLoading.value)
  const form = useTemplateRef('form')

  function onSubmit(_event: FormSubmitEvent<UpdateOrganization>) {
    const organizationId = route.params.id as string
    const payload: Record<string, any> = {}
    if (state.scheduling) payload.scheduling = state.scheduling
    if (state.clinical) payload.clinical = state.clinical
    if (state.intake) payload.intake = state.intake
    if (state.notifications) payload.notifications = state.notifications
    updateOrganization.mutate({
      organizationId,
      organizationData: payload
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
      :schema="orgSchedulingSchema.or(orgClinicalIntakeNotificationsSchema)"
      class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2"
      @submit="onSubmit"
    >
      <div class="flex w-full flex-col gap-6">
        <AppCard variant="outline" title="Planification">
          <div class="flex flex-col gap-y-4">
            <UFormField label="Durée par défaut de la séance" name="scheduling.defaultAppointmentDuration">
              <ClientOnly>
                <template #fallback>
                  <div class="grid w-full grid-cols-4 gap-2 sm:grid-cols-7">
                    <USkeleton
                      v-for="duration in APPOINTMENT_DURATIONS"
                      :key="duration"
                      class="border-default h-9 rounded-lg border"
                    />
                  </div>
                </template>
                <div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  <UButton
                    v-for="duration in APPOINTMENT_DURATIONS"
                    :key="duration"
                    :variant="state.scheduling.defaultAppointmentDuration === duration ? 'solid' : 'outline'"
                    :color="state.scheduling.defaultAppointmentDuration === duration ? 'primary' : 'neutral'"
                    size="lg"
                    block
                    @click="state.scheduling.defaultAppointmentDuration = duration"
                  >
                    {{ duration }} min
                  </UButton>
                </div>
              </ClientOnly>
            </UFormField>

            <UFormField label="Intervalle entre séances" name="scheduling.appointmentGapMinutes">
              <template #hint>Temps minimum entre deux séances consécutives</template>
              <ClientOnly>
                <template #fallback>
                  <div class="grid w-full grid-cols-4 gap-2 sm:grid-cols-8">
                    <USkeleton v-for="gap in APPOINTMENT_GAP" :key="gap" class="border-default h-9 rounded-lg border" />
                  </div>
                </template>
                <div class="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  <UButton
                    v-for="gap in APPOINTMENT_GAP"
                    :key="gap"
                    :variant="state.scheduling.appointmentGapMinutes === gap ? 'solid' : 'outline'"
                    :color="state.scheduling.appointmentGapMinutes === gap ? 'primary' : 'neutral'"
                    size="lg"
                    block
                    @click="state.scheduling.appointmentGapMinutes = gap"
                  >
                    {{ gap === 0 ? 'Aucun' : `${gap} min` }}
                  </UButton>
                </div>
              </ClientOnly>
            </UFormField>

            <UFormField label="Incrément de créneaux" name="scheduling.slotIncrementMinutes">
              <template #hint>
                Intervalle entre les heures de début possibles (ex: créneaux toutes les 15 minutes)
              </template>
              <ClientOnly>
                <template #fallback>
                  <div class="grid w-full grid-cols-5 gap-2">
                    <USkeleton
                      v-for="increment in APPOINTMENT_SLOT_INCREMENT"
                      :key="increment"
                      class="border-default h-9 rounded-lg border"
                    />
                  </div>
                </template>
                <div class="grid grid-cols-5 gap-2">
                  <UButton
                    v-for="increment in APPOINTMENT_SLOT_INCREMENT"
                    :key="increment"
                    :variant="state.scheduling.slotIncrementMinutes === increment ? 'solid' : 'outline'"
                    :color="state.scheduling.slotIncrementMinutes === increment ? 'primary' : 'neutral'"
                    size="lg"
                    block
                    @click="state.scheduling.slotIncrementMinutes = increment"
                  >
                    {{ increment }} min
                  </UButton>
                </div>
              </ClientOnly>
            </UFormField>
          </div>
        </AppCard>

        <AppCard variant="outline" title="Documentation clinique">
          <div class="flex flex-col gap-y-4">
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Exiger évaluation de la douleur</span>
              <UFormField name="clinical.requirePainAssessment">
                <USwitch v-model="state.clinical.requirePainAssessment" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Exiger objectifs</span>
              <UFormField name="clinical.requireGoals">
                <USwitch v-model="state.clinical.requireGoals" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Exiger prochaines étapes</span>
              <UFormField name="clinical.requireNextSteps">
                <USwitch v-model="state.clinical.requireNextSteps" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <AppCard variant="outline" title="Inscription patient">
          <div class="flex flex-col gap-y-4">
            <UFormField label="Champs requis" name="intake.requiredFields">
              <UCheckboxGroup
                :items="[
                  { label: 'Prénom', value: 'firstName' },
                  { label: 'Nom', value: 'lastName' },
                  { label: 'Date de naissance', value: 'dateOfBirth' },
                  { label: 'Téléphone', value: 'phone' },
                  { label: 'Email', value: 'email' },
                  { label: 'Adresse', value: 'address' }
                ]"
                v-model="state.intake.requiredFields"
              />
            </UFormField>
            <p class="text-muted mb-2 text-sm">Formulaires de consentement</p>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Politique de confidentialité</span>
              <UFormField name="intake.consents.privacy">
                <USwitch v-model="state.intake.consents.privacy" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Consentement de traitement</span>
              <UFormField name="intake.consents.treatment">
                <USwitch v-model="state.intake.consents.treatment" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Responsabilité financière</span>
              <UFormField name="intake.consents.financial">
                <USwitch v-model="state.intake.consents.financial" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Téléconsultation</span>
              <UFormField name="intake.consents.telehealth">
                <USwitch v-model="state.intake.consents.telehealth" />
              </UFormField>
            </div>
          </div>
        </AppCard>
      </div>

      <div class="flex w-full flex-col gap-6">
        <AppCard variant="outline" title="Notifications">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted mb-2 text-sm">Notifications patients</p>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Confirmation de rendez-vous</span>
              <UFormField name="notifications.patient.appointmentConfirmation">
                <USwitch v-model="state.notifications.patient.appointmentConfirmation" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Rappel de rendez-vous</span>
              <UFormField name="notifications.patient.appointmentReminder">
                <USwitch v-model="state.notifications.patient.appointmentReminder" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Rappel de paiement</span>
              <UFormField name="notifications.patient.paymentReminder">
                <USwitch v-model="state.notifications.patient.paymentReminder" />
              </UFormField>
            </div>

            <p class="text-muted mt-4 mb-2 text-sm">Notifications staff</p>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Nouveau rendez-vous</span>
              <UFormField name="notifications.staff.newAppointment">
                <USwitch v-model="state.notifications.staff.newAppointment" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Annulation</span>
              <UFormField name="notifications.staff.cancellation">
                <USwitch v-model="state.notifications.staff.cancellation" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <div
          class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
        >
          <UIcon
            :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-stethoscope'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Configuration clinique à jour' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>
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
