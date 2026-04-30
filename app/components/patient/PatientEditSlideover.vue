<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'

  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  const formRef = ref<HTMLFormElement>()

  function getInitialFormState(): PatientBasicInfoUpdate {
    return {
      firstName: props.patient.firstName,
      lastName: props.patient.lastName,
      dateOfBirth: props.patient.dateOfBirth,
      gender: props.patient.gender,
      phone: props.patient.phone,
      status: props.patient.status,
      email: props.patient.email ?? undefined
    }
  }

  const formState = reactive<PatientBasicInfoUpdate>(getInitialFormState())

  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })
  const dobModel = computed({
    get: () => (formState.dateOfBirth ? parseDate(formState.dateOfBirth) : null),
    set: (val) => {
      formState.dateOfBirth = val ? val.toString() : undefined
    }
  })

  async function onSubmit() {
    if (!formRef.value) return

    const validationResult = await formRef.value.validate()
    if (!validationResult) return

    updatePatient({
      patientId: props.patient.id,
      patientData: formState as PatientUpdate,
      onSuccess: () => emit('close')
    })
  }
</script>

<template>
  <USlideover
    title="Modifier le patient"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{ content: 'w-full lg:w-1/3 max-w-2xl bg-elevated' }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientBasicInfoUpdateSchema" :state="formState" class="space-y-6">
        <!-- Basic Information -->
        <AppCard title="Informations de base" variant="outline">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Prénom" placeholder="Jean" name="firstName">
              <UInput v-model="formState.firstName" class="w-full" />
            </UFormField>
            <UFormField label="Nom" placeholder="Dupont" name="lastName">
              <UInput v-model="formState.lastName" class="w-full" />
            </UFormField>
            <UFormField label="E‑mail" placeholder="john.doe@example.com" name="email" class="col-span-2">
              <UInput v-model="formState.email" class="w-full" type="email" />
            </UFormField>
            <UFormField label="Téléphone" placeholder="+1 (555) 123-4567" name="phone" class="col-span-2">
              <UInput v-model="formState.phone" class="w-full" type="tel" />
            </UFormField>
            <UFormField label="Date de naissance" name="dateOfBirth">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                  {{ dobModel ? df.format(dobModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                </UButton>
                <template #content>
                  <UCalendar v-model="dobModel" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
            <UFormField label="Sexe" name="gender">
              <USelect
                v-model="formState.gender"
                class="w-full"
                :items="[
                  { label: 'Homme', value: 'male' },
                  { label: 'Femme', value: 'female' }
                ]"
              />
            </UFormField>
            <UFormField label="Statut" name="status" class="md:col-span-2">
              <URadioGroup
                size="sm"
                orientation="horizontal"
                variant="table"
                v-model="formState.status"
                :items="PATIENT_STATUS_OPTIONS"
              />
            </UFormField>
          </div>
        </AppCard>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton label="Annuler" variant="outline" color="neutral" @click="close" />
      <UButton label="Mettre à jour" type="submit" @click="onSubmit" :loading="isLoading" :disabled="isLoading" />
    </template>
  </USlideover>
</template>
