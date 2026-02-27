<script setup lang="ts">
  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const clinical = reactive({
    defaultDurationMinutes: 30,
    requirePainAssessment: true,
    requireGoals: true,
    requireNextSteps: true,
    noteTemplates: []
  })

  const intake = reactive({
    requiredFields: ['firstName', 'lastName', 'dateOfBirth', 'phone', 'email', 'address'],
    consents: {
      privacy: false,
      treatment: false,
      financial: false,
      telehealth: false
    }
  })

  const notifications = reactive({
    patient: {
      appointmentConfirmation: true,
      appointmentReminder: true,
      paymentReminder: true
    },
    staff: {
      newAppointment: true,
      cancellation: true
    }
  })

  watchEffect(() => {
    if (organization.value) {
      Object.assign(
        clinical,
        organization.value.clinical || {
          defaultDurationMinutes: 30,
          requirePainAssessment: true,
          requireGoals: true,
          requireNextSteps: true,
          noteTemplates: []
        }
      )
      Object.assign(
        intake,
        organization.value.intake || {
          requiredFields: ['firstName', 'lastName', 'dateOfBirth', 'phone', 'email', 'address'],
          consents: { privacy: false, treatment: false, financial: false, telehealth: false }
        }
      )
      Object.assign(
        notifications,
        organization.value.notifications || {
          patient: { appointmentConfirmation: true, appointmentReminder: true, paymentReminder: true },
          staff: { newAppointment: true, cancellation: true }
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
        clinical: toRaw(clinical),
        intake: toRaw(intake),
        notifications: toRaw(notifications)
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
        description: 'La configuration clinique a été mise à jour',
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
      <AppCard variant="outline" title="Documentation clinique">
        <div class="flex flex-col gap-y-4">
          <div>
            <UFormField label="Durée par défaut (minutes)">
              <UInput v-model="clinical.defaultDurationMinutes" type="number" class="w-full" />
            </UFormField>
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Exiger évaluation de la douleur</span>
            <USwitch v-model="clinical.requirePainAssessment" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Exiger objectifs</span>
            <USwitch v-model="clinical.requireGoals" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Exiger prochaines étapes</span>
            <USwitch v-model="clinical.requireNextSteps" />
          </div>
        </div>
      </AppCard>

      <AppCard variant="outline" title="Inscription patient">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted mb-2 text-sm">Formulaires de consentement</p>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Politique de confidentialité</span>
            <USwitch v-model="intake.consents.privacy" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Consentement de traitement</span>
            <USwitch v-model="intake.consents.treatment" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Responsabilité financière</span>
            <USwitch v-model="intake.consents.financial" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Téléconsultation</span>
            <USwitch v-model="intake.consents.telehealth" />
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
            <USwitch v-model="notifications.patient.appointmentConfirmation" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Rappel de rendez-vous</span>
            <USwitch v-model="notifications.patient.appointmentReminder" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Rappel de paiement</span>
            <USwitch v-model="notifications.patient.paymentReminder" />
          </div>

          <p class="text-muted mt-4 mb-2 text-sm">Notifications staff</p>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Nouveau rendez-vous</span>
            <USwitch v-model="notifications.staff.newAppointment" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Annulation</span>
            <USwitch v-model="notifications.staff.cancellation" />
          </div>
        </div>
      </AppCard>

      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon name="i-lucide-stethoscope" class="text-muted size-16" />
        <div>
          <p class="text-highlighted text-sm font-bold">Configuration clinique à jour</p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
