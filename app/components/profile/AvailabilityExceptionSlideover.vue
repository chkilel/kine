<script setup lang="ts">
  import { CalendarDate, Time, getLocalTimeZone, parseDate, parseTime, today } from '@internationalized/date'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{ availabilityException?: AvailabilityException }>()
  const emit = defineEmits<{ close: [] }>()

  // Use availability exceptions composable for API operations
  const { createException, updateException, isCreating, isUpdating } = useAvailabilityExceptions()

  const formRef = ref<HTMLFormElement>()
  const isOtherReason = computed(() => formState.reason === 'other')
  const otherReasonText = ref('')

  // Form state
  const formState = reactive<AvailabilityExceptionCreate>({
    date: props.availabilityException?.date || today(getLocalTimeZone()).toString(),
    startTime: props.availabilityException?.startTime || undefined,
    endTime: props.availabilityException?.endTime || undefined,
    isAvailable: props.availabilityException?.isAvailable ?? false,
    reason: props.availabilityException?.reason || 'other'
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

  // Full day toggle
  const isFullDay = computed({
    get: () => !formState.startTime && !formState.endTime,
    set: (value: boolean) => {
      if (value) {
        formState.startTime = undefined
        formState.endTime = undefined
      } else {
        formState.startTime = WORKING_HOURS.start
        formState.endTime = WORKING_HOURS.end
      }
    }
  })

  // Calendar model for date picker
  const dateModel = computed<CalendarDate | null>({
    get: () => (formState.date ? parseDate(formState.date) : null),
    set: (calendarDate) => {
      formState.date = calendarDate ? calendarDate.toString() : today(getLocalTimeZone()).toString()
    }
  })

  async function handleSubmit(_event: FormSubmitEvent<AvailabilityExceptionCreate>) {
    try {
      if (props.availabilityException) {
        // Update existing exception
        updateException(props.availabilityException.id, formState)
      } else {
        // Create new exception
        createException(formState)
      }

      emit('close')
    } catch (error) {
      parseError(error)
    }
  }

  function selectReason(reason: Reason) {
    formState.reason = reason
    if (reason !== 'other') otherReasonText.value = ''
  }
</script>

<template>
  <USlideover
    :open="true"
    :dismissible="false"
    @close="emit('close')"
    :title="props.availabilityException ? 'Modifier l\'exception' : 'Ajouter une exception'"
    :description="
      props.availabilityException
        ? 'Modifier les disponibilités exceptionnelles'
        : 'Définissez une période d\'indisponibilité ou de disponibilité spécifique.'
    "
    :ui="{
      content: 'w-full md:w-1/2 lg:w-1/3 max-w-lg bg-elevated'
    }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="availabilityExceptionCreateSchema"
        :state="formState"
        class="space-y-6"
        @submit="handleSubmit"
      >
        <!-- Date Section -->
        <AppCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-calendar" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Date</h3>
          </div>
          <UFormField name="date">
            <UCalendar v-model="dateModel" size="lg" class="w-full" :ui="{ header: 'capitalize text-lg' }" />
          </UFormField>
        </AppCard>

        <!-- Timing Section -->
        <AppCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-clock" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Horaires</h3>
          </div>
          <div class="space-y-4">
            <UFormField name="fullDay">
              <USwitch
                v-model="isFullDay"
                description="Masquera les champs d'heures."
                class="flex-row-reverse justify-between"
              >
                <template #label>
                  <span class="text-foreground text-sm font-semibold">Journée complète</span>
                </template>
              </USwitch>
            </UFormField>

            <div v-if="!isFullDay" class="grid grid-cols-2 gap-4">
              <UFormField label="Heure de début" name="startTime">
                <UInputTime v-model="startTimeModel" icon="i-lucide-clock" class="w-full" size="lg" />
              </UFormField>
              <UFormField label="Heure de fin" name="endTime">
                <UInputTime v-model="endTimeModel" icon="i-lucide-clock" class="w-full" size="lg" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <!-- Availability Section -->
        <AppCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-toggle-left" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Disponibilité</h3>
          </div>
          <div class="space-y-4">
            <UFormField name="isAvailable">
              <USwitch
                v-model="formState.isAvailable"
                description="Le thérapeute est-il disponible sur ce créneau ?"
                class="flex-row-reverse justify-between"
              >
                <template #label>
                  <span class="text-foreground text-sm font-semibold">
                    {{ formState.isAvailable ? 'Disponible' : 'Indisponible' }}
                  </span>
                </template>
              </USwitch>
            </UFormField>

            <UFormField v-if="!formState.isAvailable" label="Motif de l'absence" name="reason">
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="reason in EXCEPTION_TYPE_OPTIONS"
                    :key="reason.value"
                    :variant="formState.reason === reason?.value ? 'solid' : 'outline'"
                    :color="formState.reason === reason.value ? 'primary' : 'neutral'"
                    :icon="getExceptionTypeIcon(reason.value)"
                    size="sm"
                    @click="selectReason(reason.value)"
                    class="inline-flex items-center gap-2"
                  >
                    {{ reason.label }}
                  </UButton>
                </div>
                <UInput
                  v-if="isOtherReason"
                  v-model="otherReasonText"
                  placeholder="Veuillez préciser le motif..."
                  size="lg"
                  class="w-full"
                />
              </div>
            </UFormField>
          </div>
        </AppCard>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="emit('close')">
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="shadow-primary/25 h-9 px-3 text-sm font-semibold shadow-lg"
          type="submit"
          :loading="isCreating || isUpdating"
          :disabled="isCreating || isUpdating"
          @click="formRef?.submit()"
        >
          <UIcon v-if="!isCreating && !isUpdating" name="i-lucide-check" class="text-lg" />
          {{
            isCreating || isUpdating
              ? 'Enregistrement...'
              : props.availabilityException
                ? 'Mettre à jour'
                : "Ajouter l'exception"
          }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
