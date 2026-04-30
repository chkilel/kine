<script setup lang="ts">
  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  const formRef = ref<HTMLFormElement>()

  function deepCloneArray<T>(arr: T[] | null): T[] {
    if (!arr) return []
    return JSON.parse(JSON.stringify(arr))
  }

  function getInitialFormState(): PatientInformationUpdate {
    return {
      address: props.patient.address ?? '',
      city: props.patient.city ?? '',
      postalCode: props.patient.postalCode || undefined,
      referralSource: props.patient.referralSource || undefined,
      insuranceProvider: props.patient.insuranceProvider || undefined,
      emergencyContacts: deepCloneArray(props.patient.emergencyContacts)
    }
  }

  const formState = reactive<PatientInformationUpdate>(getInitialFormState())

  async function onSubmit() {
    if (!formRef.value) return

    const validationResult = await formRef.value.validate()
    if (!validationResult) return

    updatePatient({
      patientId: props.patient.id,
      patientData: formState,
      onSuccess: () => emit('close')
    })
  }
</script>

<template>
  <USlideover
    title="Modifier les informations"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full lg:w-1/3 max-w-2xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientInformationUpdateSchema" :state="formState" class="space-y-6">
        <!-- Address Information -->
        <AppCard title="Adresse">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField placeholder="123 rue Principale" name="address" class="md:col-span-2">
              <UInput v-model="formState.address" class="w-full" />
            </UFormField>
            <UFormField label="Ville" placeholder="Paris" name="city">
              <UInput v-model="formState.city" class="w-full" />
            </UFormField>
            <UFormField label="Code postal" placeholder="10001" name="postalCode">
              <UInput v-model="formState.postalCode" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <!-- Referral and Insurance Information -->
        <AppCard title="Recommandation et couverture">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Source de recommandation" placeholder="Dr. Martin" name="referralSource">
              <UInput v-model="formState.referralSource" class="w-full" />
            </UFormField>
            <UFormField label="Assureur" placeholder="Assurance" name="insuranceProvider">
              <UInput v-model="formState.insuranceProvider" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <!-- Emergency Contact -->
        <PatientEmergencyContacts v-model="formState.emergencyContacts" />
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton variant="outline" color="neutral" class="" @click="close">Annuler</UButton>
      <UButton color="primary" class="" type="submit" @click="onSubmit" :loading="isLoading" :disabled="isLoading">
        Mettre à jour
      </UButton>
    </template>
  </USlideover>
</template>
