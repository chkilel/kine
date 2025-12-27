<script setup lang="ts">
  import { parseTime, Time } from '@internationalized/date'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{ template?: WeeklyAvailabilityTemplate }>()
  const emit = defineEmits<{ close: [] }>()

  // Use availability templates composable for API operations
  const { createTemplateMutation, updateTemplateMutation } = useAvailabilityTemplates()

  const formRef = ref<HTMLFormElement>()

  // Loading state for form submission
  const isSubmitting = computed(() => {
    return updateTemplateMutation.isLoading.value || createTemplateMutation.isLoading.value
  })

  // Form state
  const formState = reactive<WeeklyAvailabilityTemplateCreate>({
    dayOfWeek: props.template?.dayOfWeek || 'mon',
    startTime: props.template?.startTime || WORKING_HOURS.start,
    endTime: props.template?.endTime || WORKING_HOURS.end,
    location: props.template?.location || 'clinic',
    maxSessions: props.template?.maxSessions || 4
  })

  // Time values for UI components
  const startTimeModel = computed<Time>({
    get: () => parseTime(formState.startTime || WORKING_HOURS.start),
    set: (value: Time) => (formState.startTime = value.toString()) // ex. '09:45:00'
  })
  const endTimeModel = computed<Time>({
    get: () => parseTime(formState.endTime || WORKING_HOURS.end),
    set: (value: Time) => (formState.endTime = value.toString())
  })

  async function handleSubmit(event: FormSubmitEvent<WeeklyAvailabilityTemplateCreate>) {
    try {
      if (props.template) {
        // Update existing template
        updateTemplateMutation.mutate({
          id: props.template.id,
          data: event.data
        })
      } else {
        // Create new template
        createTemplateMutation.mutate(event.data)
      }

      emit('close')
    } catch (error) {
      parseError(error)
    }
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
        :state="formState"
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
                v-model="formState.dayOfWeek"
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
                v-model="formState.location"
                :items="CONSULTATION_LOCATION_OPTIONS"
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
                  <UInputNumber v-model="formState.maxSessions" :min="1" :max="10" placeholder="1" class="w-full" />
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
      <UButton size="lg" variant="outline" color="neutral" class="font-semibold" @click="onCancel">Annuler</UButton>
      <div class="flex w-full justify-end gap-4 sm:w-auto">
        <UButton
          :loading="isSubmitting"
          :disabled="isSubmitting"
          :icon="!isSubmitting ? 'i-lucide-check' : undefined"
          size="lg"
          color="primary"
          type="submit"
          class="shadow-primary/25 font-semibold"
          @click="formRef?.submit()"
        >
          {{ isSubmitting ? 'Enregistrement...' : template ? 'Mettre à jour' : 'Ajouter la plage' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
