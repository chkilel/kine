<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()
  // Function to open edit slideover - will be passed from parent
  const emit = defineEmits<{
    'edit-plan': []
    'create-new': []
  }>()

  const toast = useToast()

  // Close treatment plan function
  const closeTreatmentPlan = () => {
    // TODO: Implement close treatment plan logic
    console.log('Close treatment plan')
    toast.add({
      title: 'Plan clôturé',
      description: 'Le plan de traitement a été clôturé.',
      color: 'success'
    })
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Treatment Plan Card -->
    <UCard>
      <div class="mb-4 flex items-start justify-between">
        <h2 class="text-lg font-bold">{{ props.treatmentPlan.title }}</h2>
        <UBadge :color="getTreatmentPlanStatusColor(props.treatmentPlan.status)" variant="soft" class="rounded-full">
          {{ getTreatmentPlanStatusLabel(props.treatmentPlan.status) }}
        </UBadge>
      </div>
      <div class="text-muted space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="text-toned" />
          <span>
            Début: {{ formatFrenchDate(props.treatmentPlan.startDate) }} - Fin:
            {{ props.treatmentPlan.endDate ? formatFrenchDate(props.treatmentPlan.endDate) : 'Non définie' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="text-toned" />
          <span>Thérapeute: {{ getTherapistName(props.treatmentPlan.therapist) }}</span>
        </div>
      </div>
      <div class="mt-5">
        <div class="text-muted mb-1 flex items-center justify-between text-sm">
          <span>
            Progression ({{ props.treatmentPlan.completedConsultations || 0 }}/{{
              props.treatmentPlan.numberOfSessions || 0
            }}
            séances)
          </span>
          <span>{{ props.treatmentPlan.progress || 0 }}%</span>
        </div>
        <UProgress :model-value="props.treatmentPlan.progress || 0" size="lg" />
      </div>
      <div class="mt-6 flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-edit"
          variant="outline"
          color="neutral"
          size="md"
          class="flex-1"
          @click="$emit('edit-plan')"
        >
          Modifier
        </UButton>
        <UButton
          icon="i-lucide-archive"
          variant="outline"
          color="neutral"
          size="md"
          class="flex-1"
          @click="closeTreatmentPlan"
        >
          Clôturer
        </UButton>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="md"
          class="flex-1 justify-center sm:justify-start"
          @click="$emit('create-new')"
        >
          Nouveau
        </UButton>
      </div>
    </UCard>

    <!-- Treatment Plan Details -->
    <UCard
      :ui="{
        body: 'p-0 sm:p-0'
      }"
    >
      <UCollapsible default-open>
        <UButton
          color="neutral"
          variant="ghost"
          class="group p-4 sm:p-6"
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          trailing-icon="i-lucide-chevron-down"
          block
        >
          <h3 class="text-base font-bold">Détails du plan</h3>
        </UButton>

        <template #content>
          <div class="border-default space-y-5 border-t p-4 sm:p-6">
            <div>
              <h4 class="mb-2 text-sm font-semibold">Objectifs thérapeutiques</h4>
              <p class="text-muted text-sm">{{ props.treatmentPlan.objective || 'Non spécifié' }}</p>
            </div>
            <div>
              <h4 class="mb-2 text-sm font-semibold">Diagnostic</h4>
              <p class="text-muted text-sm">{{ props.treatmentPlan.diagnosis || 'Non spécifié' }}</p>
            </div>
            <div v-if="props.treatmentPlan.painLevel">
              <h4 class="mb-2 text-sm font-semibold">Niveau de douleur (actuel)</h4>
              <div class="flex items-center gap-3">
                <USlider :model-value="props.treatmentPlan.painLevel" :max="10" :min="0" disabled />
                <span class="font-semibold">{{ props.treatmentPlan.painLevel }}/10</span>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <h4 class="font-semibold">Fréquence</h4>
                <p class="text-muted">{{ props.treatmentPlan.sessionFrequency || 0 }}x / semaine</p>
              </div>
              <div>
                <h4 class="font-semibold">Médecin prescripteur</h4>
                <p class="text-muted">{{ props.treatmentPlan.prescribingDoctor || 'Non spécifié' }}</p>
              </div>
              <div>
                <h4 class="font-semibold">Assurance</h4>
                <p class="text-muted">{{ props.treatmentPlan.insuranceInfo || 'Non spécifié' }}</p>
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>
    </UCard>

    <!-- Notes & Follow-up -->
    <UCard>
      <h3 class="mb-4! text-base font-bold">Notes &amp; Suivi</h3>
      <div class="space-y-4">
        <div class="border-default space-y-3 border-t pt-4">
          <div v-if="!(props.treatmentPlan.notes as any[])?.length" class="py-4 text-center">
            <p class="text-muted text-sm">Aucune note de suivi pour ce plan de traitement</p>
          </div>
          <div v-else v-for="(note, index) in (props.treatmentPlan.notes as any[]) || []" :key="index" class="text-sm">
            <p>
              <strong class="font-semibold">
                {{ note.date ? new Date(note.date).toLocaleDateString('fr-FR') : 'Date non spécifiée' }}:
              </strong>
              {{ note.content || '' }}
            </p>
            <p class="text-muted text-xs">{{ note.author || 'Auteur inconnu' }}</p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
