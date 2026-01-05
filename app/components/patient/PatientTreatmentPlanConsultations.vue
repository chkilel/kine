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

    const deleteConsultationFromComposable = useDeleteConsultation()
    await deleteConsultationFromComposable.mutateAsync({
      patientId: props.patient.id,
      consultationId
    })
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
    <ul v-if="consultations.length > 0" class="space-y-2.5">
      <li
        v-for="consultation in consultations"
        :key="consultation.id"
        class="group bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border border-transparent p-3 transition-colors"
      >
        <div class="flex">
          <AppDateBadge :date="consultation.date" variant="solid" color="info" class="rounded-r-none" />
          <AppTimeBadge
            :date="consultation.date"
            :time="consultation.startTime"
            color="info"
            variant="soft"
            class="rounded-l-none"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-default truncate font-semibold">
            {{ getConsultationTypeLabel(consultation.type || 'follow_up') }}
          </p>

          <div class="text-muted sm:divide-default flex flex-col items-center text-xs sm:flex-row sm:divide-x">
            <div class="flex items-center gap-1 pr-3">
              <UIcon :name="getLocationIcon(consultation.location || 'clinic')" />
            </div>

            <div class="flex items-center gap-1 px-3">
              <UIcon name="i-hugeicons-clock-01" />
              <p>{{ consultation.duration }} min</p>
            </div>

            <div class="flex items-center gap-1 px-3">
              <UIcon name="i-hugeicons-location-05" />
              <p>Salle 1</p>
            </div>
          </div>
        </div>
        <div class="flex pl-4">
          <div class="flex items-center gap-2">
            <UBadge :color="getConsultationStatusColor(consultation.status)" variant="subtle">
              {{ getConsultationStatusLabel(consultation.status) }}
            </UBadge>
          </div>
          <div class="border-muted ml-2 flex items-center gap-1 border-l pl-2">
            <div class="flex items-center justify-end gap-2">
              <UButton
                icon="i-lucide-edit"
                variant="ghost"
                color="neutral"
                size="sm"
                square
                @click="editConsultation(consultation.id)"
              />
              <UButton
                icon="i-lucide-trash"
                variant="ghost"
                color="error"
                size="sm"
                square
                @click="deleteConsultation(consultation.id)"
              />
            </div>
          </div>
        </div>
      </li>
    </ul>
    <UEmpty
      v-else
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
  </AppCard>
</template>
