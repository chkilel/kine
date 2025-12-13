<script setup lang="ts">
  import { LazyProfileAvailabilityTemplateSlideover } from '#components'

  const emit = defineEmits<{
    edit: [template: WeeklyAvailabilityTemplate]
  }>()

  // Availability Management State
  const templates = ref<WeeklyAvailabilityTemplate[]>([
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

  const toast = useToast()
  const overlay = useOverlay()

  // Create overlay instance
  const templateOverlay = overlay.create(LazyProfileAvailabilityTemplateSlideover)

  function deleteTemplate(template: WeeklyAvailabilityTemplate) {
    toast.add({
      title: 'Succès',
      description: 'Modèle de disponibilité supprimé',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  }

  function editTemplate(template: WeeklyAvailabilityTemplate) {
    templateOverlay.open({ template })
  }

  function addTemplate() {
    templateOverlay.open()
  }
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-default text-lg font-bold">Modèles de disponibilité hebdomadaire</h2>
          <p class="text-muted mt-1 text-sm">Horaires récurrents pour ce praticien.</p>
        </div>
        <UButton icon="i-lucide-plus" variant="soft" @click="addTemplate()">Ajouter une plage</UButton>
      </div>
    </template>

    <div class="divide-default divide-y">
      <div
        v-for="template in templates"
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
            @click="editTemplate(template)"
          />
          <UButton icon="i-lucide-trash" size="md" color="error" variant="ghost" @click="deleteTemplate(template)" />
        </div>
      </div>
    </div>
  </UCard>
</template>
