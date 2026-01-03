<script setup lang="ts">
  import { LazyProfileAvailabilityTemplateSlideover } from '#components'

  // Get current user from auth
  const { user: therapist } = await useAuth()

  // Use availability templates composables with current user's ID
  const {
    data: templates,
    isLoading,
    error,
    refetch: fetchTemplates
  } = useAvailabilityTemplatesList(() => therapist.value?.id)
  const deleteTemplate = useDeleteAvailabilityTemplate()

  const loading = isLoading

  const overlay = useOverlay()

  // Create overlay instance
  const templateOverlay = overlay.create(LazyProfileAvailabilityTemplateSlideover)

  // Handle delete with confirmation
  const handleDeleteTemplate = async (template: any) => {
    const dayLabel = getPreferredDayLabel(template.dayOfWeek)
    // TODO confirmation modal
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer ce modèle du ${dayLabel}?`)
    if (confirmed) {
      deleteTemplate.mutate(template.id)
    }
  }
</script>

<template>
  <AppCard
    title="Modèles de disponibilité hebdomadaire"
    description="Horaires récurrents pour ce praticien."
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #actions>
      <UButton icon="i-lucide-plus" variant="soft" @click="templateOverlay.open()">Ajouter une plage</UButton>
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
      <div v-else-if="templates?.length === 0" class="p-5 text-center">
        <UIcon name="i-lucide-calendar-x" class="text-muted mb-3 text-4xl" />
        <p class="text-muted">Aucun modèle de disponibilité</p>
        <UButton @click="templateOverlay.open()" class="mt-3" size="sm">Ajouter un modèle</UButton>
      </div>

      <!-- Templates list -->
      <div
        v-else
        v-for="template in templates"
        :key="template.id"
        class="group hover:bg-elevated flex items-center justify-between gap-4 px-4 py-3 transition-colors sm:px-6"
      >
        <div class="flex w-full gap-5">
          <div class="flex items-center gap-4">
            <div
              class="bg-muted border-accented flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border"
            >
              <span class="text-highlighted mb-0.5 text-[10px] font-bold uppercase">
                {{ getDayAbbreviation(template.dayOfWeek) }}
              </span>
              <UIcon name="i-lucide-calendar" class="text-primary text-xl" />
            </div>
            <div class="space-y-1.5">
              <div class="text-highlighted text-md font-semibold">
                {{ removeSecondsFromTime(template.startTime) }} - {{ removeSecondsFromTime(template.endTime) }}
              </div>
              <UBadge
                :icon="getLocationIcon(template.location)"
                :color="getLocationColor(template.location)"
                size="sm"
                variant="subtle"
                class="rounded-full font-semibold uppercase"
              >
                {{ getLocationLabel(template.location) }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <UButton
            icon="i-lucide-pencil-line"
            size="md"
            color="primary"
            variant="ghost"
            @click="templateOverlay.open({ template })"
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
