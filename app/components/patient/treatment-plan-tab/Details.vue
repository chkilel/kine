<script setup lang="ts">
  const props = defineProps<{
    treatmentPlan: TreatmentPlanWithProgress
  }>()
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
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
</template>
