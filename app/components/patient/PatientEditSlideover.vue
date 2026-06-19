<script setup lang="ts">
  import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
  import { SEX_OPTIONS } from '~~/shared/utils/constants.patient'
  import { INSURER_OPTIONS, isInsurerSlug } from '~~/shared/utils/constants.insurers'

  // --- Props & Emits ---
  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  // --- Types ---
  interface PatientFormState extends PatientUpdate {
    insurerSelectionType: 'catalog' | 'custom'
    customInsurerName?: string
  }

  // --- Constants ---
  const DATE_FORMATTER = new DateFormatter('fr-FR', { dateStyle: 'medium' })
  const INSURER_DROPDOWN_OPTIONS = [
    ...INSURER_OPTIONS.map((opt) => ({ label: opt.label, value: opt.slug })),
    { label: 'Autre', value: 'other' }
  ]

  // --- Helpers ---
  function deepCloneArray<T>(arr: T[] | null): T[] {
    return arr ? JSON.parse(JSON.stringify(arr)) : []
  }

  function buildInitialFormState(patient: Patient): PatientFormState {
    const currentInsurer = patient.insuranceProvider || ''
    const isCatalogInsurer = currentInsurer && isInsurerSlug(currentInsurer)
    return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      phone: patient.phone,
      email: patient.email ?? undefined,
      address: patient.address ?? '',
      city: patient.city ?? '',
      postalCode: patient.postalCode || undefined,
      referralSource: patient.referralSource || undefined,
      insuranceProvider: isCatalogInsurer ? currentInsurer : undefined,
      customInsurerName: isCatalogInsurer ? undefined : currentInsurer || undefined,
      insurerSelectionType: isCatalogInsurer ? 'catalog' : currentInsurer ? 'custom' : 'catalog',
      emergencyContacts: deepCloneArray(patient.emergencyContacts)
    }
  }

  // --- Composables ---
  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  // --- State ---
  const formRef = ref<HTMLFormElement>()
  const formState = reactive<PatientFormState>(buildInitialFormState(props.patient))

  // --- Computed ---
  const dobModel = computed({
    get: () => (formState.dateOfBirth ? parseDate(formState.dateOfBirth) : null),
    set: (val) => {
      formState.dateOfBirth = val?.toString()
    }
  })

  const dobLabel = computed(() =>
    dobModel.value ? DATE_FORMATTER.format(dobModel.value.toDate(getLocalTimeZone())) : 'Sélectionner une date'
  )

  const selectedInsurerSlug = computed({
    get: () => (formState.insurerSelectionType === 'catalog' ? formState.insuranceProvider : 'other'),
    set: (val) => {
      if (val === 'other') {
        formState.insurerSelectionType = 'custom'
        formState.insuranceProvider = formState.customInsurerName || undefined
      } else {
        formState.insurerSelectionType = 'catalog'
        formState.insuranceProvider = val
      }
    }
  })

  // --- Handlers ---
  async function onSubmit() {
    const isValid = await formRef.value?.validate()
    if (!isValid) return

    const { insurerSelectionType, customInsurerName, ...submitData } = formState
    const finalInsuranceProvider = insurerSelectionType === 'custom' ? customInsurerName : formState.insuranceProvider

    updatePatient({
      patientId: props.patient.id,
      patientData: { ...submitData, insuranceProvider: finalInsuranceProvider },
      onSuccess: () => emit('close')
    })
  }
</script>

<template>
  <USlideover
    title="Modifier le patient"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{ content: 'w-full lg:w-2/3 max-w-2xl bg-elevated' }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientUpdateSchema" :state="formState" class="space-y-6">
        <AppCard title="Informations de base" variant="outline">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Prénom" name="firstName">
              <UInput v-model="formState.firstName" placeholder="Yahya" class="w-full" />
            </UFormField>

            <UFormField label="Nom" name="lastName">
              <UInput v-model="formState.lastName" placeholder="Doe" class="w-full" />
            </UFormField>

            <UFormField label="E‑mail" name="email" class="col-span-2">
              <UInput v-model="formState.email" type="email" placeholder="yahya.doe@example.com" class="w-full" />
            </UFormField>

            <UFormField label="Téléphone" name="phone" class="col-span-2">
              <UInput v-model="formState.phone" type="tel" placeholder="+1 (555) 123-4567" class="w-full" />
            </UFormField>

            <UFormField label="Date de naissance" name="dateOfBirth">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                  {{ dobLabel }}
                </UButton>
                <template #content>
                  <UCalendar v-model="dobModel" class="p-2" />
                </template>
              </UPopover>
            </UFormField>

            <UFormField label="Sexe" name="sex">
              <USelect v-model="formState.sex" :items="SEX_OPTIONS" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <AppCard title="Adresse">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Adresse" name="address" class="md:col-span-2">
              <UInput v-model="formState.address" placeholder="123 rue Principale" class="w-full" />
            </UFormField>

            <UFormField label="Ville" name="city">
              <UInput v-model="formState.city" placeholder="Paris" class="w-full" />
            </UFormField>

            <UFormField label="Code postal" name="postalCode">
              <UInput v-model="formState.postalCode" placeholder="10001" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <AppCard title="Recommandation et couverture">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Source de recommandation" name="referralSource">
              <UInput v-model="formState.referralSource" placeholder="Dr. Martin" class="w-full" />
            </UFormField>

            <UFormField label="Assureur" name="insuranceProvider">
              <USelect v-model="selectedInsurerSlug" :items="INSURER_DROPDOWN_OPTIONS" class="w-full" />
            </UFormField>

            <UFormField
              v-if="formState.insurerSelectionType === 'custom'"
              label="Nom de l'assureur"
              name="customInsurerName"
              class="md:col-span-2"
            >
              <UInput
                v-model="formState.customInsurerName"
                placeholder="Nom de l'assureur personnalisé"
                class="w-full"
              />
            </UFormField>
          </div>
        </AppCard>

        <PatientEmergencyContacts v-model="formState.emergencyContacts" />
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton label="Annuler" variant="outline" color="neutral" @click="close" />
      <UButton label="Mettre à jour" :loading="isLoading" :disabled="isLoading" @click="onSubmit" />
    </template>
  </USlideover>
</template>
