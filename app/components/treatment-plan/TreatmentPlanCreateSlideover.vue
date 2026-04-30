<script setup lang="ts">
  import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
  import type { Form, FormSubmitEvent } from '@nuxt/ui'

  const { patient, treatmentPlan } = defineProps<{ patient: Patient; treatmentPlan?: TreatmentPlan }>()
  const emit = defineEmits<{ close: [data?: any] }>()

  type TreatmentPlanFormType = typeof treatmentPlan extends TreatmentPlan ? TreatmentPlanUpdate : TreatmentPlanCreate

  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'long' })

  const { user } = await useAuth()
  const { activeOrganization } = useOrganization()
  const { mutate: createTreatmentPlan, isLoading: isCreating } = useCreateTreatmentPlan()
  const { mutate: updateTreatmentPlan, isLoading: isUpdating } = useUpdateTreatmentPlan()
  const { therapists } = useOrganizationMembers()

  const formRef = useTemplateRef<Form<TreatmentPlanFormType>>('planFormRef')
  const isEditMode = computed(() => !!treatmentPlan)
  const loading = computed(() => (isEditMode.value ? isUpdating.value : isCreating.value))
  const formSchema = computed(() => (isEditMode.value ? treatmentPlanUpdateSchema : treatmentPlanCreateSchema))

  // Get default pricing from organization (in DH for display)
  const getDefaultPricing = () => {
    const pricing = activeOrganization.value.data?.pricing?.rateCent
    return {
      clinic: pricing?.clinic ? centsToCurrency(pricing.clinic) : 100,
      home: pricing?.home ? centsToCurrency(pricing.home) : 100,
      telehealth: pricing?.telehealth ? centsToCurrency(pricing.telehealth) : 100
    }
  }

  const formState = reactive<TreatmentPlanFormType>({
    // Form state with pricing in DH for user-friendly display
    patientId: patient.id,
    organizationId: activeOrganization.value.data!.id,

    prescribingDoctor: treatmentPlan?.prescribingDoctor || '',
    prescriptionDate: treatmentPlan?.prescriptionDate || getTodayAsString(),
    insuranceInfo: treatmentPlan?.insuranceInfo || '',
    coverageStatus: treatmentPlan?.coverageStatus || 'not_required',

    therapistId: treatmentPlan?.therapistId || user.value!.id,
    startDate: treatmentPlan?.startDate || getTodayAsString(),
    endDate: treatmentPlan?.endDate,
    numberOfSessions: treatmentPlan?.numberOfSessions || 1,
    sessionFrequency: treatmentPlan?.sessionFrequency || 1,
    status: treatmentPlan?.status || 'planned',

    title: treatmentPlan?.title || '',
    diagnosis: treatmentPlan?.diagnosis || '',
    objective: treatmentPlan?.objective || '',

    pricing: treatmentPlan?.pricing
      ? {
          clinic: centsToCurrency(treatmentPlan.pricing.clinic),
          home: centsToCurrency(treatmentPlan.pricing.home),
          telehealth: centsToCurrency(treatmentPlan.pricing.telehealth)
        }
      : getDefaultPricing()
  })

  // Calendar model for date picker
  const startDateModel = computed({
    get: () => (formState.startDate ? parseDate(formState.startDate) : null),
    set: (val) => (formState.startDate = val ? val.toString() : getTodayAsString())
  })

  const endDateModel = computed({
    get: () => (formState.endDate ? parseDate(formState.endDate) : null),
    set: (val) => (formState.endDate = val ? val.toString() : getTodayAsString())
  })

  const prescriptionDateModel = computed({
    get: () => (formState.prescriptionDate ? parseDate(formState.prescriptionDate) : null),
    set: (val) => (formState.prescriptionDate = val ? val.toString() : getTodayAsString())
  })

  async function handleSubmit(event: FormSubmitEvent<TreatmentPlanCreate | TreatmentPlanUpdate>) {
    const data = event.data

    // Convert pricing from DH to cents before submitting
    const dataWithCents = {
      ...data,
      pricing: {
        clinic: currencyToCents(formState.pricing.clinic),
        home: currencyToCents(formState.pricing.home),
        telehealth: currencyToCents(formState.pricing.telehealth)
      }
    }

    // Edit
    if (isEditMode.value) {
      updateTreatmentPlan({
        planId: treatmentPlan!.id,
        data: dataWithCents as TreatmentPlanUpdate,
        onSuccess: () => {
          emit('close')
          resetForm()
        }
      })
    } else {
      // Create
      createTreatmentPlan({
        data: dataWithCents as TreatmentPlanCreate,
        onSuccess: () => {
          emit('close')
          resetForm()
        }
      })
    }
  }

  function resetForm() {
    Object.assign(formState, {
      patientId: '',
      prescribingDoctor: '',
      prescriptionDate: new Date(),
      title: '',
      diagnosis: '',
      objective: '',
      therapistId: '',
      status: 'planned',
      startDate: new Date(),
      endDate: undefined,
      numberOfSessions: 4,
      sessionFrequency: undefined,
      coverageStatus: 'not_required',
      insuranceInfo: '',
      pricing: getDefaultPricing()
    })

    // Reset calendar models
    prescriptionDateModel.value = null
    startDateModel.value = null
    endDateModel.value = null
  }
</script>

<template>
  <USlideover
    :title="isEditMode ? 'Modifier le plan de traitement' : 'Créer un plan de traitement'"
    :ui="{ content: 'w-full max-w-7xl bg-elevated' }"
  >
    <template #body>
      <UForm ref="planFormRef" :schema="formSchema" :state="formState" class="space-y-6" @submit="handleSubmit">
        <div class="space-y-4">
          <div class="grid-col-1 grid gap-4 lg:grid-cols-2">
            <!-- Medical Data and Insurance -->
            <AppCard title="Prescription et couverture">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UFormField label="Médecin" name="prescribingDoctor" required>
                  <UInput v-model="formState.prescribingDoctor" placeholder="Dr. Leblanc" class="w-full" />
                </UFormField>

                <UFormField label="Date de prescription" name="prescriptionDate" required>
                  <UPopover>
                    <UButton
                      color="neutral"
                      variant="subtle"
                      icon="i-lucide-calendar"
                      class="w-full justify-start"
                      block
                    >
                      {{
                        prescriptionDateModel
                          ? df.format(prescriptionDateModel.toDate(getLocalTimeZone()))
                          : 'Sélectionner une date'
                      }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="prescriptionDateModel" class="p-2" />
                    </template>
                  </UPopover>
                </UFormField>

                <UFormField label="Assurance/Mutuelle" name="insuranceInfo">
                  <UInput v-model="formState.insuranceInfo" placeholder="Mutuelle SantéPlus..." class="w-full" />
                </UFormField>

                <UFormField label="Statut de couverture">
                  <USelectMenu
                    v-model="formState.coverageStatus"
                    :items="INSURANCE_COVERAGE_OPTIONS"
                    value-key="value"
                    label-key="label"
                    placeholder="Selectionner ..."
                    class="w-full"
                  />
                </UFormField>
              </div>
            </AppCard>

            <!-- Organisation du plan -->
            <AppCard title="Organisation du plan">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UFormField label="Kinésithérapeute responsable" name="therapistId" required>
                  <USelectMenu
                    v-model="formState.therapistId"
                    value-key="id"
                    label-key="name"
                    :items="therapists"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Date de début" name="startDate" required>
                  <UPopover>
                    <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start">
                      {{
                        startDateModel ? df.format(startDateModel.toDate(getLocalTimeZone())) : 'Sélectionner une date'
                      }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="startDateModel" class="p-2" />
                    </template>
                  </UPopover>
                </UFormField>

                <UFormField label="Nombre total des séances" name="numberOfSessions">
                  <UInputNumber v-model="formState.numberOfSessions" :min="1" :max="100" class="w-full" />
                </UFormField>
                <UFormField label="Séances/semaine" name="sessionFrequency">
                  <UInputNumber v-model="formState.sessionFrequency" :min="1" :max="6" class="w-full" />
                </UFormField>

                <UFormField label="Statut du plan" name="status" class="md:col-span-2">
                  <URadioGroup
                    v-model="formState.status"
                    :items="[...TREATMENT_PLAN_STATUS_OPTIONS]"
                    orientation="horizontal"
                    indicator="hidden"
                    variant="table"
                    size="sm"
                    :ui="{ item: 'p-2 flex-1 items-center' }"
                  />
                </UFormField>
              </div>
            </AppCard>
          </div>
          <!-- Informations cliniques -->
          <AppCard title="Informations cliniques">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Titre du plan de traitement" name="title" required class="md:col-span-2">
                <UInput v-model="formState.title" placeholder="Ex: Rééducation épaule droite" class="w-full" />
              </UFormField>

              <UFormField label="Motif de prise en charge" name="diagnosis" required class="col-span-1">
                <UTextarea
                  v-model="formState.diagnosis"
                  placeholder="Tendinopathie du supra-épineux..."
                  :rows="4"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Objectifs de rééducation" name="objective" class="col-span-1">
                <UTextarea
                  v-model="formState.objective"
                  placeholder="Améliorer l'amplitude, réduire la douleur..."
                  :rows="4"
                  class="w-full"
                />
              </UFormField>
            </div>
          </AppCard>

          <!-- Pricing -->
          <AppCard title="Tarifs des séances">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <UFormField label="Clinique (DH)" name="pricing.clinic" required>
                <UInputNumber v-model="formState.pricing.clinic" :min="1" class="col-span-1 w-full" />
              </UFormField>
              <UFormField label="Domicile (DH)" name="pricing.home" required>
                <UInputNumber v-model="formState.pricing.home" :min="1" class="col-span-1 w-full" />
              </UFormField>
              <UFormField label="Téléconsultation (DH)" name="pricing.telehealth" required>
                <UInputNumber v-model="formState.pricing.telehealth" :min="1" class="col-span-1 w-full" />
              </UFormField>
            </div>
          </AppCard>
        </div>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton label="Annuler" variant="outline" color="neutral" size="lg" @click="close" />
      <UButton type="submit" size="lg" :loading="loading" :disabled="loading" @click="formRef?.submit()">
        {{ isEditMode ? 'Mettre à jour' : 'Enregistrer' }} le plan
      </UButton>
    </template>
  </USlideover>
</template>
