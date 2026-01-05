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
  const { getTherapistName } = useOrganizationMembers()

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

    <AppCard :title="treatmentPlan.title">
      <template #actions>
        <UBadge :color="getTreatmentPlanStatusColor(treatmentPlan.status)" variant="soft" class="rounded-full">
          {{ getTreatmentPlanStatusLabel(treatmentPlan.status) }}
        </UBadge>
      </template>
      <div class="flex flex-col gap-5">
        <div class="space-y-1">
          <p class="text-primary text-sm font-medium">{{ treatmentPlan.diagnosis || 'Non spécifié' }}</p>
          <p class="text-muted mt-1 text-xs">Objectif principal : {{ treatmentPlan.objective || 'Non spécifié' }}</p>
        </div>
        <div class="border-default text-muted flex flex-col gap-2 border-t border-b py-3 text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-hugeicons-calendar-02" class="text-[16px]" />
              <span>
                {{ formatFrenchDate(treatmentPlan.startDate) }}
                {{ treatmentPlan.endDate ? ` - ${formatFrenchDate(treatmentPlan.endDate)}` : '' }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <UIcon name="i-hugeicons-user" class="size-4" />
              <span class="text-toned font-medium">
                {{ getTherapistName(treatmentPlan.therapistId) }}
              </span>
            </div>
          </div>
        </div>
        <div>
          <div class="mb-2 flex items-end justify-between">
            <span class="text-xs font-bold tracking-wide text-gray-700 uppercase dark:text-gray-300">Progression</span>
            <span class="text-primary text-sm font-bold">{{ treatmentPlan.progress || 0 }}%</span>
          </div>
          <UProgress :model-value="treatmentPlan.progress || 0" size="lg" />
          <div class="mt-1.5 flex justify-between text-[11px] font-medium text-gray-400">
            <span>
              {{ treatmentPlan.completedConsultations || 0 }} / {{ treatmentPlan.numberOfSessions || 0 }} séances
            </span>
            <span>
              Reste:
              {{ (treatmentPlan.numberOfSessions || 0) - (treatmentPlan.completedConsultations || 0) }}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <button
            class="hover:text-primary bg-muted hover:bg-elevated flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors"
            @click="$emit('edit-plan')"
          >
            <UIcon name="i-hugeicons-pencil-edit-02" class="text-[20px]" />
            <span class="text-[10px] font-bold">Modifier</span>
          </button>
          <button
            class="bg-muted hover:bg-elevated hover:text-error flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            @click="closeTreatmentPlan"
          >
            <UIcon name="i-hugeicons-archive" class="text-[20px]" />
            <span class="text-[10px] font-bold">Clôturer</span>
          </button>
          <button
            class="bg-primary-50 hover:bg-primary-100 text-primary flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors"
            @click="$emit('create-new')"
          >
            <UIcon name="i-hugeicons-plus-sign-square" class="text-[20px]" />
            <span class="text-[10px] font-bold">Nouveau</span>
          </button>
        </div>
      </div>
    </AppCard>

    <!-- Treatment Plan Details -->
    <UCard
      :ui="{
        body: 'p-0 sm:p-0'
      }"
    >
      <UCollapsible :default-open="false">
        <UButton
          color="neutral"
          variant="ghost"
          class="group p-4 sm:px-6 sm:py-4"
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          trailing-icon="i-lucide-chevron-down"
          block
        >
          <h3 class="text-base font-bold">Détails du plan</h3>
        </UButton>

        <template #content>
          <div class="border-default space-y-5 border-t p-4 sm:p-6">
            <div class="space-y-1">
              <h4 class="text-muted text-xs font-semibold uppercase">Objectifs thérapeutiques</h4>
              <p class="bg-muted border-default rounded-bl-lg border-l-6 px-2 py-1 text-sm leading-relaxed">
                {{ treatmentPlan.objective || 'Non spécifié' }}
              </p>
            </div>

            <div class="space-y-1">
              <h4 class="text-muted text-xs font-semibold uppercase">Contexte pathologique</h4>
              <p class="bg-muted border-default rounded-bl-lg border-l-6 px-2 py-1 text-sm leading-relaxed">
                {{ treatmentPlan.diagnosis || 'Non spécifié' }}
              </p>
            </div>

            <div v-if="treatmentPlan.painLevel">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="text-sm font-semibold">Niveau de douleur (actuel)</h4>
                <UBadge color="error" variant="subtle" class="font-semibold">{{ treatmentPlan.painLevel }}/10</UBadge>
              </div>
              <div class="flex items-center gap-3">
                <USlider
                  :model-value="treatmentPlan.painLevel"
                  :max="10"
                  :min="0"
                  color="error"
                  disabled
                  :ui="{
                    range: 'bg-transparent',
                    thumb: 'inset-ring-2 inset-ring-error'
                  }"
                />
              </div>
            </div>

            <div class="border-default grid grid-cols-1 gap-4 border-t pt-2">
              <div class="flex items-center gap-3">
                <AppIconBox color="info" name="i-hugeicons-transaction-history" />
                <div class="flex-1">
                  <h4 class="text-muted text-[10px] font-bold tracking-wide">Fréquence</h4>
                  <p class="text-muted flex w-full items-center justify-between text-sm font-medium">
                    <span>{{ treatmentPlan.sessionFrequency || 0 }}x / semaine</span>
                    <span class="text-xs">({{ treatmentPlan.numberOfSessions }} séances)</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <AppIconBox color="info" name="i-hugeicons:chat-user" />
                <div class="flex-1">
                  <h4 class="text-muted text-[10px] font-bold tracking-wide">Prescripteur</h4>
                  <p class="text-muted flex w-full items-center justify-between text-sm font-medium">
                    <span>{{ treatmentPlan.prescribingDoctor || 'Non spécifié' }}</span>
                    <span class="text-xs">({{ treatmentPlan.prescriptionDate }})</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <AppIconBox color="success" name="i-hugeicons-security-check" />
                <div class="flex-1">
                  <h4 class="text-muted text-[10px] font-bold tracking-wide">Assurance</h4>
                  <p class="text-muted flex w-full items-center text-sm font-medium">
                    <span>{{ treatmentPlan.insuranceInfo || 'Non spécifié' }}</span>
                  </p>
                </div>
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
          <div v-if="!(treatmentPlan.notes as any[])?.length" class="py-4 text-center">
            <p class="text-muted text-sm">Aucune note de suivi pour ce plan de traitement</p>
          </div>
          <div v-else v-for="(note, index) in (treatmentPlan.notes as any[]) || []" :key="index" class="text-sm">
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
