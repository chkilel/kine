<script setup lang="ts">
  import { LazyProfileAvailabilityTemplateSlideover, LazyProfileAvailabilityExceptionSlideover } from '#components'

  const toast = useToast()
  const overlay = useOverlay()

  // Availability Management State
  const weeklyTemplates = ref<WeeklyAvailabilityTemplate[]>([
    {
      id: '1',
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '2',
      dayOfWeek: 'Mon',
      startTime: '14:00',
      endTime: '18:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '3',
      dayOfWeek: 'Tue',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '4',
      dayOfWeek: 'Wed',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '5',
      dayOfWeek: 'Thu',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '6',
      dayOfWeek: 'Fri',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    }
  ])

  const exceptions = ref<AvailabilityException[]>([
    {
      id: '1',
      date: '2024-12-25',
      isAvailable: false,
      reason: 'holiday'
    },
    {
      id: '2',
      date: '2024-12-31',
      startTime: '09:00',
      endTime: '12:00',
      isAvailable: true,
      reason: 'reduced_hours'
    }
  ])

  // Create overlay instances
  const templateOverlay = overlay.create(LazyProfileAvailabilityTemplateSlideover)
  const exceptionOverlay = overlay.create(LazyProfileAvailabilityExceptionSlideover)

  // Template management functions
  function deleteTemplate(template: WeeklyAvailabilityTemplate) {
    const index = weeklyTemplates.value.findIndex((t: WeeklyAvailabilityTemplate) => t.id === template.id)
    if (index !== -1) {
      weeklyTemplates.value.splice(index, 1)
      toast.add({
        title: 'Succès',
        description: 'Modèle de disponibilité supprimé',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }
  }

  // Exception management functions

  function deleteException(exception: AvailabilityException) {
    const index = exceptions.value.findIndex((e: AvailabilityException) => e.id === exception.id)
    if (index !== -1) {
      exceptions.value.splice(index, 1)
      toast.add({
        title: 'Succès',
        description: 'Exception supprimée',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }
  }
</script>

<template>
  <div class="mt-5 space-y-6">
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-default text-lg font-bold">Modèles de disponibilité hebdomadaire</h2>
            <p class="text-muted mt-1 text-sm">Horaires récurrents pour ce praticien.</p>
          </div>
          <UButton icon="i-lucide-plus" variant="soft" @click="templateOverlay.open()">Ajouter une plage</UButton>
        </div>
      </template>

      <div class="divide-default divide-y">
        <div
          v-for="template in weeklyTemplates"
          :key="template.id"
          class="group hover:bg-elevated flex items-center justify-between gap-4 p-5 transition-colors"
        >
          <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <!-- Day Indicator -->
            <div
              class="border-default bg-muted flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border"
            >
              <span class="text-muted mb-0.5 text-[10px] font-bold uppercase">
                {{ getDayAbbreviation(template.dayOfWeek) }}
              </span>
              <UIcon name="i-lucide-calendar" class="text-primary size-5" />
            </div>

            <!-- Template Details -->
            <div class="flex flex-col gap-1.5">
              <div class="text-default text-base font-bold">{{ template.startTime }} - {{ template.endTime }}</div>
              <div class="flex flex-wrap items-center gap-5">
                <UBadge
                  :color="getLocationColor(template.location)"
                  :variant="getLocationVariant(template.location)"
                  size="sm"
                  class="rounded-full font-bold tracking-wide uppercase"
                >
                  {{ getConsultationLocationLabel(template.location) }}
                </UBadge>
                <p class="text-muted flex items-center gap-1.5 text-sm">
                  <UIcon name="i-lucide-users" class="text-[16px]" />
                  {{ template.maxSessions }} {{ template.maxSessions === 1 ? 'patient max' : 'patients simultanés' }}
                </p>
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
            <UButton icon="i-lucide-trash" size="md" color="error" variant="ghost" @click="deleteTemplate(template)" />
          </div>
        </div>
      </div>
    </UCard>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-default text-lg font-bold">Exceptions et Absences</h2>
            <p class="text-muted mt-1 text-sm">Gérer les congés ou changements ponctuels.</p>
          </div>
          <UButton icon="i-lucide-plus" variant="soft" @click="exceptionOverlay.open()">Ajouter une exception</UButton>
        </div>
      </template>

      <div class="divide-default divide-y">
        <div
          v-for="exception in exceptions"
          :key="exception.id"
          class="group hover:bg-elevated flex items-center justify-between gap-4 p-5 transition-colors"
        >
          <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <!-- Date Indicator -->
            <div
              class="border-default bg-muted flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border"
            >
              <span class="text-toned text-[14px] font-bold">
                {{ new Date(exception.date).getDate() }}
              </span>
              <span class="text-dimmed text-[10px] font-bold uppercase">
                {{ new Date(exception.date).toLocaleDateString('fr-FR', { month: 'short' }) }}
              </span>
            </div>

            <!-- Exception Details -->
            <div class="flex flex-col gap-1.5">
              <div class="text-default text-base font-bold">
                <span v-if="exception.startTime && exception.endTime">
                  {{ exception.startTime }} - {{ exception.endTime }}
                </span>
                <span v-else>
                  {{
                    new Date(exception.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  }}
                  (Journée complète)
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-5">
                <UBadge
                  v-if="exception.reason"
                  :color="getExceptionTypeColor(exception.reason)?.color"
                  :variant="getExceptionTypeColor(exception.reason)?.variant"
                  size="sm"
                  class="rounded-full font-bold tracking-wide uppercase"
                >
                  {{ getExceptionTypeLabel(exception.reason) }}
                </UBadge>

                <div class="flex items-center gap-2">
                  <USwitch v-model="exception.isAvailable" />
                  <span class="text-muted text-sm">
                    {{ exception.isAvailable ? 'Disponible' : 'Indisponible' }}
                  </span>
                </div>
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
              @click="exceptionOverlay.open({ exception })"
            />
            <UButton
              icon="i-lucide-trash"
              size="md"
              color="error"
              variant="ghost"
              @click="deleteException(exception)"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
