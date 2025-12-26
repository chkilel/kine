<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{
    patient: Patient
    treatmentPlan?: TreatmentPlan
  }>()
  const emit = defineEmits<{ close: [data?: any] }>()

  const { user } = await useAuth()
  const { activeOrganization } = useOrganization()
  if (!user || !activeOrganization.value.data) {
    await navigateTo('/login')
  }
  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  const { mutate: createTreatmentPlan } = useCreateTreatmentPlan()
  const { mutate: updateTreatmentPlan } = useUpdateTreatmentPlan()

  const therapists = computed(() => [user.value!])
  const loading = ref(false)
  const isEditMode = computed(() => !!props.treatmentPlan)

  // Initialize form based on mode
  const formState = reactive<TreatmentPlanCreate>({
    patientId: props.patient.id!,
    therapistId: props.treatmentPlan?.therapistId || user.value!.id,
    organizationId: activeOrganization.value.data!.id,
    prescribingDoctor: props.treatmentPlan?.prescribingDoctor || '',
    prescriptionDate: props.treatmentPlan?.prescriptionDate || today(getLocalTimeZone()).toString(),
    title: props.treatmentPlan?.title || '',
    diagnosis: props.treatmentPlan?.diagnosis || '',
    objective: props.treatmentPlan?.objective || '',
    status: props.treatmentPlan?.status || 'planned',
    startDate: props.treatmentPlan?.startDate || today(getLocalTimeZone()).toString(),
    endDate: props.treatmentPlan?.endDate,
    numberOfSessions: props.treatmentPlan?.numberOfSessions || 0,
    sessionFrequency: props.treatmentPlan?.sessionFrequency || undefined,
    painLevel: props.treatmentPlan?.painLevel || 10,
    coverageStatus: props.treatmentPlan?.coverageStatus || 'not_required',
    insuranceInfo: props.treatmentPlan?.insuranceInfo || '',
    notes: props.treatmentPlan?.notes || null
  })

  // Calendar model for date picker
  const startDateModel = computed({
    get: () => (formState.startDate ? parseDate(formState.startDate) : null),
    set: (val) => (formState.startDate = val ? val.toString() : today(getLocalTimeZone()).toString())
  })

  const endDateModel = computed({
    get: () => (formState.endDate ? parseDate(formState.endDate) : null),
    set: (val) => (formState.endDate = val ? val.toString() : today(getLocalTimeZone()).toString())
  })

  const prescriptionDateModel = computed({
    get: () => (formState.prescriptionDate ? parseDate(formState.prescriptionDate) : null),
    set: (val) => (formState.prescriptionDate = val ? val.toString() : today(getLocalTimeZone()).toString())
  })

  async function handleSubmit(event: FormSubmitEvent<TreatmentPlanCreate>) {
    loading.value = true

    try {
      if (isEditMode.value) {
        updateTreatmentPlan({
          patientId: props.patient.id,
          planId: props.treatmentPlan!.id,
          data: event.data,
          onSuccess: () => {
            emit('close')
            resetForm()
          }
        })
      } else {
        createTreatmentPlan({
          patientId: props.patient.id,
          data: event.data
        })
        emit('close')
        resetForm()
      }
    } catch (error: any) {
      console.error('Error creating/updating treatment plan:', error)
    } finally {
      loading.value = false
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
      painLevel: 4,
      coverageStatus: 'not_required',
      insuranceInfo: '',
      notes: undefined
    })

    // Reset calendar models
    prescriptionDateModel.value = null
    startDateModel.value = null
    endDateModel.value = null
  }

  function handleCancel() {
    emit('close', false)
  }

  const formRef = useTemplateRef<HTMLFormElement>('newPlanRef')
  function submitButton() {
    formRef.value?.submit()
  }
</script>

<template>
  <USlideover
    :dismissible="false"
    :title="isEditMode ? 'Modifier un plan de traitement' : 'Créer un plan de traitement'"
    :description="
      isEditMode
        ? 'Modifiez les informations du plan de traitement.'
        : 'Ajoutez les informations de base du plan de traitement.'
    "
    :ui="{ content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated' }"
  >
    <template #body>
      <UForm
        ref="newPlanRef"
        :schema="treatmentPlanCreateSchema"
        :state="formState"
        class="space-y-6"
        @submit="handleSubmit"
      >
        <div class="space-y-6">
          <!-- Patient Information -->
          <UCard variant="outline">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Médecin prescripteur" name="prescribingDoctor" required>
                <UInput v-model="formState.prescribingDoctor" placeholder="Dr. Leblanc" class="w-full" />
              </UFormField>
              <UFormField label="Date de prescription" name="prescriptionDate" required>
                <UPopover>
                  <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
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
            </div>
          </UCard>

          <!-- Treatment Plan Details -->
          <UCard variant="outline">
            <h3 class="text-highlighted mb-4 text-base font-bold">Détails du plan de traitement</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Titre" name="title" required class="md:col-span-2">
                <UInput v-model="formState.title" placeholder="Ex: Rééducation épaule droite" class="w-full" />
              </UFormField>
              <UFormField label="Pathologie / Diagnostic" name="diagnosis" required class="md:col-span-2">
                <UTextarea
                  v-model="formState.diagnosis"
                  placeholder="Tendinopathie du supra-épineux..."
                  :rows="3"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Objectifs thérapeutiques" name="objective" required class="md:col-span-2">
                <UTextarea
                  v-model="formState.objective"
                  placeholder="Améliorer l'amplitude, réduire la douleur..."
                  :rows="3"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Kinésithérapeute responsable" name="therapistId" required>
                <USelectMenu
                  v-model="formState.therapistId"
                  value-key="id"
                  label-key="name"
                  :items="therapists"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Statut" name="status">
                <URadioGroup
                  v-model="formState.status"
                  :items="[...TREATMENT_PLAN_STATUS_OPTIONS]"
                  value-key="value"
                  label-key="label"
                  orientation="horizontal"
                  indicator="hidden"
                  variant="table"
                  size="sm"
                  :ui="{ item: 'p-2 flex-1' }"
                />
              </UFormField>
              <UFormField label="Nombre de séances" name="numberOfSessions">
                <UInputNumber v-model="formState.numberOfSessions" :min="1" :max="50" class="w-full" />
              </UFormField>
              <UFormField label="Date de début" name="startDate">
                <UPopover>
                  <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                    {{
                      startDateModel ? df.format(startDateModel.toDate(getLocalTimeZone())) : 'Sélectionner une date'
                    }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="startDateModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
          </UCard>

          <!-- Medical Data and Insurance -->
          <UCard variant="outline">
            <h3 class="text-highlighted mb-4 text-base font-bold">Données médicales et assurance</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField
                label="Niveau de douleur actuel"
                name="painLevel"
                help="Échelle de 0 à 10"
                class="md:col-span-2"
              >
                <div class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span v-for="(item, index) in [...Array(11).keys()]" :key="index">{{ item }}</span>
                  </div>
                  <USlider v-model="formState.painLevel" :min="0" :max="10" :step="1" class="w-full flex-1" />
                </div>
              </UFormField>
              <UFormField label="Informations assurance / mutuelle" name="insuranceInfo">
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
          </UCard>

          <!-- Summary -->
          <UCard variant="outline">
            <h3 class="text-highlighted mb-4 text-base font-bold">Résumé avant validation</h3>
            <div class="text-muted space-y-3 text-sm">
              <p>
                <strong>Patient :</strong>
                {{ `${patient.firstName} ${patient.lastName}` }}
              </p>
              <p>
                <strong>Plan :</strong>
                {{ formState.title || 'Non défini' }}
              </p>
              <p>
                <strong>Kinésithérapeute :</strong>
                {{ formState.therapistId || 'Non défini' }}
              </p>
              <p>
                <strong>Période :</strong>
                À partir du
                {{ startDateModel ? df.format(startDateModel.toDate(getLocalTimeZone())) : '[Date de début]' }}
              </p>
            </div>
          </UCard>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton variant="outline" color="neutral" size="lg" @click="handleCancel">Annuler</UButton>
        <UButton type="submit" @click="submitButton" color="primary" size="lg" :loading="loading" :disabled="loading">
          {{ isEditMode ? 'Mettre à jour' : 'Enregistrer' }} le plan
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
