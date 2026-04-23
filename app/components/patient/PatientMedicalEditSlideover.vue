<script setup lang="ts">
  import type { Form } from '@nuxt/ui'

  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  const formRef = useTemplateRef<Form<PatientUpdate>>('formRef')

  function getInitialFormState() {
    return {
      medicalConditions: props.patient.medicalConditions,
      surgeries: props.patient.surgeries,
      allergies: props.patient.allergies,
      medications: props.patient.medications
    }
  }

  const formState = reactive(getInitialFormState())

  async function onSubmit() {
    updatePatient({ patientId: props.patient.id, patientData: formState, onSuccess: () => emit('close') })
  }
</script>

<template>
  <USlideover
    title="Modifier les informations médicales"
    :description="`Modifier les informations médicales de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full lg:w-1/3 max-w-xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientUpdateSchema" :state="formState" @submit="onSubmit" class="space-y-6">
        <!-- Medical Information -->
        <AppCard title="Informations Médicales">
          <div class="space-y-10">
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

    <template #footer="{ close }">
      <UButton label="Annuler" variant="outline" color="neutral" @click="close" />

      <UButton
        label="Mettre à jour"
        color="primary"
        type="submit"
        @click="formRef?.submit()"
        :loading="isLoading"
        :disabled="isLoading"
      />
    </template>
  </USlideover>
</template>
