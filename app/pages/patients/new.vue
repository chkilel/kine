<script setup lang="ts">
  import type { BreadcrumbItem, Form, FormError, FormErrorEvent, FormSubmitEvent, StepperItem } from '@nuxt/ui'
  import { format } from 'date-fns'
  import { fr } from 'date-fns/locale'
  import { getLocalTimeZone, parseDate } from '@internationalized/date'

  import { SEX_OPTIONS } from '~~/shared/utils/constants.patient'
  import { INSURER_OPTIONS, isInsurerSlug } from '~~/shared/utils/constants.insurers'

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: 'Nouvelle fiche patient' }
  ] as BreadcrumbItem[]

  const { activeOrganization } = useOrganization()
  const { mutate: createPatient, isLoading } = useCreatePatient()
  const { user } = await useAuth()

  const generalNote = ref('')

  const INSURER_DROPDOWN_OPTIONS = [
    ...INSURER_OPTIONS.map((opt) => ({ label: opt.label, value: opt.slug })),
    { label: 'Autre', value: 'other' }
  ]

  interface PatientFormState extends PatientCreate {
    insurerSelectionType: 'catalog' | 'custom'
    customInsurerName?: string
  }

  interface StepperExpose {
    next: () => void
    prev: () => void
    hasNext: Ref<boolean>
    hasPrev: Ref<boolean>
  }

  const formRef = useTemplateRef<Form<PatientFormState>>('createPatientForm')
  const stepperRef = useTemplateRef<StepperExpose>('stepper')
  const formWrapperRef = useTemplateRef<HTMLDivElement>('formWrapper')
  const stepIndex = ref(0)

  const formState = reactive<PatientFormState>({
    organizationId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'male',
    phone: '',
    medicalConditions: [],
    surgeries: [],
    allergies: [],
    medications: [],
    emergencyContacts: [],
    notes: [],
    insurerSelectionType: 'catalog',
    customInsurerName: undefined
  })

  const steps = [
    {
      slot: 'identity' as const,
      title: 'Identité',
      description: 'État civil du patient',
      icon: 'i-hugeicons-user'
    },
    {
      slot: 'contact' as const,
      title: 'Coordonnées',
      description: 'Contact & urgence',
      icon: 'i-hugeicons-map-pin'
    },
    {
      slot: 'medical' as const,
      title: 'Médical',
      description: 'Antécédents & allergies',
      icon: 'i-hugeicons-stethoscope'
    },
    {
      slot: 'insurance' as const,
      title: 'Assurance',
      description: 'Mutuelle & notes',
      icon: 'i-hugeicons-shield-user'
    }
  ] satisfies StepperItem[]

  const isLastStep = computed(() => stepIndex.value === steps.length - 1)

  const stepSchemas = [
    patientCreateSchema.pick({ firstName: true, lastName: true, dateOfBirth: true, sex: true }),
    patientCreateSchema.pick({
      phone: true,
      email: true,
      address: true,
      city: true,
      postalCode: true,
      country: true
    }),
    null,
    null
  ] as const

  // Computed property for calendar date model
  const dobModel = computed({
    get: () => (formState.dateOfBirth ? parseDate(formState.dateOfBirth) : null),
    set: (val) => {
      if (val) formState.dateOfBirth = val.toString()
    }
  })

  const selectedInsurerSlug = computed({
    get: () => (formState.insurerSelectionType === 'catalog' ? formState.insuranceProvider : 'other'),
    set: (val) => {
      if (val === 'other') {
        formState.insurerSelectionType = 'custom'
        formState.insuranceProvider = formState.customInsurerName
      } else {
        formState.insurerSelectionType = 'catalog'
        formState.insuranceProvider = val
      }
    }
  })

  watchEffect(() => {
    if (activeOrganization.value.data?.id) {
      formState.organizationId = activeOrganization.value.data.id
    }
  })

  function validateCurrentStep(): FormError[] | null {
    const schema = stepSchemas[stepIndex.value]
    if (!schema) return []

    const result = schema.safeParse(formState)
    if (result.success) return []

    return result.error.issues.map((issue) => ({
      name: issue.path.join('.'),
      message: issue.message
    }))
  }

  function handleNext() {
    const errors = validateCurrentStep()
    if (errors && errors.length > 0) {
      formRef.value?.setErrors(errors)
      return
    }

    formRef.value?.clear()
    stepperRef.value?.next()
    stepIndex.value++
  }

  function handlePrev() {
    formRef.value?.clear()
    stepperRef.value?.prev()
    stepIndex.value--
  }

  async function onSubmit(_event: FormSubmitEvent<PatientCreate>) {
    if (!formState.organizationId) {
      console.error('Organization ID is missing')
      return
    }

    const { insurerSelectionType, customInsurerName, ...submitData } = formState
    const finalInsuranceProvider = insurerSelectionType === 'custom' ? customInsurerName : formState.insuranceProvider

    const preparedData = {
      ...submitData,
      insuranceProvider: finalInsuranceProvider,
      medicalConditions: formState.medicalConditions?.filter((item) => item !== '') || [],
      surgeries: formState.surgeries?.filter((item) => item !== '') || [],
      allergies: formState.allergies?.filter((item) => item !== '') || [],
      medications: formState.medications?.filter((item) => item !== '') || [],
      emergencyContacts: formState.emergencyContacts?.filter((contact) => contact.number.trim() !== '') || [],
      notes:
        generalNote.value.trim() && user.value
          ? [
              {
                content: generalNote.value.trim(),
                date: new Date(),
                author: formatFullName(user.value)
              }
            ]
          : []
    }

    createPatient(preparedData)
  }

  async function onError(_event: FormErrorEvent) {
    nextTick(() => formWrapperRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
</script>

<template>
  <AppDashboardPage id="new-patient" title="Nouveau patient" :breadcrumbs="breadcrumbItems">
    <header class="mb-2">
      <h1 class="text-highlighted text-lg leading-tight font-bold md:text-xl">Créer une fiche patient</h1>
      <p class="text-muted mt-1 text-sm">Renseignez la fiche patient en quelques étapes.</p>
    </header>

    <UPageCard variant="outline" class="mx-auto w-full max-w-5xl">
      <div ref="formWrapper">
        <UForm
          ref="createPatientForm"
          :schema="patientCreateSchema"
          :state="formState"
          class="space-y-0"
          @submit="onSubmit"
          @error="onError"
        >
          <UStepper ref="stepper" :items="steps" :disabled="true" class="w-full">
            <!-- Step 1: Identité -->
            <template #identity>
              <div class="space-y-5 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Identité du patient</h2>
                  <p class="text-muted text-sm">Informations essentielles d'état civil.</p>
                </div>

                <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <UFormField label="Prénom" name="firstName" required>
                    <UInput v-model="formState.firstName" placeholder="ex : Jean" class="w-full" />
                  </UFormField>
                  <UFormField label="Nom" name="lastName" required>
                    <UInput v-model="formState.lastName" placeholder="ex : Dupont" class="w-full" />
                  </UFormField>
                  <UFormField label="Date de naissance" name="dateOfBirth" required>
                    <UPopover>
                      <UButton
                        color="neutral"
                        variant="subtle"
                        icon="i-hugeicons-calendar-03"
                        class="w-full justify-start"
                      >
                        {{
                          dobModel
                            ? format(dobModel.toDate(getLocalTimeZone()), 'dd MMM yyyy', { locale: fr })
                            : 'Sélectionner une date'
                        }}
                      </UButton>
                      <template #content>
                        <UCalendar v-model="dobModel" class="p-2" />
                      </template>
                    </UPopover>
                  </UFormField>
                  <UFormField label="Sexe" name="sex" required>
                    <USelect
                      v-model="formState.sex"
                      placeholder="Sélectionner..."
                      class="w-full"
                      :items="SEX_OPTIONS"
                    />
                  </UFormField>
                </div>
              </div>
            </template>

            <!-- Step 2: Coordonnées -->
            <template #contact>
              <div class="space-y-6 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Coordonnées</h2>
                  <p class="text-muted text-sm">Comment joindre le patient et son contact d'urgence.</p>
                </div>

                <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <UFormField label="Téléphone" name="phone" required>
                    <UInput v-model="formState.phone" placeholder="ex : 06 12 34 56 78" type="tel" class="w-full" />
                  </UFormField>
                  <UFormField label="Email" name="email">
                    <UInput
                      v-model="formState.email"
                      placeholder="ex : jean.dupont@email.com"
                      type="email"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Adresse" name="address" class="md:col-span-2">
                    <UTextarea
                      v-model="formState.address"
                      placeholder="123 Rue de la République, 75001 Paris, France"
                      :rows="2"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Ville" name="city">
                    <UInput v-model="formState.city" placeholder="Paris" class="w-full" />
                  </UFormField>
                  <UFormField label="Code Postal" name="postalCode">
                    <UInput v-model="formState.postalCode" placeholder="75001" class="w-full" />
                  </UFormField>
                  <UFormField label="Pays" name="country" class="md:col-span-2">
                    <UInput v-model="formState.country" placeholder="France" class="w-full" />
                  </UFormField>
                </div>

                <PatientEmergencyContacts v-model="formState.emergencyContacts" />
              </div>
            </template>

            <!-- Step 3: Médical -->
            <template #medical>
              <div class="space-y-5 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Informations médicales</h2>
                  <p class="text-muted text-sm">Antécédents, allergies et traitements en cours. Optionnel.</p>
                </div>

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
              </div>
            </template>

            <!-- Step 4: Assurance & Notes -->
            <template #insurance>
              <div class="space-y-6 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Assurance &amp; notes</h2>
                  <p class="text-muted text-sm">Mutuelle, prescripteur et notes libres.</p>
                </div>

                <div class="grid grid-cols-1 gap-x-6 gap-y-4">
                  <UFormField label="Nom de l'assurance / mutuelle" name="insuranceProvider">
                    <USelect v-model="selectedInsurerSlug" :items="INSURER_DROPDOWN_OPTIONS" class="w-full" />
                  </UFormField>
                  <UFormField
                    v-if="formState.insurerSelectionType === 'custom'"
                    label="Nom de l'assureur"
                    name="customInsurerName"
                  >
                    <UInput
                      v-model="formState.customInsurerName"
                      placeholder="ex : Mutuelle SantéPlus"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Médecin / Praticien prescripteur" name="referralSource">
                    <UInput v-model="formState.referralSource" placeholder="ex : Dr. Leblanc" class="w-full" />
                  </UFormField>
                </div>

                <USeparator label="Notes générales" />

                <UFormField label="Note générale" name="generalNote">
                  <UTextarea
                    v-model="generalNote"
                    placeholder="Ajouter une note générale sur le patient..."
                    :rows="4"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </template>
          </UStepper>

          <!-- Navigation -->
          <div class="border-default mt-6 flex items-center justify-between border-t pt-6">
            <UButton variant="soft" color="neutral" trailing-icon="i-hugeicons-cancel-01" to="/patients">
              Annuler
            </UButton>

            <div class="flex items-center gap-2">
              <UButton
                v-if="stepIndex > 0"
                type="button"
                variant="soft"
                color="neutral"
                leading-icon="i-hugeicons-arrow-left-01"
                @click="handlePrev"
              >
                Retour
              </UButton>

              <UButton
                v-if="!isLastStep"
                type="button"
                color="primary"
                trailing-icon="i-hugeicons-arrow-right-01"
                @click="handleNext"
              >
                Suivant
              </UButton>

              <UButton
                v-else
                type="submit"
                color="primary"
                icon="i-hugeicons-task-done-01"
                :loading="isLoading"
                :disabled="isLoading"
                label="Enregistrer"
              />
            </div>
          </div>
        </UForm>
      </div>
    </UPageCard>
  </AppDashboardPage>
</template>
