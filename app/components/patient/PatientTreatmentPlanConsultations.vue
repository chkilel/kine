<script setup lang="ts">
  import { LazyConsultationPlanningSlideover } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const toast = useToast()
  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyConsultationPlanningSlideover)
  const { fetchTreatmentPlanConsultations, deleteConsultation: deleteConsultationFromComposable } = useConsultations()

  // Consultations data
  const consultations = ref<any[]>([])
  const consultationsLoading = ref(false)
  const consultationsError = ref<any>(null)

  // Fetch consultations for active treatment plan
  const fetchConsultations = async () => {
    const planId = props.treatmentPlan?.id
    if (!planId) return

    consultationsLoading.value = true
    consultationsError.value = null

    try {
      const result = await fetchTreatmentPlanConsultations(planId)
      consultations.value = result.consultations
    } catch (error) {
      consultationsError.value = error
    } finally {
      consultationsLoading.value = false
    }
  }

  // Watch for treatment plan changes and fetch consultations
  watch(
    () => props.treatmentPlan,
    () => {
      fetchConsultations()
    },
    { immediate: true }
  )

  // Refresh consultations data
  const refreshConsultations = async () => {
    await fetchConsultations()
    toast.add({
      title: 'Consultations actualisées',
      description: 'Les consultations ont été rechargées avec succès.',
      color: 'success'
    })
  }

  // Delete consultation function
  const deleteConsultation = async (consultationId: string) => {
    if (!props.patient) return

    const success = await deleteConsultationFromComposable(props.patient.id, consultationId)

    if (success) {
      await fetchConsultations()
    }
  }

  // Edit consultation function - opens planning slideover with consultation data
  const editConsultation = (consultationId: string) => {
    // TODO: Implement edit consultation logic
    console.log('Edit consultation:', consultationId)
  }

  // Function to open session planning with event handlers
  function openSessionPlanning() {
    sessionPlanningOverlay.open({
      patient: props.patient as any,
      treatmentPlan: props.treatmentPlan
    })
  }
</script>

<template>
  <UCard>
    <div class="mb-5 flex items-center justify-between">
      <h3 class="text-base font-bold">Aperçu des séances</h3>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          color="neutral"
          size="sm"
          :loading="consultationsLoading"
          @click="refreshConsultations"
        >
          Actualiser
        </UButton>
        <UButton icon="i-lucide-calendar-plus" color="primary" size="sm" @click="openSessionPlanning">
          Planifier les séances
        </UButton>
      </div>
    </div>
    <div class="overflow-x-auto">
      <UTable
        :data="consultations"
        :loading="consultationsLoading"
        :columns="[
          { accessorKey: 'date', header: 'Date & Heure' },
          { accessorKey: 'type', header: 'Type' },
          { accessorKey: 'duration', header: 'Durée' },
          { accessorKey: 'location', header: 'Lieu' },
          { accessorKey: 'status', header: 'Statut' },
          { id: 'actions', header: 'Actions' }
        ]"
        :ui="{
          thead: 'bg-muted'
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
              {{ getConsultationTypeLabel(row.original.type) }}
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
            {{ getConsultationLocationLabel(row.original.location) }}
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getSessionStatusColor(row.original.status)" variant="soft" size="xs">
            {{ getSessionStatusLabel(row.original.status) }}
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
            :ui="{
              body: 'max-w-none'
            }"
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
  </UCard>
</template>
