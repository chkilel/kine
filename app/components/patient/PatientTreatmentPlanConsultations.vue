<script setup lang="ts">
  import { LazyConsultationPlanningSlideover } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const toast = useToast()
  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyConsultationPlanningSlideover)
  const { data, isLoading, refetch } = useTreatmentPlanConsultations(() => props.treatmentPlan.id)

  // Consultations data
  const consultations = computed(() => data.value?.data || [])

  // Refresh consultations data
  const refreshConsultations = async () => {
    await refetch()
    toast.add({
      title: 'Consultations actualisées',
      description: 'Les consultations ont été rechargées avec succès.',
      color: 'success'
    })
  }

  // Delete consultation function
  const deleteConsultation = async (consultationId: string) => {
    if (!props.patient) return

    const { deleteConsultation: deleteConsultationFromComposable } = useConsultations()
    await deleteConsultationFromComposable(props.patient.id, consultationId)
  }

  // Edit consultation function - opens planning slideover with consultation data
  const editConsultation = (consultationId: string) => {
    // TODO: Implement edit consultation logic
    console.log('Edit consultation:', consultationId)
  }

  // Function to open session planning with event handlers
  function openSessionPlanning() {
    sessionPlanningOverlay.open({
      patient: props.patient,
      treatmentPlan: props.treatmentPlan
    })
  }
</script>

<template>
  <AppCard title="Aperçu des séances">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          color="neutral"
          size="sm"
          :loading="isLoading"
          @click="refreshConsultations"
        >
          Actualiser
        </UButton>
        <UButton icon="i-lucide-calendar-plus" color="primary" size="sm" @click="openSessionPlanning">
          Planifier les séances
        </UButton>
      </div>
    </template>
    <div class="overflow-x-auto">
      <UTable
        :data="consultations"
        :loading="isLoading"
        :columns="[
          { accessorKey: 'date', header: 'Date & Heure' },
          { accessorKey: 'type', header: 'Type' },
          { accessorKey: 'duration', header: 'Durée' },
          { accessorKey: 'location', header: 'Lieu' },
          { accessorKey: 'status', header: 'Statut' },
          { id: 'actions', header: 'Actions' }
        ]"
        :ui="{
          td: 'bg-muted'
        }"
      >
        <template #date-cell="{ row }">
          <div>
            <div class="font-medium">
              {{
                new Date(row.original.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })
              }}
            </div>
            <div class="text-muted-foreground text-sm">{{ row.original.startTime || '' }}</div>
          </div>
        </template>

        <template #type-cell="{ row }">
          <div>
            <div class="font-medium">
              {{ row.original.type ? getConsultationTypeLabel(row.original.type) : '' }}
            </div>
            <div class="text-muted-foreground text-sm">{{ row.original.chiefComplaint || '' }}</div>
          </div>
        </template>

        <template #duration-cell="{ row }">
          <div class="text-sm">
            {{ row.original.duration ? `${row.original.duration} min` : '-' }}
          </div>
        </template>

        <template #location-cell="{ row }">
          <div class="text-sm">
            {{ row.original.location ? getLocationLabel(row.original.location) : '' }}
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getConsultationStatusColor(row.original.status)" variant="soft" size="xs">
            {{ getConsultationStatusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UButton
              icon="i-lucide-edit"
              variant="ghost"
              color="neutral"
              size="sm"
              square
              @click="editConsultation(row.original.id)"
            />
            <UButton
              icon="i-lucide-trash"
              variant="ghost"
              color="error"
              size="sm"
              square
              @click="deleteConsultation(row.original.id)"
            />
          </div>
        </template>

        <template #empty>
          <UEmpty
            variant="naked"
            icon="i-lucide-calendar-x"
            title="Aucune séance planifiée pour ce plan de traitement."
            description="Commencez à planifier les séances pour ce patient afin de débuter le suivi."
            :ui="{ body: 'max-w-none' }"
            :actions="[
              {
                icon: 'i-lucide-plus-circle',
                label: 'Planifier les séances du plan',
                size: 'md',
                onClick: openSessionPlanning
              },
              {
                icon: 'i-lucide-plus',
                label: 'Créer une consultation indépendante',
                color: 'neutral',
                size: 'md',
                variant: 'outline'
              }
            ]"
          />
        </template>
      </UTable>
    </div>
  </AppCard>
</template>
