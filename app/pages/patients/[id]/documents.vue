<script setup lang="ts">
  import type { SelectItem } from '@nuxt/ui'
  import { LazyDocumentCreateSlideover } from '#components'

  const route = useRoute()

  const overlay = useOverlay()
  const documentCreateOverlay = overlay.create(LazyDocumentCreateSlideover)

  const categoryFilter = [
    { label: 'Tous les types', value: 'all', icon: 'i-hugeicons-paragraph-bullets-point-01' },
    ...DOCUMENT_CATEGORY_OPTIONS
  ] satisfies SelectItem[]

  const selectedDocumentType = ref<string>('all')
  const icon = computed(() => categoryFilter.find((item) => item.value === selectedDocumentType.value)?.icon)

  // Get selected plan from URL or default to 'all'
  const selectedPlanId = computed<string>({
    get: () => {
      const planId = route.query.planId as string | undefined
      return planId || 'all'
    },
    set: (id) => {
      navigateTo({
        path: route.path,
        query: { ...route.query, planId: id === 'all' ? undefined : id }
      })
    }
  })

  // Fetch patient and treatment plans
  const { data: patient, isLoading: patientLoading } = usePatientById(() => route.params.id as string)
  const { treatmentPlans, loading: treatmentPlansLoading } = usePatientTreatmentPlans(() => route.params.id as string)

  // Fetch documents filtered by selected plan and document type (frontend filter)
  const { data: documents, isLoading: documentsLoading } = useDocumentsList(
    () => route.params.id as string,
    () => (selectedPlanId.value === 'all' ? '' : selectedPlanId.value)
  )

  // Filter documents by document type (frontend only)
  const filteredDocuments = computed(() => {
    if (!documents.value) return []
    if (selectedDocumentType.value === 'all') return documents.value
    return documents.value.filter((doc) => doc.category === selectedDocumentType.value)
  })

  // Check if there are documents when filter is active
  const hasDocumentsWhenFiltered = computed(() => {
    if (!documents.value) return false
    if (selectedDocumentType.value === 'all') return documents.value.length > 0
    return documents.value.some((doc) => doc.category === selectedDocumentType.value)
  })

  // Reset document type filter when plan changes
  watch(selectedPlanId, () => {
    selectedDocumentType.value = 'all'
  })

  const isLoading = computed(() => patientLoading.value || treatmentPlansLoading.value || documentsLoading.value)

  function handleAddDocument() {
    if (!patient.value) return
    const planId = selectedPlanId.value === 'all' ? undefined : selectedPlanId.value
    documentCreateOverlay.open({
      patient: patient.value,
      treatmentPlanId: planId
    })
  }
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div v-if="patient" class="w-full">
        <PatientTreatmentPlanTabPlanSelector
          v-model:selected-plan-id="selectedPlanId"
          :patient-id="patient.id"
          show-all-option
          all-option-label="Tous les documents"
          all-option-description="Afficher tous les documents du patient"
        />
      </div>
      <div class="flex w-full flex-col gap-2 md:w-48 md:items-end">
        <UButton
          icon="i-hugeicons-plus-sign"
          label="Ajouter un document"
          color="primary"
          size="lg"
          block
          @click="handleAddDocument"
        />
        <div class="w-full">
          <USelect v-model="selectedDocumentType" :items="categoryFilter" :icon="icon" size="lg" class="w-full" />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
    </div>

    <div
      v-else-if="filteredDocuments && filteredDocuments.length > 0"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
  </div>
</template>
