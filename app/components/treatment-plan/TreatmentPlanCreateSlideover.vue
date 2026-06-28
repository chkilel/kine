<script setup lang="ts">
  import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
  import type { Form, FormSubmitEvent } from '@nuxt/ui'
  import { INSURER_OPTIONS, isInsurerSlug } from '~~/shared/utils/constants.insurers'
  import { INSURANCE_COVERAGE_OPTIONS } from '~~/shared/utils/constants.patient'
  import { toPriceItemSnapshot } from '~~/server/utils/pricing'

  const { patient, treatmentPlan } = defineProps<{ patient: Patient; treatmentPlan?: TreatmentPlan }>()
  const emit = defineEmits<{ close: [data?: any] }>()

  // Form state interface with insurer selection type (UI-level only)
  interface TreatmentPlanFormState extends TreatmentPlanUpdate {
    insurerSelectionType: 'catalog' | 'custom'
    customInsurerName?: string
  }

  type TreatmentPlanFormType = typeof treatmentPlan extends TreatmentPlan ? TreatmentPlanUpdate : TreatmentPlanCreate

  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'long' })

  // Insurer dropdown options
  const INSURER_DROPDOWN_OPTIONS = [
    ...INSURER_OPTIONS.map((opt) => ({ label: opt.label, value: opt.slug })),
    { label: 'Autre', value: 'other' }
  ]

  const { user } = await useAuth()
  const { activeOrganization } = useOrganization()
  const { mutate: createTreatmentPlan, isLoading: isCreating } = useCreateTreatmentPlan()
  const { mutate: updateTreatmentPlan, isLoading: isUpdating } = useUpdateTreatmentPlan()
  const { therapists } = useOrganizationMembers()

  const formRef = useTemplateRef<Form<TreatmentPlanFormType>>('planFormRef')
  const isEditMode = computed(() => !!treatmentPlan)
  const loading = computed(() => (isEditMode.value ? isUpdating.value : isCreating.value))
  const formSchema = computed(() => (isEditMode.value ? treatmentPlanUpdateSchema : treatmentPlanCreateSchema))

  // Org price items for the selector (4.2)
  const orgPriceItems = computed<PriceItem[]>(() => {
    return activeOrganization.value.data?.pricing?.priceItems || []
  })

  // Price items with snapshot fallback for edit mode
  const priceItemOptions = computed<PriceItem[]>(() => {
    const items = orgPriceItems.value
    if (isEditMode.value && selectedPriceItem.value) {
      const exists = items.some((i) => i.code === selectedPriceItem.value!.code)
      if (!exists) {
        return [
          ...items,
          {
            id: 'snapshot',
            code: selectedPriceItem.value.code,
            description: selectedPriceItem.value.description,
            rateCent: selectedPriceItem.value.rateCent,
            isDefault: false
          }
        ]
      }
    }
    return items
  })

  // Get default price item from organization
  const getDefaultPriceItem = (): PriceItem | null => {
    return orgPriceItems.value.find((item: PriceItem) => item.isDefault) || orgPriceItems.value[0] || null
  }

  // Current selected price item snapshot (full object, cached)
  const selectedPriceItem = ref<PriceItemSnapshot | null>(
    treatmentPlan?.priceItem || (getDefaultPriceItem() ? toPriceItemSnapshot(getDefaultPriceItem()!) : null)
  )

  // Pricing selector code — used to match selected item in dropdown
  const selectedPriceItemCode = computed({
    get: () => selectedPriceItem.value?.code,
    set: (code: string | null) => {
      if (!code) {
        selectedPriceItem.value = null
        return
      }
      const item = orgPriceItems.value.find((i) => i.code === code)
      if (item) {
        selectedPriceItem.value = toPriceItemSnapshot(item)
      }
    }
  })

  // Get default pricing from organization (in DH for display, as fallback)
  const getDefaultPricing = () => {
    const orgPricing = activeOrganization.value.data?.pricing
    if (!orgPricing) {
      return { clinic: 150, home: 200, telehealth: 100 }
    }

    const defaultItem = orgPricing.priceItems?.find((item: PriceItem) => item.isDefault) || orgPricing.priceItems?.[0]
    if (!defaultItem?.rateCent) {
      return { clinic: 150, home: 200, telehealth: 100 }
    }
    return {
      clinic: defaultItem.rateCent.clinic ? centsToCurrency(defaultItem.rateCent.clinic) : 150,
      home: defaultItem.rateCent.home ? centsToCurrency(defaultItem.rateCent.home) : 200,
      telehealth: defaultItem.rateCent.telehealth ? centsToCurrency(defaultItem.rateCent.telehealth) : 100
    }
  }

  // Initialize form state
  const buildFormState = (): TreatmentPlanFormState => {
    const currentInsurer = treatmentPlan?.insuranceProvider || patient.insuranceProvider || ''
    const isCatalogInsurer = currentInsurer && isInsurerSlug(currentInsurer)

    return {
      // Basic fields
      patientId: patient.id,
      organizationId: activeOrganization.value.data!.id,

      prescribingDoctor: treatmentPlan?.prescribingDoctor || '',
      prescriptionDate: treatmentPlan?.prescriptionDate || getTodayAsString(),

      // Insurance fields - inherit from patient when creating, use plan data when editing
      insuranceProvider: isCatalogInsurer ? currentInsurer : undefined,
      insurerSelectionType: isCatalogInsurer ? 'catalog' : currentInsurer ? 'custom' : 'catalog',
      customInsurerName: !isCatalogInsurer && currentInsurer ? currentInsurer : undefined,
      coverageStatus: treatmentPlan?.coverageStatus || undefined,

      therapistId: treatmentPlan?.therapistId || user.value!.id,
      startDate: treatmentPlan?.startDate || getTodayAsString(),
      endDate: treatmentPlan?.endDate,
      numberOfSessions: treatmentPlan?.numberOfSessions || 1,
      sessionFrequency: treatmentPlan?.sessionFrequency || 1,
      status: treatmentPlan?.status || 'planned',

      title: treatmentPlan?.title || '',
      diagnosis: treatmentPlan?.diagnosis || '',
      objective: treatmentPlan?.objective || '',

      // Pricing
      pricing: treatmentPlan?.pricing
        ? {
            clinic: centsToCurrency(treatmentPlan.pricing.clinic),
            home: centsToCurrency(treatmentPlan.pricing.home),
            telehealth: centsToCurrency(treatmentPlan.pricing.telehealth)
          }
        : getDefaultPricing()
    }
  }

  const formState = reactive<TreatmentPlanFormState>(buildFormState())

  // Computed property for insurer dropdown sync (UI-level only)
  const selectedInsurerSlug = computed({
    get: () => (formState.insurerSelectionType === 'catalog' ? formState.insuranceProvider : 'other'),
    set: (val) => {
      if (val === 'other') {
        formState.insurerSelectionType = 'custom'
        formState.insuranceProvider = undefined
      } else {
        formState.insurerSelectionType = 'catalog'
        formState.insuranceProvider = val
      }
    }
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

  const estimatedEndDate = computed(() => {
    if (!formState.startDate || !formState.numberOfSessions || !formState.sessionFrequency) return null
    const weeks = Math.ceil(formState.numberOfSessions / formState.sessionFrequency)
    const date = parseDate(formState.startDate).add({ weeks })
    return df.format(date.toDate(getLocalTimeZone()))
  })

  async function handleSubmit(_event: FormSubmitEvent<TreatmentPlanCreate | TreatmentPlanUpdate>) {
    const { insuranceProvider, ...submitData } = formState

    const payload = {
      ...submitData,
      insuranceProvider: formState.insurerSelectionType === 'custom' ? formState.customInsurerName : insuranceProvider,
      priceItem: selectedPriceItem.value,
      pricing: selectedPriceItem.value?.rateCent || {
        clinic: currencyToCents(formState.pricing!.clinic),
        home: currencyToCents(formState.pricing!.home),
        telehealth: currencyToCents(formState.pricing!.telehealth)
      }
    }

    // Edit
    if (isEditMode.value) {
      updateTreatmentPlan({
        planId: treatmentPlan!.id,
        data: payload as TreatmentPlanUpdate,
        onSuccess: () => {
          emit('close')
          resetForm()
        }
      })
    } else {
      // Create
      createTreatmentPlan({
        data: payload as TreatmentPlanCreate,
        onSuccess: () => {
          emit('close')
          resetForm()
        }
      })
    }
  }

  function resetForm() {
    // Reset price item to org default
    selectedPriceItem.value = getDefaultPriceItem() ? toPriceItemSnapshot(getDefaultPriceItem()!) : null

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
      insuranceProvider: undefined,
      insurerSelectionType: 'catalog',
      customInsurerName: undefined,
      coverageStatus: undefined,
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
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Card 1 — Contexte clinique -->
          <AppCard title="Contexte clinique">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Médecin prescripteur" name="prescribingDoctor" required>
                <UInput v-model="formState.prescribingDoctor" placeholder="Dr. Leblanc" class="w-full" />
              </UFormField>

              <UFormField label="Date de prescription" name="prescriptionDate" required>
                <UPopover>
                  <UButton
                    color="neutral"
                    size="sm"
                    variant="subtle"
                    icon="i-hugeicons-calendar-03"
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

              <UFormField label="Titre du plan de traitement" name="title" required class="md:col-span-2">
                <UInput v-model="formState.title" placeholder="Ex: Rééducation épaule droite" class="w-full" />
              </UFormField>

              <UFormField label="Diagnostic" name="diagnosis" required class="md:col-span-2">
                <UTextarea
                  v-model="formState.diagnosis"
                  placeholder="Tendinopathie du supra-épineux..."
                  :rows="4"
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="isEditMode" label="Objectifs de rééducation" name="objective" class="md:col-span-2">
                <UTextarea
                  v-model="formState.objective"
                  placeholder="Améliorer l'amplitude, réduire la douleur..."
                  :rows="4"
                  class="w-full"
                />
              </UFormField>
            </div>
          </AppCard>

          <!-- Card 2 — Organisation et prise en charge -->
          <AppCard title="Organisation et prise en charge">
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
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="subtle"
                    icon="i-hugeicons-calendar-03"
                    class="w-full justify-start"
                  >
                    {{
                      startDateModel ? df.format(startDateModel.toDate(getLocalTimeZone())) : 'Sélectionner une date'
                    }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="startDateModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>

              <UFormField label="Nombre de séances" name="numberOfSessions">
                <UInputNumber v-model="formState.numberOfSessions" :min="1" :max="100" class="w-full" />
              </UFormField>

              <UFormField label="Séances/semaine" name="sessionFrequency">
                <UInputNumber v-model="formState.sessionFrequency" :min="1" :max="6" class="w-full" />
              </UFormField>

              <UFormField label="Fin estimée" class="cursor-not-allowed md:col-span-2">
                <div
                  class="bg-elevated border-accented flex h-7 w-full items-center gap-2 rounded-md border px-3 text-xs"
                >
                  <UIcon name="i-hugeicons-calendar-03" class="text-muted size-4" />
                  <span class="text-dimmed">
                    {{ estimatedEndDate || '—' }}
                  </span>
                </div>
              </UFormField>

              <UFormField label="Assureur" name="insuranceProvider">
                <USelect v-model="selectedInsurerSlug" :items="INSURER_DROPDOWN_OPTIONS" class="w-full" />
              </UFormField>

              <UFormField label="Statut de couverture">
                <USelectMenu
                  v-model="formState.coverageStatus"
                  :items="INSURANCE_COVERAGE_OPTIONS"
                  value-key="value"
                  label-key="label"
                  placeholder="Sélectionner..."
                  class="w-full"
                />
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

              <UFormField v-if="priceItemOptions.length > 0" label="Tarif" class="md:col-span-2">
                <USelectMenu
                  v-model="selectedPriceItemCode"
                  :items="priceItemOptions"
                  value-key="code"
                  label-key="code"
                  class="w-full"
                  placeholder="Sélectionner un tarif..."
                >
                  <template #default="{ modelValue }">
                    <div class="flex w-full items-center justify-between gap-x-5 text-sm">
                      <span class="font-medium">{{ modelValue }}</span>
                      <div class="divide-accented grid grid-cols-3 divide-x">
                        <span class="text-muted flex items-center gap-1 px-1.5">
                          <UIcon name="i-hugeicons-hospital-02" class="size-3.5" />
                          {{
                            formatCurrency(priceItemOptions.find((item) => item.code === modelValue)?.rateCent.clinic)
                          }}
                        </span>
                        <span class="text-muted flex items-center gap-1 px-1.5">
                          <UIcon name="i-hugeicons-home-03" class="size-3.5" />
                          {{ formatCurrency(priceItemOptions.find((item) => item.code === modelValue)?.rateCent.home) }}
                        </span>
                        <span class="text-muted flex items-center gap-1 px-1.5">
                          <UIcon name="i-hugeicons-video-02" class="size-3.5" />
                          {{
                            formatCurrency(
                              priceItemOptions.find((item) => item.code === modelValue)?.rateCent.telehealth
                            )
                          }}
                        </span>
                      </div>
                    </div>
                  </template>
                  <template #item="{ item }">
                    <div class="w-full space-y-1">
                      <div class="flex items-center justify-between gap-x-4 text-sm">
                        <span class="font-medium">{{ item?.code }}</span>
                        <div class="divide-accented grid grid-cols-3 divide-x">
                          <span class="text-muted flex items-center gap-1 px-2">
                            <UIcon name="i-hugeicons-clinic" class="size-3.5" />
                            {{ item?.rateCent ? `${centsToCurrency(item.rateCent.clinic)} Dh` : '-' }}
                          </span>
                          <span class="text-muted flex items-center gap-1 px-2">
                            <UIcon name="i-hugeicons-home-03" class="size-3.5" />
                            {{ item?.rateCent ? `${centsToCurrency(item.rateCent.home)} Dh` : '-' }}
                          </span>
                          <span class="text-muted flex items-center gap-1 px-2">
                            <UIcon name="i-hugeicons-video-02" class="size-3.5" />
                            {{ item?.rateCent ? `${centsToCurrency(item.rateCent.telehealth)} Dh` : '-' }}
                          </span>
                        </div>
                      </div>
                      <p v-if="item?.description" class="text-muted text-xs">{{ item.description }}</p>
                    </div>
                  </template>
                </USelectMenu>
              </UFormField>

              <UFormField v-if="isEditMode" label="Statut du plan" name="status" class="md:col-span-2">
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
