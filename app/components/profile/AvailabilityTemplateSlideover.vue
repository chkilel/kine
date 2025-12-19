<script setup lang="ts">
  import { Time } from '@internationalized/date'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{ template?: WeeklyAvailabilityTemplate }>()
  const emit = defineEmits<{ close: [] }>()

  const toast = useToast()
  const formRef = ref<HTMLFormElement>()

  // Form state
  const state = reactive<WeeklyAvailabilityTemplateCreate>({
    dayOfWeek: props.template?.dayOfWeek || 'Mon',
    startTime: props.template?.startTime || '09:00',
    endTime: props.template?.endTime || '12:00',
    location: props.template?.location || 'clinic',
    maxSessions: props.template?.maxSessions || 4
  })

  // Time values for UI components
  const startTimeModel = computed<Time>({
    get: () => {
      const [hours, minutes] = (state.startTime || '09:00').split(':').map(Number)
      return new Time(hours, minutes, 0)
    },
    set: (value: Time) => {
      state.startTime = `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
    }
  })
  const endTimeModel = computed<Time>({
    get: () => {
      const [hours, minutes] = (state.endTime || '12:00').split(':').map(Number)
      return new Time(hours, minutes, 0)
    },
    set: (value: Time) => {
      state.endTime = `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
    }
  })

  function handleSubmit(event: FormSubmitEvent<WeeklyAvailabilityTemplateCreate>) {
    console.log('🚀 >>> ', 'event', ': ', event.data)
    toast.add({
      title: 'Succès',
      description: props.template ? 'Modèle de disponibilité mis à jour' : 'Modèle de disponibilité ajouté',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    emit('close')
  }

  function onCancel() {
    emit('close')
  }
</script>

<template>
  <USlideover
    :title="template ? 'Modifier la plage de disponibilité' : 'Ajouter une plage de disponibilité'"
    :description="
      template ? 'Modifier les horaires réguliers' : 'Définissez les horaires réguliers pour Dr. Jean Martin.'
    "
    :dismissible="false"
    :ui="{ content: 'w-full md:w-1/4  max-w-2xl bg-elevated' }"
    @close="onCancel"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="weeklyAvailabilityTemplateCreateSchema"
        :state="state"
        class="space-y-6"
        @submit="handleSubmit"
      >
        <!-- Timing Section -->
        <AppCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-clock" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Horaires</h3>
          </div>
          <div class="space-y-4">
            <UFormField label="Jour de la semaine" name="dayOfWeek">
              <USelect
                v-model="state.dayOfWeek"
                :items="PREFERRED_DAYS_OPTIONS"
                placeholder="Sélectionner un jour"
                class="w-full"
                size="lg"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Heure de début" name="startTime">
                <UInputTime v-model="startTimeModel" icon="i-lucide-clock" class="w-full" size="lg" />
              </UFormField>
              <UFormField label="Heure de fin" name="endTime">
                <UInputTime v-model="endTimeModel" icon="i-lucide-clock" class="w-full" size="lg" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <!-- Location & Capacity Section -->
        <AppCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-map-pin" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Lieu et Capacité</h3>
          </div>
          <div class="space-y-5">
            <UFormField label="Lieu de consultation" name="location">
              <USelect
                v-model="state.location"
                :items="CONSULTATION_LOCATIONS_WITH_ICONS"
                placeholder="Sélectionner un lieu"
                class="w-full"
                size="lg"
              />
              <p class="text-muted-foreground mt-1.5 text-xs">
                Sélectionnez l'endroit physique ou virtuel de la consultation.
              </p>
            </UFormField>
            <div class="grid gap-4">
              <UFormField label="Max. séances simultanées" name="maxSessions">
                <UFieldGroup class="w-full">
                  <UInputNumber v-model="state.maxSessions" :min="1" :max="10" placeholder="1" class="w-full" />
                  <UBadge color="neutral" variant="outline" label="pers." />
                </UFieldGroup>

                <p class="text-muted-foreground mt-1.5 text-xs">Nombre de patients en même temps.</p>
              </UFormField>
              <UAlert
                color="primary"
                variant="subtle"
                title="Pour autoriser plusieurs patients simultanément."
                icon="i-lucide-info"
              />
            </div>
          </div>
        </AppCard>

        <!-- Options Section -->
        <AppCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-settings-2" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Options avancées</h3>
          </div>
          <USwitch
            :model-value="true"
            disabled
            description="Cette plage sera générée chaque semaine"
            class="flex-row-reverse justify-between"
          >
            <template #label>
              <span class="text-foreground text-sm font-semibold">Récurrence active</span>
            </template>
          </USwitch>
        </AppCard>
      </UForm>
    </template>

    <template #footer>
      <UButton
        variant="outline"
        color="neutral"
        class="w-full rounded-lg px-5 py-2.5 font-semibold sm:w-auto"
        @click="onCancel"
      >
        Annuler
      </UButton>
      <div class="flex w-full justify-end gap-4 sm:w-auto">
        <UButton
          color="primary"
          class="shadow-primary/25 w-full rounded-lg px-6 py-2.5 font-semibold shadow-lg sm:w-auto"
          type="submit"
          @click="formRef?.value.submit()"
        >
          <UIcon name="i-lucide-check" class="text-lg" />
          {{ template ? 'Mettre à jour' : 'Ajouter la plage' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
