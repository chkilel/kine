<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    remindersEnabled: org?.notifications?.remindersEnabled ?? true,
    reminderIntervals: org?.notifications?.reminderIntervals ?? [24, 48],
    patient: {
      appointmentConfirmation: org?.notifications?.patient?.appointmentConfirmation ?? true,
      appointmentReminder: org?.notifications?.patient?.appointmentReminder ?? true,
      paymentReminder: org?.notifications?.patient?.paymentReminder ?? true
    },
    staff: {
      newAppointment: org?.notifications?.staff?.newAppointment ?? true,
      cancellation: org?.notifications?.staff?.cancellation ?? true
    }
  })

  const state = reactive<OrgNotifications>(defaultForm())

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

  function onSubmit(event: FormSubmitEvent<OrgNotifications>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        notifications: event.data
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
      :schema="orgNotificationsSchema"
      class="grid grid-cols-1 items-start gap-x-12 gap-y-6 lg:grid-cols-2"
      @submit="onSubmit"
    >
      <div class="flex w-full flex-col gap-6">
        <AppCard variant="outline" title="Configuration des rappels">
          <div class="flex flex-col gap-y-4">
            <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <div>
                <UFormField label="Rappels (heures avant)" name="reminderIntervals">
                  <UTextarea
                    :model-value="state.reminderIntervals?.join(', ') || ''"
                    @update:model-value="
                      (value: string) =>
                        (state.reminderIntervals = value
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
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Rappels activés</span>
              <UFormField name="remindersEnabled">
                <USwitch v-model="state.remindersEnabled" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <!-- Patient notifications section -->
        <AppCard variant="outline" title="Notifications patients">
          <div class="flex flex-col gap-y-4">
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <div class="flex flex-col gap-1">
                <span class="text-highlighted text-sm font-bold">Confirmation de rendez-vous</span>
                <p class="text-muted text-xs">Envoyé automatiquement après la réservation</p>
              </div>
              <UFormField name="patient.appointmentConfirmation">
                <USwitch v-model="state.patient.appointmentConfirmation" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <div class="flex flex-col gap-1">
                <span class="text-highlighted text-sm font-bold">Rappel de rendez-vous</span>
                <p class="text-muted text-xs">Envoyé selon les intervalles configurés en planification</p>
              </div>
              <UFormField name="patient.appointmentReminder">
                <USwitch v-model="state.patient.appointmentReminder" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <div class="flex flex-col gap-1">
                <span class="text-highlighted text-sm font-bold">Rappel de paiement</span>
                <p class="text-muted text-xs">Envoyé pour les paiements en attente</p>
              </div>
              <UFormField name="patient.paymentReminder">
                <USwitch v-model="state.patient.paymentReminder" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <AppCard variant="outline" title="Notifications staff">
          <div class="flex flex-col gap-y-4">
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <div class="flex flex-col gap-1">
                <span class="text-highlighted text-sm font-bold">Nouveau rendez-vous</span>
                <p class="text-muted text-xs">Averti lors de la réservation d'un nouveau rendez-vous</p>
              </div>
              <UFormField name="staff.newAppointment">
                <USwitch v-model="state.staff.newAppointment" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <div class="flex flex-col gap-1">
                <span class="text-highlighted text-sm font-bold">Annulation</span>
                <p class="text-muted text-xs">Averti lors d'une annulation de rendez-vous</p>
              </div>
              <UFormField name="staff.cancellation">
                <USwitch v-model="state.staff.cancellation" />
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
            :name="isSaving ? 'i-lucide-loader-2' : 'i-hugeicons-notification-03'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Notifications à jour' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>

        <AppCard variant="outline" title="À propos des notifications">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Gérez les notifications envoyées aux patients et au personnel. Ces paramètres s'appliquent à tous les
              kinésithérapeutes de l'organisation.
            </p>
            <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
              <UIcon name="i-lucide-info" class="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p class="text-primary text-sm font-bold">Conseil</p>
                <p class="text-muted mt-1 text-xs">
                  Les notifications par email sont envoyées automatiquement. Configurez également les intervalles de
                  rappels dans la page de planification.
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
