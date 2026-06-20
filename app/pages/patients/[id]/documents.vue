<script setup lang="ts">
  import type { RadioGroupItem } from '@nuxt/ui'
  import { LazyDocumentCreateSlideover } from '#components'

  const route = useRoute()
  const patientId = computed(() => route.params.id as string)

  const overlay = useOverlay()
  const documentCreateOverlay = overlay.create(LazyDocumentCreateSlideover)
  const { openPlanPicker } = useBillingSlideover()

  const selectedDocumentType = ref<string>('all')

  const categoryFilterItems = computed<RadioGroupItem[]>(() => [
    {
      label: 'Tous les types',
      value: 'all',
      icon: 'i-hugeicons-paragraph-bullets-point-01',
      description: 'Afficher tous les documents'
    },
    ...Object.entries(DOCUMENT_CATEGORIES_CONFIG).map(([key, item]) => ({
      label: item.label,
      value: key,
      icon: item.icon,
      description: item.label
    }))
  ])

  const categorySelectItems = computed(() => [
    { label: 'Tous les types', value: 'all', icon: 'i-hugeicons-paragraph-bullets-point-01' },
    ...DOCUMENT_CATEGORY_OPTIONS
  ])
  const icon = computed(() => categorySelectItems.value.find((item) => item.value === selectedDocumentType.value)?.icon)

  const { data: patient, isLoading: patientLoading } = usePatientById(() => route.params.id as string)
  const {
    latestActiveTreatmentPlan,
    treatmentPlansGroupedByStatus,
    loading: treatmentPlansLoading
  } = usePatientTreatmentPlans(patientId)

  // ─── Plan selection (URL-synced, defaults to active plan) ────
  // Accepted values: 'all' | '<planId>'
  const selectedPlanId = computed<string>({
    get: () => {
      const q = route.query.planId as string | undefined
      if (q) return q
      return latestActiveTreatmentPlan.value?.id ?? 'all'
    },
    set: (v) =>
      navigateTo({
        path: route.path,
        query: { ...route.query, planId: v || 'all' }
      })
  })

  // Derive the current mode
  const currentMode = computed<'all' | 'plan'>(() => {
    return selectedPlanId.value === 'all' ? 'all' : 'plan'
  })

  // Detect invalid (deleted) plan ID in URL and reset silently
  const selectedPlan = computed(() => {
    if (currentMode.value !== 'plan') return null
    return treatmentPlansGroupedByStatus.value?.find((p) => p.id === selectedPlanId.value) ?? null
  })

  // Auto-reset if the URL points to a plan that no longer exists AND plans are loaded
  watch(
    [selectedPlan, treatmentPlansGroupedByStatus],
    ([plan, plans]) => {
      if (currentMode.value === 'plan' && !plan && plans && plans.length > 0) {
        selectedPlanId.value = 'all'
      }
    },
    { flush: 'post' }
  )

  const { data: documents, isLoading: documentsLoading } = useDocumentsList(patientId, () =>
    currentMode.value === 'plan' ? selectedPlanId.value : ''
  )

  const filteredDocuments = computed(() => {
    if (!documents.value) return []
    if (selectedDocumentType.value === 'all') return documents.value
    return documents.value.filter((doc) => doc.category === selectedDocumentType.value)
  })

  const hasDocumentsWhenFiltered = computed(() => {
    if (!documents.value) return false
    if (selectedDocumentType.value === 'all') return documents.value.length > 0
    return documents.value.some((doc) => doc.category === selectedDocumentType.value)
  })

  watch(selectedPlanId, () => {
    selectedDocumentType.value = 'all'
  })

  const isLoading = computed(() => patientLoading.value || treatmentPlansLoading.value || documentsLoading.value)

  // ─── Trigger button label ────────────────────────────────────
  const selectedPlanName = computed(() => selectedPlan.value?.title ?? '')

  const triggerLabel = computed(() => {
    if (currentMode.value === 'all') return 'Tous les documents'
    return selectedPlanName.value || 'Plan inconnu'
  })

  const triggerStatusIcon = computed(() => {
    if (!selectedPlan.value) return null
    return getTreatmentPlanStatusIcon(selectedPlan.value.status)
  })

  const triggerStatusColor = computed(() => {
    if (!selectedPlan.value) return null
    return getTreatmentPlanStatusColor(selectedPlan.value.status)
  })

  // ─── Event handlers ──────────────────────────────────────────
  function handleOpenPlanPicker() {
    openPlanPicker(patientId.value, currentMode.value === 'plan' ? selectedPlanId.value : null, (planId: string) => {
      selectedPlanId.value = planId
    })
  }

  function handleSelectAll() {
    selectedPlanId.value = 'all'
  }

  function handleAddDocument() {
    if (!patient.value) return
    const planId = currentMode.value === 'plan' ? selectedPlanId.value : undefined
    documentCreateOverlay.open({
      patient: patient.value,
      treatmentPlanId: planId
    })
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <AppCard
        title="Filtres des documents"
        description="Affinez les documents par type."
        :ui="{ body: 'pt-0 sm:pt-0' }"
      >
        <USelect
          v-model="selectedDocumentType"
          :items="categorySelectItems"
          :icon="icon"
          placeholder="Tous les types"
          class="w-full lg:hidden"
        />
        <URadioGroup
          v-model="selectedDocumentType"
          color="primary"
          variant="table"
          size="sm"
          :default-value="'all'"
          :items="categoryFilterItems"
          :ui="{
            root: 'hidden lg:block',
            item: 'p-2 first-of-type:rounded-t-md'
          }"
        />
      </AppCard>
    </div>

    <div class="lg:col-span-2">
      <AppCard title="Documents" description="Tous les documents du patient." icon="i-hugeicons-files-01">
        <template #actions>
          <UButton
            icon="i-hugeicons-plus-sign"
            label="Ajouter un document"
            color="primary"
            size="sm"
            @click="handleAddDocument"
          />
        </template>

        <!-- Plan selector: trigger + chips -->
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <UButton
            :variant="selectedPlanId === 'all' ? 'soft' : 'ghost'"
            :color="selectedPlanId === 'all' ? 'primary' : 'neutral'"
            size="xs"
            @click="handleSelectAll"
          >
            Tous
          </UButton>

          <USeparator orientation="vertical" class="mx-1 h-5" />

          <UButton
            :color="currentMode === 'plan' ? 'primary' : 'neutral'"
            :variant="currentMode === 'plan' ? 'soft' : 'outline'"
            size="xs"
            trailing-icon="i-hugeicons-arrow-down-01"
            @click="handleOpenPlanPicker"
          >
            <span class="flex items-center gap-2">
              <UIcon v-if="triggerStatusIcon" :name="triggerStatusIcon" :class="`text-${triggerStatusColor}`" />
              <span class="max-w-45 truncate">{{ triggerLabel }}</span>
            </span>
          </UButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
        </div>
        <div
          v-else-if="filteredDocuments && filteredDocuments.length > 0"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <DocumentCard
            v-for="document in filteredDocuments"
            :key="document.id"
            :document="document"
            :patient-id="route.params.id as string"
            variant="extended"
          />
        </div>
        <UEmpty
          v-else
          :title="selectedDocumentType !== 'all' && !hasDocumentsWhenFiltered ? 'Aucun résultat' : 'Aucun document'"
          :description="
            selectedDocumentType !== 'all'
              ? `Aucun document de ce type n'a été trouvé. Essayez d'ajuster le filtre.`
              : `Aucun document n'a encore été téléversé pour ce plan de traitement.`
          "
          :icon="
            selectedDocumentType !== 'all' && !hasDocumentsWhenFiltered
              ? 'i-hugeicons-filter-remove'
              : 'i-hugeicons-files-01'
          "
          variant="outline"
          size="lg"
          class="py-8"
        />
      </AppCard>
    </div>
  </div>
</template>
