<script setup lang="ts">
  import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

  const props = defineProps<{ exception?: AvailabilityException }>()
  const emit = defineEmits<{ close: [] }>()

  const toast = useToast()
  const formRef = ref<HTMLFormElement>()

  // Form state
  const state = reactive<AvailabilityExceptionCreate>({
    date: props.exception?.date || new Date().toISOString().split('T')[0],
    startTime: props.exception?.startTime || undefined,
    endTime: props.exception?.endTime || undefined,
    isAvailable: props.exception?.isAvailable ?? false,
    reason: props.exception?.reason || undefined
  })

  // Time values for UI components
  const startTimeModel = computed(() => state.startTime)
  const endTimeModel = computed(() => state.endTime)

  // Full day toggle
  const isFullDay = computed({
    get: () => !state.startTime && !state.endTime,
    set: (value: boolean) => {
      if (value) {
        state.startTime = undefined
        state.endTime = undefined
      } else {
        state.startTime = '09:00'
        state.endTime = '12:00'
      }
    }
  })

  // Calendar model for date picker
  const dateModel = computed<CalendarDate | null>({
    get: () => {
      if (!state.date) return null
      const date = new Date(state.date)
      return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    },
    set: (val) => {
      state.date = val
        ? val.toDate(getLocalTimeZone()).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    }
  })

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
      description: props.exception ? 'Exception mise à jour' : 'Exception ajoutée',
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
    :open="true"
    :dismissible="false"
    @close="onCancel"
    :title="exception ? 'Modifier l\'exception' : 'Ajouter une exception'"
    :description="
      exception ? 'Modifier les disponibilités exceptionnelles' : 'Gérer les absences ou changements ponctuels'
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
          <h3 class="text-highlighted mb-4 text-base font-bold">Date</h3>
          <UFormField label="Date de l'exception" name="date">
            <UPopover>
              <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                {{
                  dateModel ? dateModel.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR') : 'Sélectionner une date'
                }}
              </UButton>
              <template #content>
                <UCalendar v-model="dateModel" class="p-2" />
              </template>
            </UPopover>
          </UFormField>
        </UCard>

        <!-- Timing Section -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Horaires</h3>
          <div class="space-y-4">
            <UFormField name="fullDay">
              <div class="flex items-center gap-3">
                <USwitch v-model="isFullDay" />
                <span class="text-muted text-sm">Journée complète</span>
              </div>
            </UFormField>

            <div v-if="!isFullDay" class="grid grid-cols-2 gap-4">
              <UFormField label="Heure de début" name="startTime">
                <UInputTime v-model="startTimeModel" class="w-full" />
              </UFormField>
              <UFormField label="Heure de fin" name="endTime">
                <UInputTime v-model="endTimeModel" class="w-full" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Availability Section -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Disponibilité</h3>
          <div class="space-y-4">
            <UFormField name="isAvailable">
              <div class="flex items-center gap-3">
                <USwitch v-model="state.isAvailable" />
                <span class="text-muted text-sm">
                  {{ state.isAvailable ? 'Disponible' : 'Indisponible' }}
                </span>
              </div>
            </UFormField>

            <UFormField v-if="!state.isAvailable" label="Motif de l'absence" name="reason">
              <USelect
                v-model="state.reason"
                :items="EXCEPTION_TYPE_OPTIONS"
                placeholder="Sélectionner un motif"
                class="w-full"
              />
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
          class="h-9 px-3 text-sm font-semibold"
          type="submit"
          @click="onSubmit"
          :disabled="!isFormValid"
        >
          {{ exception ? 'Mettre à jour' : 'Ajouter' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
