<script setup lang="ts">
  import { LazyTreatmentPlanCreateSlideover } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSlideover)
  const router = useRouter()
  const route = useRoute()

  const { getActiveTreatmentPlan, loading: treatmentPlansLoading } = usePatientTreatmentPlans(() => patient?.id)
  const { data: consultations } = useConsultationsList(() => patient?.id)

  const upcomingConsultations = computed(() => {
    if (!consultations.value) return []
    return consultations.value
      .filter((c) => {
        const consultDate = new Date(c.date)
        return !isDateDisabled(consultDate)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  function openCreateTreatmentPlan() {
    treatmentPlanCreateOverlay.open({ patient })
  }

  function navigateToTreatmentPlan() {
    router.push({
      path: route.path,
      query: { ...route.query, tab: 'plan' }
    })
  }
</script>

<template>
  <template v-if="treatmentPlansLoading">
    <div class="bg-default flex h-full flex-col rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-center py-8">
        <UIcon name="i-hugeicons-loading-03" class="text-muted animate-spin text-3xl" />
      </div>
    </div>
  </template>
  <template v-else-if="getActiveTreatmentPlan">
    <div class="bg-default flex h-full flex-col rounded-xl p-6 shadow-sm">
      <h3 class="text-default mb-4 text-lg font-bold">Plan de Traitement & Prochains RDV</h3>

      <div class="bg-muted border-default mb-6 rounded-xl border p-4">
        <div class="mb-3 flex items-start justify-between">
          <div>
            <h4 class="text-default text-base font-bold">
              {{ getActiveTreatmentPlan.title || 'Plan de traitement' }}
            </h4>
            <UBadge color="success" variant="soft" class="mt-1">En cours</UBadge>
          </div>
          <UButton size="xs" variant="outline" color="neutral" @click="navigateToTreatmentPlan">
            Voir les détails
          </UButton>
        </div>

        <div class="space-y-2">
          <div class="text-muted flex items-center justify-between text-xs">
            <span>
              Progression ({{ getActiveTreatmentPlan.completedConsultations }}/{{
                getActiveTreatmentPlan.numberOfSessions || 0
              }}
              séances)
            </span>
            <span>{{ getActiveTreatmentPlan.progress }}%</span>
          </div>
          <UProgress :model-value="getActiveTreatmentPlan.progress" :max="100" color="primary" size="md" />
        </div>
      </div>

      <div class="flex-1">
        <h4 class="text-muted mb-3 text-xs font-bold tracking-wider uppercase">Prochaines séances</h4>
        <ul v-if="upcomingConsultations.length > 0" class="space-y-0.5">
          <li
            v-for="consultation in upcomingConsultations"
            :key="consultation.id"
            class="group hover:bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border border-transparent p-3 transition-colors"
          >
            <AppDateBadge :date="consultation.date" color="info" variant="soft" />

            <div class="min-w-0 flex-1">
              <p class="text-default truncate font-semibold">
                {{ getConsultationTypeLabel(consultation.type || 'follow_up') }}
              </p>
              <p class="text-muted text-sm">
                <span class="font-medium capitalize">
                  {{ extractDayAndMonth(consultation.date).dayNameShort }}
                </span>

                à

                <span class="font-semibold">
                  {{ removeSecondsFromTime(consultation.startTime) }}
                </span>

                - {{ consultation.duration }} min
              </p>
            </div>
            <UIcon
              name="i-hugeicons-arrow-right-01"
              class="group-hover:text-primary text-muted size-8 transition-all group-hover:-mr-2"
            />
          </li>
        </ul>
        <div v-else class="text-muted p-3 text-center text-sm">Aucune séance à venir</div>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="bg-default flex h-full flex-col rounded-xl p-6 shadow-sm">
      <div class="flex flex-1 flex-col items-center justify-center">
        <UIcon name="i-hugeicons-note-add" class="text-muted mb-3 text-4xl" />
        <p class="text-muted mb-4 text-sm">Ce patient n'a pas encore de plan de traitement.</p>
        <UButton color="primary" size="sm" @click="openCreateTreatmentPlan">Créer un plan</UButton>
      </div>
    </div>
  </template>
</template>
