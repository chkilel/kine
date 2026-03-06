<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'
  import type { Organization } from '~~/shared/types/org.types'
  import { orgClinicalIntakeNotificationsSchema, type OrgClinicalIntakeNotifications } from '~~/shared/types/org.types'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    clinical: {
      defaultDurationMinutes: org?.clinical?.defaultDurationMinutes ?? 30,
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

  const state = reactive<OrgClinicalIntakeNotifications>(defaultForm())

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

  function onSubmit(event: FormSubmitEvent<OrgClinicalIntakeNotifications>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: event.data as any
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
    :schema="orgClinicalIntakeNotificationsSchema"
    class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2"
    @submit="onSubmit"
  >
    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Documentation clinique">
        <div class="flex flex-col gap-y-4">
          <div>
            <UFormField label="Durée par défaut (minutes)" name="clinical.defaultDurationMinutes">
              <UInput v-model.number="state.clinical.defaultDurationMinutes" type="number" class="w-full" />
            </UFormField>
          </div>
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
</template>
