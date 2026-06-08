<script setup lang="ts">
  import type { RadioGroupItem } from '@nuxt/ui'
  import { LazyDocumentCreateSlideover } from '#components'

  const route = useRoute()

  const overlay = useOverlay()
  const documentCreateOverlay = overlay.create(LazyDocumentCreateSlideover)

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

  const { data: patient, isLoading: patientLoading } = usePatientById(() => route.params.id as string)
  const { treatmentPlans, loading: treatmentPlansLoading } = usePatientTreatmentPlans(() => route.params.id as string)

  const { data: documents, isLoading: documentsLoading } = useDocumentsList(
    () => route.params.id as string,
    () => (selectedPlanId.value === 'all' ? '' : selectedPlanId.value)
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
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
    <div class="lg:col-span-1">
      <AppCard title="Filtres des documents" description="Affinez les documents par type et plan de traitement.">
        <template v-if="patient">
          <TreatmentPlanSelector
            v-model:selected-plan-id="selectedPlanId"
            :patient-id="patient.id"
            show-all-option
            all-option-label="Tous les documents"
            all-option-description="Afficher tous les documents du patient"
            class="min-h-18 rounded-lg ring"
          />
        </template>

        <h3 class="text-muted mt-4 text-sm font-medium lg:hidden">Type de document</h3>
        <USelect
          v-model="selectedDocumentType"
          :items="categorySelectItems"
          :icon="icon"
          placeholder="Tous les types"
          class="mt-2 w-full lg:hidden"
        />
        <URadioGroup
          v-model="selectedDocumentType"
          color="primary"
          variant="table"
          size="sm"
          :default-value="'all'"
          :items="categoryFilterItems"
          :ui="{
            root: 'mt-4 hidden lg:block',
            item: 'p-2 first-of-type:rounded-t-md first-of-type:rounded-t-md '
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
