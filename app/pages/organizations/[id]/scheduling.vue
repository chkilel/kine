<script setup lang="ts">
  import type { FormSubmitEvent, RadioGroupItem } from '@nuxt/ui'
  import {
    APPOINTMENT_DURATIONS,
    APPOINTMENT_GAP,
    APPOINTMENT_SLOT_INCREMENT
  } from '~~/shared/utils/constants.appointment'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    bookingWindowDays: org?.scheduling?.bookingWindowDays ?? 30,
    cancellationHours: org?.scheduling?.cancellationHours ?? 24,
    allowSameDay: org?.scheduling?.allowSameDay ?? false,
    defaultAppointmentDuration: org?.scheduling?.defaultAppointmentDuration ?? 45,
    appointmentGapMinutes: org?.scheduling?.appointmentGapMinutes ?? 5,
    slotIncrementMinutes: org?.scheduling?.slotIncrementMinutes ?? 15
  })

  const state = reactive<OrgScheduling>(defaultForm())

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

  const durationItems = computed<RadioGroupItem[]>(() =>
    APPOINTMENT_DURATIONS.map((duration) => ({ label: `${duration}`, value: duration }))
  )

  const gapItems = computed<RadioGroupItem[]>(() =>
    APPOINTMENT_GAP.map((gap) => ({ label: gap === 0 ? 'Aucun' : `${gap}`, value: gap }))
  )

  const incrementItems = computed<RadioGroupItem[]>(() =>
    APPOINTMENT_SLOT_INCREMENT.map((increment) => ({ label: `${increment}`, value: increment }))
  )

  function onSubmit(event: FormSubmitEvent<OrgScheduling>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        scheduling: event.data
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
      :schema="orgSchedulingSchema"
      class="grid grid-cols-1 items-start gap-x-12 gap-y-6 lg:grid-cols-2"
      @submit="onSubmit"
    >
      <div class="flex w-full flex-col gap-6">
        <AppCard variant="outline" title="Planification">
          <div class="flex flex-col gap-y-4">
            <UFormField label="Durée par défaut de la séance (en min)" name="defaultAppointmentDuration">
              <URadioGroup
                v-model="state.defaultAppointmentDuration"
                :items="durationItems"
                variant="table"
                orientation="horizontal"
                color="primary"
                indicator="hidden"
                :ui="{ fieldset: 'w-full', item: 'flex-1 text-center' }"
              />
            </UFormField>

            <UFormField label="Intervalle entre séances (en min)" name="appointmentGapMinutes">
              <template #help>Temps minimum entre deux séances consécutives</template>
              <URadioGroup
                v-model="state.appointmentGapMinutes"
                :items="gapItems"
                variant="table"
                orientation="horizontal"
                color="primary"
                indicator="hidden"
                :ui="{ fieldset: 'flex-wraps', item: 'flex-1 text-center' }"
              />
            </UFormField>

            <UFormField label="Incrément de créneaux (en min)" name="slotIncrementMinutes">
              <template #help>
                Intervalle entre les heures de début possibles (ex: créneaux toutes les 15 minutes)
              </template>
              <URadioGroup
                v-model="state.slotIncrementMinutes"
                :items="incrementItems"
                variant="table"
                orientation="horizontal"
                color="primary"
                indicator="hidden"
                :ui="{ fieldset: 'flex-wrap -space-x-px', item: 'flex-1 text-center' }"
              />
            </UFormField>
          </div>
        </AppCard>

        <AppCard variant="outline" title="Règles de rendez-vous">
          <div class="flex flex-col gap-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <UFormField label="Fenêtre de réservation (jours)" name="bookingWindowDays">
                  <UInput v-model.number="state.bookingWindowDays" type="number" class="w-full" />
                </UFormField>
              </div>
              <div>
                <UFormField label="Délai d'annulation (heures)" name="cancellationHours">
                  <UInput v-model.number="state.cancellationHours" type="number" class="w-full" />
                </UFormField>
              </div>
            </div>
            <div class="bg-elevated/50 border-border mt-2 flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Réservation le jour même</span>
              <UFormField name="allowSameDay">
                <USwitch v-model="state.allowSameDay" />
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
            :name="isSaving ? 'i-lucide-loader-2' : 'i-hugeicons-calendar-check-in-01'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Planification à jour' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>

        <AppCard variant="outline" title="À propos de la planification">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Configurez ici les règles de planification de vos rendez-vous. Ces paramètres s'appliquent à tous les
              kinésithérapeutes de l'organisation.
            </p>
            <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
              <UIcon name="i-lucide-info" class="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p class="text-primary text-sm font-bold">Conseil</p>
                <p class="text-muted mt-1 text-xs">
                  Une fenêtre de réservation trop courte peut limiter les disponibilités. Privilégiez 2-4 semaines.
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
