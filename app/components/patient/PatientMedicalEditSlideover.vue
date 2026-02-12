<script setup lang="ts">
  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  const formRef = ref<HTMLFormElement>()

  function getInitialFormState() {
    return {
      medicalConditions: props.patient.medicalConditions ?? [],
      surgeries: props.patient.surgeries ?? [],
      allergies: props.patient.allergies ?? [],
      medications: props.patient.medications ?? []
    }
  }

  const formState = reactive(getInitialFormState())

  async function onSubmit() {
    if (!formRef.value) return

    const validationResult = await formRef.value.validate()
    if (!validationResult) return

    updatePatient({ patientId: props.patient.id, patientData: formState, onSuccess: () => emit('close') })
  }

  function handleClose() {
    emit('close')
  }

  function onSlideoverOpened() {
    Object.assign(formState, getInitialFormState())
  }
</script>

<template>
  <USlideover
    :open="true"
    :dismissible="false"
    @close="emit('close')"
    @after:enter="onSlideoverOpened"
    title="Modifier les informations médicales"
    :description="`Modifier les informations médicales de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-1/2 max-w-2xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientUpdateSchema" :state="formState" class="space-y-6">
        <!-- Medical Information -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations Médicales</h3>
          <div class="space-y-4">
            <PatientMedicalInfoInput
              v-model="formState.medicalConditions"
              label="Antécédents médicaux"
              name="medicalConditions"
              placeholder="Ajouter une condition... ex : diabète de type 2, asthme"
              badge-color="neutral"
            />

            <PatientMedicalInfoInput
              v-model="formState.surgeries"
              label="Chirurgies / Interventions"
              name="surgeries"
              placeholder="Décrire l'intervention... ex : opération du genou (2020)"
              badge-color="primary"
            />

            <PatientMedicalInfoInput
              v-model="formState.allergies"
              label="Allergies"
              name="allergies"
              placeholder="Ajouter une allergie... ex : pénicilline, latex, pollen"
              badge-color="error"
            />

            <PatientMedicalInfoInput
              v-model="formState.medications"
              label="Médicaments actuels"
              name="medications"
              placeholder="Indiquer le médicament... ex : Paracétamol 500 mg, Lévothyroxine"
              badge-color="info"
            />
          </div>
        </AppCard>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="handleClose">
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="h-9 px-3 text-sm font-semibold"
          type="submit"
          @click="onSubmit"
          :loading="isLoading"
          :disabled="isLoading"
        >
          Mettre à jour
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
