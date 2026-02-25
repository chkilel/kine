<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  const props = defineProps<{
    therapists: User[]
    treatmentPlan: TreatmentPlan
  }>()

  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  const planningSettings = ref({
    sessionsToPlan: props.treatmentPlan.numberOfSessions || 1,
    frequency: 2,
    duration: 45,
    startDate: new Date(),
    preferredDays: [] as string[],
    location: 'clinic',
    therapistId: props.treatmentPlan.therapistId,
    type: 'follow_up'
  })
  const minDate = computed(() => convertToCalendarDate(new Date()))
  // Computed property for calendar date model
  const planningStartDateModel = computed<CalendarDate | null>({
    get: () => {
      return planningSettings.value.startDate ? convertToCalendarDate(new Date(planningSettings.value.startDate)) : null
    },
    set: (val) => {
      if (val) {
        planningSettings.value.startDate = val.toDate(getLocalTimeZone())
      }
    }
  })

  const handleGenerate = () => {
    // TODO
    console.log('🚀 >>> ', 'Generate consultaion handler')
  }
</script>

<template>
  <AppCard title="Paramètres de planification automatique">
    <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
      <UFormField label="Kinésithérapeute responsable" name="therapistId">
        <USelectMenu
          v-model="planningSettings.therapistId"
          :items="therapists"
          value-key="id"
          label-key="name"
          placeholder="Sélectionner un kinésithérapeute"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Lieu" class="">
        <UFieldGroup class="flex">
          <UButton
            v-for="loc in LOCATION_OPTIONS"
            :key="loc.value"
            :variant="planningSettings.location === loc.value ? 'solid' : 'subtle'"
            :color="planningSettings.location === loc.value ? 'primary' : 'neutral'"
            :icon="loc.icon"
            class="flex-1 justify-center"
            @click="planningSettings.location = loc.value"
          >
            {{ loc.label }}
          </UButton>
        </UFieldGroup>
      </UFormField>

      <!-- Session Type -->
      <UFormField label="Type de séance">
        <USelect
          v-model="planningSettings.type"
          :items="APPOINTMENT_TYPES_OPTIONS"
          option-attribute="label"
          value-attribute="value"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="`Durée: ${planningSettings.duration} minutes`">
        <div class="space-y-2">
          <USlider size="lg" v-model="planningSettings.duration" :min="15" :max="90" :step="15" />
          <div class="flex justify-between text-xs">
            <span v-for="val in [15, 30, 45, 60, 75, 90]" :key="val">{{ val }}</span>
          </div>
        </div>
      </UFormField>

      <div class="grid gap-6 sm:col-span-2 sm:grid-cols-3">
        <UFormField label="Séances à planifier">
          <UInputNumber
            v-model="planningSettings.sessionsToPlan"
            :min="1"
            :max="treatmentPlan?.numberOfSessions || 20"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Fréquence par semaine">
          <USelect v-model="planningSettings.frequency" :items="FREQUENCY_OPTIONS" class="w-full" />
        </UFormField>

        <UFormField label="Date de début">
          <UPopover>
            <UButton color="neutral" variant="subtle" class="w-full justify-start">
              {{
                planningStartDateModel
                  ? df.format(planningStartDateModel.toDate(getLocalTimeZone()))
                  : 'Sélectionner une date'
              }}
            </UButton>
            <template #content>
              <UCalendar
                v-model="planningStartDateModel"
                :is-date-unavailable="isDateDisabled"
                :min-value="minDate"
                :year-controls="false"
                class="p-2"
              />
            </template>
          </UPopover>
        </UFormField>
      </div>

      <UFormField label="Jours préférés" class="col-span-full">
        <UCheckboxGroup
          v-model="planningSettings.preferredDays"
          :items="PREFERRED_DAYS_OPTIONS"
          orientation="horizontal"
          variant="card"
          :ui="{ item: 'flex-1 p-2 justify-center' }"
        />
      </UFormField>
    </div>

    <UAlert
      v-if="treatmentPlan?.numberOfSessions && treatmentPlan.numberOfSessions < planningSettings.sessionsToPlan"
      title="Limite du plan de traitement"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      class="mt-4"
    >
      <template #description>
        Vous prévoyez {{ planningSettings.sessionsToPlan }} séances, mais le plan prévoit
        {{ treatmentPlan.numberOfSessions }} séances au total. Assurez-vous que cela correspond aux besoins du patient.
      </template>
    </UAlert>

    <div class="mt-6 flex justify-end">
      <UButton icon="i-lucide-sparkles" color="primary" size="lg" @click="handleGenerate">Générer les séances</UButton>
    </div>
  </AppCard>
</template>
