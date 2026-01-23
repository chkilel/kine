<script setup lang="ts">
  const props = defineProps<{ activePlanningTab: string; patientId: string }>()

  const deleteConsultationMutation = useDeleteConsultation()
  const { data: consultationsData } = useConsultationsList(() => ({ patientId: props.patientId }))

  const deleteConsultation = async (consultationId: string) => {
    await deleteConsultationMutation.mutateAsync({
      consultationId
    })
  }
  const selectedConsultations = ref<string[]>([])

  const toggleConsultationSelection = (consultationId: string) => {
    const index = selectedConsultations.value.indexOf(consultationId)
    if (index > -1) {
      selectedConsultations.value.splice(index, 1)
    } else {
      selectedConsultations.value.push(consultationId)
    }
  }

  const postponeConsultation = () => {}
  const changeStatusConsultation = () => {}
  const handleDeleteConsultation = async () => {}
</script>

<template>
  <AppCard title="Gestion des Séances" icon="i-lucide-list" iconColor="info">
    <div v-if="consultationsData && consultationsData.length > 0" class="space-y-3">
      <ul class="space-y-2">
        <li
          v-for="consultation in consultationsData"
          :key="consultation.id"
          class="bg-muted hover:bg-elevated flex items-center justify-between rounded-lg p-2.5 py-2"
        >
          <div class="flex flex-1 items-center justify-between">
            <div class="flex items-center gap-4">
              <AppDateBadge :date="consultation.date" color="neutral" variant="subtle" class="bg-default" />
              <div>
                <div class="flex items-center gap-2">
                  <UIcon
                    v-if="consultation.location"
                    :name="getLocationIcon(consultation.location)"
                    class="text-muted"
                    :class="getLocationColor(consultation.location)"
                  />
                  <p class="font-semibold">
                    {{ removeSecondsFromTime(consultation.startTime) }} -
                    {{ removeSecondsFromTime(addMinutesToTime(consultation.startTime, consultation.duration)) }}
                  </p>
                </div>
                <div class="text-muted text-xs">
                  {{ getConsultationTypeLabel(consultation.type || 'follow_up') }} · {{ consultation.duration }} min
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="getConsultationStatusColor(consultation.status)"
                variant="soft"
                size="md"
                class="rounded-full"
              >
                {{ getConsultationStatusLabel(consultation.status) }}
              </UBadge>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <USeparator orientation="vertical" class="h-8 pl-4" />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              square
              @click="deleteConsultation(consultation.id)"
            />
          </div>
        </li>
      </ul>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-calendar-x"
      title="Aucune séance planifiée"
      description="Aucune consultation n'a été planifiée pour ce patient."
    />
    <div class="border-border bg-muted/50 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div class="text-muted-foreground text-sm font-medium">
        <span class="text-foreground font-bold">{{ selectedConsultations.length }}</span>
        séances sélectionnées
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-skip-forward"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="selectedConsultations.length === 0"
          @click="postponeConsultation"
        >
          Reporter
        </UButton>
        <UButton
          icon="i-lucide-check-square"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="selectedConsultations.length === 0"
          @click="changeStatusConsultation"
        >
          Changer statut
        </UButton>
        <UButton
          icon="i-lucide-trash"
          variant="outline"
          color="error"
          size="sm"
          :disabled="selectedConsultations.length === 0"
          @click="handleDeleteConsultation"
        >
          Supprimer
        </UButton>
      </div>
    </div>
  </AppCard>
</template>
