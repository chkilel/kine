<script setup lang="ts">
  import { CalendarDate, Time, getLocalTimeZone } from '@internationalized/date'

  const props = defineProps<{ availabilityException?: AvailabilityException }>()
  const emit = defineEmits<{ close: [] }>()

  const toast = useToast()
  const formRef = ref<HTMLFormElement>()

  // Form state
  const state = reactive<AvailabilityExceptionCreate>({
    date: props.availabilityException?.date || new Date(),
    startTime: props.availabilityException?.startTime || undefined,
    endTime: props.availabilityException?.endTime || undefined,
    isAvailable: props.availabilityException?.isAvailable ?? false,
    reason: props.availabilityException?.reason || undefined
  })

  // Time values for UI components
  const startTimeModel = computed<Time | undefined>({
    get: () => {
      if (!state.startTime) return undefined
      const [hours, minutes] = state.startTime.split(':').map(Number)
      return new Time(hours, minutes, 0)
    },
    set: (value: Time | undefined) => {
      state.startTime = value
        ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
        : undefined
    }
  })

  const endTimeModel = computed<Time | undefined>({
    get: () => {
      if (!state.endTime) return undefined
      const [hours, minutes] = state.endTime.split(':').map(Number)
      return new Time(hours, minutes)
    },
    set: (value: Time | undefined) => {
      state.endTime = value
        ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
        : undefined
    }
  })

  // Full day toggle
  const isFullDay = computed({
    get: () => !state.startTime && !state.endTime,
    set: (value: boolean) => {
      if (value) {
        state.startTime = undefined
        state.endTime = undefined
      } else {
        state.startTime = '09:00'
        state.endTime = '17:00' // 5pm is more typical for end time
      }
    }
  })

  // Calendar model for date picker
  const dateModel = computed<CalendarDate | null>({
    get: () => {
      if (!state.date) return null
      const date = new Date(state.date)
      return dateToCalendarDate(date)
    },
    set: (val) => {
      state.date = val ? val.toDate(getLocalTimeZone()) : new Date()
    }
  })

  // Reason selection state
  const selectedReason = computed({
    get: () => state.reason,
    set: (value: string) => {
      state.reason = value === 'other' ? 'other' : value
    }
  })

  const isOtherReason = computed(() => selectedReason.value === 'other')
  const otherReasonText = ref('')

  // Form validation
  const isFormValid = computed(() => {
    try {
      availabilityExceptionCreateSchema.parse(state)
      return true
    } catch {
      return false
    }
  })

  async function onSubmit() {
    if (!formRef.value) return

    const validationResult = await formRef.value.validate()
    if (!validationResult) return

    toast.add({
      title: 'Succès',
      description: props.availabilityException ? 'Exception mise à jour' : 'Exception ajoutée',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    emit('close')
  }

  function onCancel() {
    emit('close')
  }

  function selectReason(reason: string) {
    selectedReason.value = reason
    if (reason !== 'other') {
      otherReasonText.value = ''
    }
  }

  const buttonText = computed(() => {
    return props.availabilityException ? 'Mettre à jour' : "Ajouter l'exception"
  })
</script>

<template>
  <USlideover
    :open="true"
    :dismissible="false"
    @close="onCancel"
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
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Date Section -->
        <UCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-calendar" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Date</h3>
          </div>
          <UFormField name="date">
            <UCalendar v-model="dateModel" size="lg" class="w-full" :ui="{ header: 'capitalize text-lg' }" />
          </UFormField>
        </UCard>

        <!-- Timing Section -->
        <UCard variant="outline">
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
        </UCard>

        <!-- Availability Section -->
        <UCard variant="outline">
          <div class="border-default mb-6 flex items-center gap-3 border-b pb-2">
            <UIcon name="i-lucide-toggle-left" class="text-primary" />
            <h3 class="text-foreground text-base font-bold">Disponibilité</h3>
          </div>
          <div class="space-y-4">
            <UFormField name="isAvailable">
              <USwitch
                v-model="state.isAvailable"
                description="Le thérapeute est-il disponible sur ce créneau ?"
                class="flex-row-reverse justify-between"
              >
                <template #label>
                  <span class="text-foreground text-sm font-semibold">
                    {{ state.isAvailable ? 'Disponible' : 'Indisponible' }}
                  </span>
                </template>
              </USwitch>
            </UFormField>

            <UFormField v-if="!state.isAvailable" label="Motif de l'absence" name="reason">
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="reason in EXCEPTION_TYPE_OPTIONS"
                    :key="reason.value"
                    :variant="selectedReason === reason.value ? 'solid' : 'outline'"
                    :color="selectedReason === reason.value ? 'primary' : 'neutral'"
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
        </UCard>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="onCancel">
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="shadow-primary/25 h-9 px-3 text-sm font-semibold shadow-lg"
          type="submit"
          @click="onSubmit"
          :disabled="!isFormValid"
        >
          <UIcon name="i-lucide-check" class="text-lg" />
          {{ buttonText }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
