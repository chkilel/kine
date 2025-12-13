<script setup lang="ts">
  import { Time } from '@internationalized/date'

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
  const startTimeModel = computed(() => (state.startTime ? parseTimeString(state.startTime) : new Time(9, 0)))
  const endTimeModel = computed(() => (state.endTime ? parseTimeString(state.endTime) : new Time(12, 0)))

  // Helper function to parse time string to Time object
  function parseTimeString(timeString: string): Time {
    const [hours, minutes] = timeString.split(':').map(Number)
    return new Time(hours, minutes, 0)
  }

  // Day options
  const dayOptions = [
    { label: 'Lundi', value: 'Mon' },
    { label: 'Mardi', value: 'Tue' },
    { label: 'Mercredi', value: 'Wed' },
    { label: 'Jeudi', value: 'Thu' },
    { label: 'Vendredi', value: 'Fri' },
    { label: 'Samedi', value: 'Sat' }
  ]

  // Location options
  const locationOptions = [
    { label: 'Clinique', value: 'clinic' },
    { label: 'Domicile', value: 'home' },
    { label: 'Téléconsultation', value: 'telehealth' }
  ]

  // Form validation
  const isFormValid = computed(() => {
    try {
      weeklyAvailabilityTemplateCreateSchema.parse(state)
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
    :open="true"
    :dismissible="false"
    @close="onCancel"
    :title="template ? 'Modifier le modèle de disponibilité' : 'Ajouter un modèle de disponibilité'"
    :description="template ? 'Modifier les horaires récurrents' : 'Créer des horaires récurrents pour la semaine'"
    :ui="{
      content: 'w-full md:w-1/2 lg:w-1/3 max-w-lg bg-elevated'
    }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="weeklyAvailabilityTemplateCreateSchema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Timing Section -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Horaires</h3>
          <div class="grid grid-cols-1 gap-4">
            <UFormField label="Jour de la semaine" name="dayOfWeek">
              <USelect
                v-model="state.dayOfWeek"
                :items="dayOptions"
                placeholder="Sélectionner un jour"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Heure de début" name="startTime">
                <UInputTime v-model="startTimeModel" class="w-full" />
              </UFormField>
              <UFormField label="Heure de fin" name="endTime">
                <UInputTime v-model="endTimeModel" class="w-full" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Location & Capacity Section -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Lieu & Capacité</h3>
          <div class="grid grid-cols-1 gap-4">
            <UFormField label="Lieu de consultation" name="location">
              <USelect
                v-model="state.location"
                :items="locationOptions"
                placeholder="Sélectionner un lieu"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Nombre maximum de patients simultanés" name="maxSessions">
              <UInputNumber v-model="state.maxSessions" :min="1" :max="10" placeholder="4" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Options Section -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Options</h3>
          <div class="space-y-4">
            <UFormField name="recurrence">
              <div class="flex items-center gap-3">
                <USwitch :model-value="true" disabled />
                <span class="text-muted text-sm">Récurrent chaque semaine</span>
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
          class="h-9 px-3 text-sm font-semibold"
          type="submit"
          @click="onSubmit"
          :disabled="!isFormValid"
        >
          {{ template ? 'Mettre à jour' : 'Ajouter' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
