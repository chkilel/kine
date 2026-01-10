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
      <UCard v-for="document in documents" :key="document.id">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
              <UIcon :name="getDocumentIcon(document.category)" class="text-xl" />
            </div>
            <div>
              <h3 class="text-default text-sm font-bold">{{ document.originalFileName }}</h3>
              <p class="text-muted text-xs">{{ formatFrenchDate(document.createdAt) }}</p>
            </div>
          </div>
        </div>
        <div class="mt-3 mb-4 grow">
          <p class="text-toned text-sm">{{ document.description || 'Aucune description' }}</p>
        </div>
        <template #footer>
          <div class="border-default flex items-center justify-end gap-2">
            <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-eye" square />
            <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-download" square />
            <UButton variant="ghost" color="error" size="sm" icon="i-lucide-trash-2" square />
          </div>
        </template>
      </UCard>
    </div>

    <div v-else class="py-8 text-center">
      <UIcon name="i-lucide-file-text" class="text-muted-foreground mb-4 text-4xl" />
      <h3 class="mb-2 text-lg font-medium">Aucun document</h3>
      <p class="text-muted-foreground">Aucun document n'a encore été téléversé pour ce patient.</p>
    </div>
  </div>
</template>
