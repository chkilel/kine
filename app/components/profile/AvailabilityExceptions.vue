<script setup lang="ts">
  import { LazyProfileAvailabilityExceptionSlideover } from '#components'

  // Use availability exceptions composable
  const { exceptions, loading, error, fetchExceptions, deleteException } = useAvailabilityExceptions()

  const overlay = useOverlay()

  // Create overlay instance
  const exceptionOverlay = overlay.create(LazyProfileAvailabilityExceptionSlideover)

  // Load data on mount
  onMounted(async () => {
    await fetchExceptions()
  })

  // Handle delete with confirmation
  const handleDeleteException = async (exception: any) => {
    const date = exception.date instanceof Date ? exception.date : new Date(exception.date)
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette exception du ${date.toLocaleDateString()}?`)
    if (confirmed) {
      deleteException(exception.id)
    }
  }

  function editException(exception: any) {
    exceptionOverlay.open({ availabilityException: exception })
  }

  function addException() {
    exceptionOverlay.open()
  }

  // Helper functions for exception display
  function getExceptionTypeLabel(reason: string) {
    const labels = {
      vacation: 'Congé',
      holiday: 'Jour férié',
      sick: 'Maladie',
      training: 'Formation',
      meeting: 'Réunion',
      personal: 'Personnel',
      reduced_hours: 'Réduction horaire',
      other: 'Autre'
    }
    return labels[reason as keyof typeof labels] || reason
  }

  function getExceptionTypeColor(
    reason: string
  ): 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral' {
    const colors = {
      vacation: 'warning' as const,
      holiday: 'warning' as const,
      sick: 'error' as const,
      training: 'info' as const,
      meeting: 'info' as const,
      personal: 'error' as const,
      reduced_hours: 'info' as const,
      other: 'neutral' as const
    }
    return colors[reason as keyof typeof colors] || 'neutral'
  }

  function getExceptionTypeIcon(reason: string) {
    const icons = {
      vacation: 'i-lucide-luggage',
      holiday: 'i-lucide-home',
      sick: 'i-lucide-heart-pulse',
      training: 'i-lucide-graduation-cap',
      meeting: 'i-lucide-users',
      personal: 'i-lucide-user',
      reduced_hours: 'i-lucide-clock',
      other: 'i-lucide-more-horizontal'
    }
    return icons[reason as keyof typeof icons] || 'i-lucide-circle'
  }

  function formatDate(date: Date | string) {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR')
  }
</script>

<template>
  <AppCard
    title="Exceptions et Absences"
    description="Gérer les congés ou changements ponctuels."
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #actions>
      <UButton icon="i-lucide-plus" variant="soft" @click="addException()">Ajouter une exception</UButton>
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
        <UButton @click="addException()" class="mt-3" size="sm">Ajouter une exception</UButton>
      </div>

      <!-- Exceptions list -->
      <div v-else v-for="exception in exceptions" :key="exception.id" class="group hover:bg-elevated transition-colors">
        <div class="flex items-center justify-between p-5">
          <!-- Exception Info -->
          <div class="flex items-center gap-4">
            <div class="space-y-1">
              <p class="font-medium">{{ formatDate(exception.date) }}</p>
              <div v-if="exception.startTime && exception.endTime" class="text-muted text-sm">
                {{ exception.startTime }} - {{ exception.endTime }}
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
              @click="editException(exception)"
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
