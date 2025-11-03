<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  const selectedTreatmentPlan = ref('all')
  const selectedDocumentType = ref('Type de document')
  const dateFilter = ref({
    start: null,
    end: null
  })

  const df = new DateFormatter('fr-FR', {
    dateStyle: 'medium'
  })

  const documents = [
    {
      id: 1,
      title: 'Ordonnance médecin traitant',
      date: '10 Oct. 2024',
      author: 'Dr. Martin',
      description: 'Prescription initiale pour 10 séances de rééducation du genou.',
      icon: 'i-lucide-file-text',
      iconBg: 'bg-primary/10 text-primary'
    },
    {
      id: 2,
      title: 'Radio du genou droit',
      date: '02 Oct. 2024',
      author: 'Jean Dupont',
      description: 'Radiographie de contrôle post-opératoire.',
      icon: 'i-lucide-image',
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300'
    },
    {
      id: 3,
      title: 'Compte-rendu opératoire',
      date: '18 Sept. 2024',
      author: 'Hôpital Central',
      description: "Résultats de l'intervention chirurgicale.",
      icon: 'i-lucide-file-text',
      iconBg: 'bg-success/10 text-success'
    },
    {
      id: 4,
      title: 'Protocole exercices maison',
      date: '15 Sept. 2024',
      author: 'Dr. Martin',
      description: "Fiche d'exercices à réaliser entre les séances.",
      icon: 'i-lucide-paperclip',
      iconBg: 'bg-muted text-muted-foreground'
    }
  ]
</script>

<template>
  <div class="mt-6">
    <!-- Filter Section -->
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

    <!-- Documents Grid -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="document in documents" :key="document.id">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div :class="`${document.iconBg} flex size-10 items-center justify-center rounded-full`">
              <UIcon :name="document.icon" class="text-xl" />
            </div>
            <div>
              <h3 class="text-default text-sm font-bold">{{ document.title }}</h3>
              <p class="text-muted text-xs">{{ document.date }} - {{ document.author }}</p>
            </div>
          </div>
        </div>
        <div class="mt-3 mb-4 grow">
          <p class="text-toned text-sm">{{ document.description }}</p>
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
  </div>
</template>
