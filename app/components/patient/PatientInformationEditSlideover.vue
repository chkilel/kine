<script setup lang="ts">
  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  const formRef = ref<HTMLFormElement>()

  function deepCloneArray<T>(arr: T[] | null): T[] {
    if (!arr) return []
    return JSON.parse(JSON.stringify(arr))
  }

  function getInitialFormState(): PatientUpdate {
    return {
      address: props.patient.address || undefined,
      city: props.patient.city || undefined,
      postalCode: props.patient.postalCode || undefined,
      referralSource: props.patient.referralSource || undefined,
      insuranceProvider: props.patient.insuranceProvider || undefined,
      emergencyContacts: deepCloneArray(props.patient.emergencyContacts)
    }
  }

  const formState = reactive<PatientUpdate>(getInitialFormState())

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
    title="Modifier les informations"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-1/2 max-w-2xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientUpdateSchema" :state="formState" class="space-y-6">
        <!-- Address Information -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Adresse</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Adresse" placeholder="123 rue Principale" name="address" class="md:col-span-2">
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
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Recommandation et couverture</h3>

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
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Contact d'urgence</h3>
          <PatientEmergencyContacts v-model="formState.emergencyContacts" />
        </AppCard>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="" @click="handleClose">Annuler</UButton>
        <UButton color="primary" class="" type="submit" @click="onSubmit" :loading="isLoading" :disabled="isLoading">
          Mettre à jour
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
