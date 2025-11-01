<script setup lang="ts">
  interface TreatmentPlan {
    id: string
    title: string
    objective: string
    status: 'active' | 'completed'
    progress: number
    completedSessions: number
    totalSessions: number
    upcomingSessions: number
    hasPrescription: boolean
    archived?: boolean
  }

  const treatmentPlans: TreatmentPlan[] = [
    {
      id: '1',
      title: 'Rééducation Lombalgie',
      objective: 'Objectif: Réduction de la douleur, amélioration de la mobilité.',
      status: 'active',
      progress: 67,
      completedSessions: 10,
      totalSessions: 15,
      upcomingSessions: 5,
      hasPrescription: true
    },
    {
      id: '2',
      title: 'Protocole post-opératoire LCA',
      objective: "Objectif: Récupération de l'amplitude, renforcement quadricipital.",
      status: 'active',
      progress: 27,
      completedSessions: 8,
      totalSessions: 30,
      upcomingSessions: 22,
      hasPrescription: true
    },
    {
      id: '3',
      title: 'Tendinopathie de la coiffe',
      objective: 'Objectif: Antalgie, renforcement des rotateurs externes.',
      status: 'completed',
      progress: 100,
      completedSessions: 12,
      totalSessions: 12,
      upcomingSessions: 0,
      hasPrescription: false,
      archived: true
    }
  ]

  const activePlans = treatmentPlans.filter((plan) => !plan.archived)
  const archivedPlans = treatmentPlans.filter((plan) => plan.archived)
</script>

<template>
  <div class="mt-6">
    <div class="mb-6 flex items-center justify-end">
      <UButton color="primary" class="flex items-center gap-2">
        <UIcon name="i-lucide-plus" />
        <span>Nouveau Plan de Traitement</span>
      </UButton>
    </div>

    <div class="flex flex-col gap-8">
      <!-- Plans de Traitement Actifs -->
      <div>
        <h2 class="text-default mb-4 text-lg font-bold">Plans de Traitement Actifs</h2>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UCard v-for="plan in activePlans" :key="plan.id" :class="{ 'opacity-70': plan.archived }">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-default text-base font-bold">{{ plan.title }}</h3>
                <p class="text-muted text-sm">{{ plan.objective }}</p>
              </div>
              <UBadge
                :color="plan.status === 'active' ? 'success' : 'neutral'"
                variant="subtle"
                :size="plan.archived ? 'xs' : 'lg'"
              >
                {{ plan.status === 'active' ? 'Actif' : 'Terminé' }}
              </UBadge>
            </div>

            <div>
              <div class="text-muted mb-1 flex items-center justify-end text-sm">{{ plan.progress }}%</div>
              <UProgress
                :model-value="plan.progress"
                :max="100"
                :color="plan.status === 'completed' ? 'success' : undefined"
              />
              <div class="text-muted mt-1 flex items-center justify-between text-xs">
                <span>{{ plan.completedSessions }}/{{ plan.totalSessions }} terminées</span>
                <span>{{ plan.upcomingSessions }} à venir</span>
              </div>
            </div>

            <template v-if="!plan.archived" #footer>
              <div class="flex items-center justify-between">
                <UButton
                  v-if="plan.hasPrescription"
                  label="Voir la prescription"
                  variant="ghost"
                  color="primary"
                  size="sm"
                  icon="i-lucide-paperclip"
                  class="flex items-center gap-2 self-start"
                />
                <div class="flex flex-wrap justify-end gap-2">
                  <UButton variant="ghost" color="neutral" size="sm" class="flex items-center gap-1">
                    <UIcon name="i-lucide-check-circle" />
                    <span>Terminer séance</span>
                  </UButton>
                  <UButton variant="ghost" color="neutral" size="sm" class="flex items-center gap-1">
                    <UIcon name="i-lucide-note-add" />
                    <span>Note</span>
                  </UButton>
                  <UButton variant="ghost" color="neutral" size="sm" class="flex items-center gap-1">
                    <UIcon name="i-lucide-refresh-cw" />
                    <span>Renouveler</span>
                  </UButton>
                  <UDropdown :items="[]">
                    <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-more-vertical" square />
                  </UDropdown>
                </div>
              </div>
            </template>

            <template v-else #footer>
              <div class="flex justify-end gap-2">
                <UButton variant="ghost" color="primary" size="sm" class="flex items-center gap-1">
                  <UIcon name="i-lucide-eye" />
                  <span>Voir les détails</span>
                </UButton>
                <UButton variant="ghost" color="neutral" size="sm" class="flex items-center gap-1">
                  <UIcon name="i-lucide-archive-restore" />
                  <span>Désarchiver</span>
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>

      <!-- Plans de Traitement Archivés -->
      <div v-if="archivedPlans.length > 0">
        <h2 class="text-default mb-4 text-lg font-bold">Plans de Traitement Archivés</h2>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UCard v-for="plan in archivedPlans" :key="plan.id" class="opacity-70">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-default text-base font-bold">{{ plan.title }}</h3>
                <p class="text-muted text-sm">{{ plan.objective }}</p>
              </div>
              <UBadge color="neutral" variant="subtle" size="xs">Terminé</UBadge>
            </div>

            <div>
              <div class="text-muted mb-1 flex items-center justify-end text-sm">{{ plan.progress }}%</div>
              <UProgress :model-value="plan.progress" :max="100" color="success" />
              <div class="text-muted mt-1 flex items-center justify-between text-xs">
                <span>{{ plan.completedSessions }}/{{ plan.totalSessions }} terminées</span>
                <span>{{ plan.upcomingSessions }} à venir</span>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton variant="ghost" color="primary" size="sm" class="flex items-center gap-1">
                  <UIcon name="i-lucide-eye" />
                  <span>Voir les détails</span>
                </UButton>
                <UButton variant="ghost" color="neutral" size="sm" class="flex items-center gap-1">
                  <UIcon name="i-lucide-archive-restore" />
                  <span>Désarchiver</span>
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
