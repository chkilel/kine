<script setup lang="ts">
  import { LazyProfileAvailabilityExceptionSlideover } from '#components'

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
  const toast = useToast()
  const overlay = useOverlay()

  // Create overlay instance
  const exceptionOverlay = overlay.create(LazyProfileAvailabilityExceptionSlideover)

  function deleteException(exception: AvailabilityException) {
    toast.add({
      title: 'Succès',
      description: 'Exception supprimée',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  }

  function editException(exception: AvailabilityException) {
    exceptionOverlay.open({ availabilityException: exception })
  }

  function addException() {
    exceptionOverlay.open()
  }
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-default text-lg font-bold">Exceptions et Absences</h2>
          <p class="text-muted mt-1 text-sm">Gérer les congés ou changements ponctuels.</p>
        </div>
        <UButton icon="i-lucide-plus" variant="soft" @click="addException()">Ajouter une exception</UButton>
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
            @click="editException(exception)"
          />
          <UButton icon="i-lucide-trash" size="md" color="error" variant="ghost" @click="deleteException(exception)" />
        </div>
      </div>
    </div>
  </UCard>
</template>
