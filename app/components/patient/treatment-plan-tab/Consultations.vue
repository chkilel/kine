<script setup lang="ts">
  import { LazyConsultationPlanningSlideover, LazyAppModalConfirm } from '#components'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const toast = useToast()
  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyConsultationPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  // Fetching/mutating data
  const {
    data: consultations,
    isLoading,
    refetch
  } = useConsultationsList(() => ({
    patientId: props.patient.id,
    treatmentPlanId: props.treatmentPlan.id
  }))

  const { mutate: deleteConsultation } = useDeleteConsultation()

  // Tab state
  const activeTab = ref<'upcoming' | 'finished'>('upcoming')

  // Filter consultations by status
  const upcomingStatuses: ConsultationStatus[] = ['confirmed', 'scheduled', 'in_progress']
  const finishedStatuses: ConsultationStatus[] = ['completed', 'cancelled', 'no_show']

  const upcomingConsultations = computed(
    () => consultations.value?.filter((c) => upcomingStatuses.includes(c.status)) || []
  )

  const finishedConsultations = computed(
    () => consultations.value?.filter((c) => finishedStatuses.includes(c.status)) || []
  )

  const tabs = computed(() => [
    {
      label: 'À venir',
      value: 'upcoming',
      slot: 'upcoming',
      icon: 'i-hugeicons-calendar-03',
      badge: upcomingConsultations.value.length
    },
    {
      label: 'Terminées / Annulées',
      value: 'finished',
      slot: 'finished',
      icon: 'i-hugeicons-checkmark-circle-02',
      badge: finishedConsultations.value.length
    }
  ])

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
  async function handleDeleteConsultation(consultation: Consultation) {
    const confirmed = await confirmModal.open({
      title: 'Supprimer la consultation',
      message: `Êtes-vous sûr de vouloir supprimer cette consultation du ${formatFrenchDate(consultation.date)} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-alert-02'
    })

    if (confirmed) {
      deleteConsultation({
        consultationId: consultation.id
      })
    }
  }

  // Edit consultation function - opens planning slideover with consultation data
  const editConsultation = (consultation: Consultation) => {
    sessionPlanningOverlay.open({
      patient: props.patient,
      treatmentPlan: props.treatmentPlan,
      consultation: consultation
    })
  }

  // Function to open session planning with event handlers
  function openConsultationPlanning() {
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
          icon="i-hugeicons-reload"
          variant="outline"
          color="neutral"
          size="sm"
          :loading="isLoading"
          @click="refreshConsultations"
        />
        <UButton
          icon="i-hugeicons-calendar-add-01"
          color="primary"
          size="sm"
          label="Planifier les séances"
          @click="openConsultationPlanning"
        />
      </div>
    </template>
    <ClientOnly>
      <div v-if="consultations?.length && consultations?.length > 0" class="space-y-4">
        <UTabs v-model="activeTab" :items="tabs" variant="pill" class="w-full">
          <template #upcoming>
            <div class="mt-4 space-y-2.5">
              <ConsultationCard
                v-for="consultation in upcomingConsultations"
                :key="consultation.id"
                :consultation
                @edit="editConsultation($event)"
                @delete="handleDeleteConsultation($event)"
              />
            </div>
          </template>
          <template #finished>
            <div class="mt-4 space-y-2.5">
              <ConsultationCard
                v-for="consultation in finishedConsultations"
                :key="consultation.id"
                :consultation
                @edit="editConsultation($event)"
                @delete="handleDeleteConsultation($event)"
              />
            </div>
          </template>
        </UTabs>
      </div>
      <UEmpty
        v-else
        variant="naked"
        icon="i-hugeicons-calendar-remove-01"
        title="Aucune séance planifiée pour ce plan de traitement."
        description="Commencez à planifier les séances pour ce patient afin de débuter le suivi."
        :ui="{ body: 'max-w-none' }"
        :actions="[
          {
            icon: 'i-hugeicons-add-circle',
            label: 'Planifier les séances du plan',
            size: 'md',
            onClick: openConsultationPlanning
          },
          {
            icon: 'i-hugeicons-add-01',
            label: 'Créer une consultation indépendante',
            color: 'neutral',
            size: 'md',
            variant: 'outline'
          }
        ]"
      />
      <template #fallback>
        <div class="flex justify-center py-8">
          <UIcon name="i-hugeicons-reload" class="animate-spin text-4xl" />
        </div>
      </template>
    </ClientOnly>
  </AppCard>
</template>
