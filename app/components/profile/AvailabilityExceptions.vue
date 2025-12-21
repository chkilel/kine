<script setup lang="ts">
  import { LazyProfileAvailabilityExceptionSlideover } from '#components'

  // Composables
  const { exceptions, loading, error, fetchExceptions, deleteException } = useAvailabilityExceptions()

  // Create overlay instance
  const overlay = useOverlay()
  const exceptionOverlay = overlay.create(LazyProfileAvailabilityExceptionSlideover)

  // Handle delete with confirmation
  const handleDeleteException = async (exception: any) => {
    const date = exception.date instanceof Date ? exception.date : new Date(exception.date)
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette exception du ${date.toLocaleDateString()}?`)
    if (confirmed) deleteException(exception.id)
  }
</script>

<template>
  <AppCard
    title="Exceptions et Absences"
    description="Gérer les congés ou changements ponctuels."
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #actions>
      <UButton icon="i-lucide-plus" variant="soft" @click="exceptionOverlay.open()">Ajouter une exception</UButton>
    </template>
    <div class="divide-default divide-y">
      <!-- Loading state -->
      <div v-if="loading" class="space-y-3 p-5">
        <USkeleton class="h-20 w-full" v-for="i in 3" :key="i" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-5">
        <UAlert color="error" title="Erreur de chargement" :description="String(error)">
          <template #actions>
            <UButton @click="fetchExceptions()" size="xs" variant="outline">Réessayer</UButton>
          </template>
        </UAlert>
      </div>

      <!-- Empty state -->
      <div v-else-if="exceptions.length === 0" class="p-5 text-center">
        <UIcon name="i-lucide-calendar-off" class="text-muted mb-3 text-4xl" />
        <p class="text-muted">Aucune exception de disponibilité</p>
        <UButton @click="exceptionOverlay.open()" class="mt-3" size="sm">Ajouter une exception</UButton>
      </div>

      <!-- Exceptions list -->
      <div v-else v-for="exception in exceptions" :key="exception.id" class="group hover:bg-elevated transition-colors">
        <div class="flex items-center justify-between p-5">
          <!-- Exception Info -->
          <div class="flex items-center gap-4">
            <div class="space-y-1">
              <p class="font-medium">{{ formatDate(exception.date) }}</p>
              <div v-if="exception.startTime && exception.endTime" class="text-muted text-sm">
                {{ formatTimeWithoutSeconds(exception.startTime) }} - {{ formatTimeWithoutSeconds(exception.endTime) }}
              </div>
            </div>

            <!-- Exception Type Badge -->
            <div v-if="exception.reason">
              <UBadge
                :label="getExceptionTypeLabel(exception.reason)"
                :color="getExceptionTypeColor(exception.reason)"
                :variant="'subtle'"
                :icon="getExceptionTypeIcon(exception.reason)"
                size="sm"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <UButton
              icon="i-lucide-pencil-line"
              size="md"
              color="primary"
              variant="ghost"
              @click="exceptionOverlay.open({ availabilityException: exception })"
            />
            <UButton
              icon="i-lucide-trash"
              size="md"
              color="error"
              variant="ghost"
              @click="handleDeleteException(exception)"
            />
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>
