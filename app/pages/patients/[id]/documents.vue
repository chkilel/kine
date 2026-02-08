<script setup lang="ts">
  const route = useRoute()

  const selectedTreatmentPlan = ref('all')
  const selectedDocumentType = ref('Type de document')

  const { data: documents, isLoading } = useDocumentsList(() => route.params.id as string)
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div class="flex flex-1 flex-col gap-4 lg:flex-row">
        <div class="lg:w-md">
          <USelect
            v-model="selectedTreatmentPlan"
            placeholder="Sélectionner un Plan de Traitement"
            :items="[
              { value: 'all', label: 'Sélectionner un Plan de Traitement' },
              { value: 'plan1', label: 'Rééducation du genou droit (Post-opératoire) - Actif' },
              { value: 'plan2', label: 'Rééducation de l\'épaule gauche (Tendinite) - Actif' },
              { value: 'plan3', label: 'Lombalgie chronique - Archivé' }
            ]"
            size="lg"
            class="w-full"
          />
        </div>
        <div class="flex flex-1 flex-col gap-4 sm:flex-row">
          <div class="w-full sm:w-48">
            <USelect
              v-model="selectedDocumentType"
              :items="['Type de document', 'Prescription', 'Image', 'Résultat', 'Autre']"
              size="lg"
              class="w-full"
            />
          </div>
        </div>
      </div>
      <UButton color="primary" size="lg" class="flex w-full items-center gap-2 whitespace-nowrap md:w-auto">
        <UIcon name="i-lucide-plus" />
        <span>Ajouter un document</span>
      </UButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
    </div>

    <div v-else-if="documents && documents.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <DocumentCard
        v-for="document in documents"
        :key="document.id"
        :document="document"
        :patient-id="route.params.id as string"
        variant="extended"
      />
    </div>

    <div v-else class="py-8 text-center">
      <UIcon name="i-lucide-file-text" class="text-muted-foreground mb-4 text-4xl" />
      <h3 class="mb-2 text-lg font-medium">Aucun document</h3>
      <p class="text-muted-foreground">Aucun document n'a encore été téléversé pour ce patient.</p>
    </div>
  </div>
</template>
