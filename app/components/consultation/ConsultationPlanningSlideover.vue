<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui'

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const emit = defineEmits<{
    close: [data?: any]
  }>()

  // Get active organization and session
  const { user } = await useAuth()
  const { activeOrganization } = useOrganization()
  if (!user || !activeOrganization.value.data?.id) {
    await navigateTo('/login')
  }

  // FIXME grab therapist from org
  const therapists = [user.value!]

  // Tab state
  const activePlanningTab = ref('manual')

  const treatmentPlanStats = ref<{
    total: number
    completed: number
    scheduled: number
    cancelled: number
    progressPercentage: number
  } | null>(null)

  // Tab configuration
  const planningTabs = [
    {
      label: 'Planification manuelle',
      icon: 'i-lucide-calendar-plus',
      slot: 'manual',
      value: 'manual'
    },
    {
      label: 'Planification automatique',
      icon: 'i-lucide-zap',
      slot: 'auto',
      value: 'auto'
    }
  ] satisfies TabsItem[]

  const communicationSettings = ref({
    sendConfirmations: false,
    enableReminders: true
  })
</script>

<template>
  <USlideover
    title="Planification des séances"
    :description="`Patient: ${formatFullName(props.patient)}`"
    :ui="{
      content: 'w-full md:w-3/4 max-w-5xl bg-elevated',
      header: 'hidden'
    }"
    @close="emit('close', $event)"
  >
    <template #body>
      <!-- Main Content -->
      <div class="flex flex-col">
        <!-- Treatment Plan Overview -->
        <UCard>
          <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Total de séances</p>
              <p class="font-title text-xl font-bold">{{ props.treatmentPlan?.numberOfSessions || 0 }}</p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4">
              <p class="text-sm font-medium">Séances restantes</p>
              <p class="font-title text-xl font-bold">
                {{ Math.max(0, (props.treatmentPlan?.numberOfSessions || 0) - (treatmentPlanStats?.completed || 0)) }}
              </p>
            </div>
            <div class="bg-muted flex flex-col gap-1 rounded-lg p-4 sm:col-span-2">
              <p class="text-sm font-medium">Plan de traitement</p>
              <p class="font-title text-lg font-bold">{{ props.treatmentPlan?.title }}</p>
            </div>

            <div class="col-span-full space-y-2">
              <div class="flex justify-between text-sm font-medium">
                <span>Progression du plan</span>
                <span>
                  {{ treatmentPlanStats?.completed || 0 }} / {{ props.treatmentPlan?.numberOfSessions || 0 }} séances
                </span>
              </div>
              <UProgress :model-value="treatmentPlanStats?.progressPercentage || 0" :max="100" size="lg" />
            </div>
          </div>
        </UCard>

        <!-- Planning Tabs -->
        <UCard class="mt-6">
          <UTabs
            v-model="activePlanningTab"
            :items="planningTabs"
            variant="pill"
            size="xl"
            color="primary"
            class="w-full"
          >
            <!-- Manual Planning Tab -->
            <template #manual>
              <ConsultationManualPlanningCard :treatment-plan="props.treatmentPlan" :therapists="therapists" />
            </template>

            <!-- Auto Planning Tab -->
            <template #auto>
              <ConsultationAutomaticPlanningCard :therapists="therapists" :treatment-plan="treatmentPlan" />
            </template>
          </UTabs>
        </UCard>

        <!-- Session Management FIXME -->
        <ConsultationManagement class="mt-6" :active-planning-tab="activePlanningTab" />

        <!-- Communication Settings -->
        <UCard class="mt-6">
          <h3 class="text-foreground mb-4 text-lg font-bold">Communication Patient</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-sm font-medium">Envoyer les confirmations de séance</span>
              <USwitch v-model="communicationSettings.sendConfirmations" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-sm font-medium">
                Activer les rappels automatiques (24h avant)
              </span>
              <USwitch v-model="communicationSettings.enableReminders" />
            </div>
            <UButton icon="i-lucide-share" variant="outline" color="neutral" size="lg" block>
              Partager l'historique des séances
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
    <!-- Footer -->
    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-3">
        <UButton variant="outline" color="neutral" size="lg" @click="close">Annuler</UButton>
        <UButton color="primary" size="lg">Mettre à jour la séance</UButton>
      </div>
    </template>
  </USlideover>
</template>
