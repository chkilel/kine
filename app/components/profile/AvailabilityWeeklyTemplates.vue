<script setup lang="ts">
  import { LazyProfileAvailabilityTemplateSlideover } from '#components'

  const emit = defineEmits<{
    edit: [template: WeeklyAvailabilityTemplate]
  }>()

  // Use availability templates composable
  const { templates, loading, error, fetchTemplates, deleteTemplate } = useAvailabilityTemplates()

  const toast = useToast()
  const overlay = useOverlay()

  // Create overlay instance
  const templateOverlay = overlay.create(LazyProfileAvailabilityTemplateSlideover)

  // Load data on mount
  onMounted(async () => {
    await fetchTemplates()
  })

  // Handle delete with confirmation
  const handleDeleteTemplate = async (template: any) => {
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer ce modèle le ${template.dayOfWeek}?`)
    if (confirmed) {
      deleteTemplate(template.id)
    }
  }

  function editTemplate(template: any) {
    templateOverlay.open({ template })
  }

  function addTemplate() {
    templateOverlay.open()
  }

  // Helper functions for location display
  function getLocationIcon(location: string) {
    const icons = {
      clinic: 'i-lucide-building',
      home: 'i-lucide-home',
      telehealth: 'i-lucide-video'
    }
    return icons[location as keyof typeof icons] || 'i-lucide-map-pin'
  }

  function getLocationLabel(location: string) {
    const labels = {
      clinic: 'Cabinet',
      home: 'Domicile',
      telehealth: 'Téléconsultation'
    }
    return labels[location as keyof typeof labels] || location
  }
</script>

<template>
  <AppCard
    title="Modèles de disponibilité hebdomadaire"
    description="Horaires récurrents pour ce praticien."
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #actions>
      <UButton icon="i-lucide-plus" variant="soft" @click="addTemplate()">Ajouter une plage</UButton>
    </template>

    <div class="divide-default divide-y">
      <!-- Loading state -->
      <div v-if="loading" class="space-y-3 p-5">
        <USkeleton class="h-16 w-full" v-for="i in 3" :key="i" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-5">
        <UAlert color="error" title="Erreur de chargement" :description="String(error)">
          <template #actions>
            <UButton @click="fetchTemplates()" size="xs" variant="outline">Réessayer</UButton>
          </template>
        </UAlert>
      </div>

      <!-- Empty state -->
      <div v-else-if="templates.length === 0" class="p-5 text-center">
        <UIcon name="i-lucide-calendar-x" class="text-muted mb-3 text-4xl" />
        <p class="text-muted">Aucun modèle de disponibilité</p>
        <UButton @click="addTemplate()" class="mt-3" size="sm">Ajouter un modèle</UButton>
      </div>

      <!-- Templates list -->
      <div
        v-else
        v-for="template in templates"
        :key="template.id"
        class="group hover:bg-elevated flex items-center justify-between gap-4 p-5 transition-colors"
      >
        <div class="flex w-full gap-5">
          <div class="flex items-center gap-2">
            <UBadge :label="template.dayOfWeek" color="primary" variant="subtle" />
            <div class="space-y-1">
              <p class="text-default text-sm font-medium">{{ template.startTime }} - {{ template.endTime }}</p>
              <div class="text-muted flex items-center gap-1.5 text-xs">
                <UIcon :name="getLocationIcon(template.location)" class="text-[14px]" />
                <p>{{ getLocationLabel(template.location) }}</p>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end justify-between gap-3">
            <p class="text-muted flex items-center gap-1.5 text-sm">
              <UIcon name="i-lucide-users" class="text-[16px]" />
              {{ template.maxSessions }} {{ template.maxSessions === 1 ? 'patient max' : 'patients simultanés' }}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <UButton
            icon="i-lucide-pencil-line"
            size="md"
            color="primary"
            variant="ghost"
            @click="editTemplate(template)"
          />
          <UButton
            icon="i-lucide-trash"
            size="md"
            color="error"
            variant="ghost"
            @click="handleDeleteTemplate(template)"
          />
        </div>
      </div>
    </div>
  </AppCard>
</template>
