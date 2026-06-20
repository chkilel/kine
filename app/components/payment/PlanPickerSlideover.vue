<script setup lang="ts">
  type PlanFinancials = {
    billedCents: number
    collectedCents: number
    remainingCents: number
  }

  type StatusFilter = 'active' | 'archived' | 'all'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{
    patientId: string
    selectedPlanId: string | null
    selectedPlanFinancials?: PlanFinancials
  }>()

  const emit = defineEmits<{
    select: [planId: string]
    close: []
  }>()

  // ─── Composables ─────────────────────────────────────────────
  const { treatmentPlansGroupedByStatus, loading: plansLoading } = usePatientTreatmentPlans(() => props.patientId)

  // ─── State ───────────────────────────────────────────────────
  const searchQuery = ref('')
  const statusFilter = ref<StatusFilter>('active')

  const statusFilterOptions: Array<{ label: string; value: StatusFilter }> = [
    { label: 'En cours', value: 'active' },
    { label: 'Terminés', value: 'archived' },
    { label: 'Tous', value: 'all' }
  ]

  const ACTIVE_STATUSES: TreatmentPlanStatus[] = ['ongoing', 'planned', 'paused']
  const ARCHIVED_STATUSES: TreatmentPlanStatus[] = ['completed', 'cancelled']

  // ─── Computed state ──────────────────────────────────────────
  const filteredPlans = computed(() => {
    if (!treatmentPlansGroupedByStatus.value) return []
    let list = treatmentPlansGroupedByStatus.value

    if (statusFilter.value === 'active') {
      list = list.filter((p) => ACTIVE_STATUSES.includes(p.status))
    } else if (statusFilter.value === 'archived') {
      list = list.filter((p) => ARCHIVED_STATUSES.includes(p.status))
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) => (p.title || '').toLowerCase().includes(q) || (p.diagnosis || '').toLowerCase().includes(q)
      )
    }

    return list
  })

  // Group filtered plans by section for display
  const groupedPlans = computed(() => {
    const groups: Array<{ key: string; label: string; plans: typeof filteredPlans.value }> = []
    const active = filteredPlans.value.filter((p) => ACTIVE_STATUSES.includes(p.status))
    const archived = filteredPlans.value.filter((p) => ARCHIVED_STATUSES.includes(p.status))

    if (active.length) groups.push({ key: 'active', label: 'En cours', plans: active })
    if (archived.length) groups.push({ key: 'archived', label: 'Terminés / Annulés', plans: archived })
    return groups
  })

  const selectedPlanFinancialsSafe = computed<PlanFinancials | null>(() => props.selectedPlanFinancials ?? null)

  // ─── Event handlers ──────────────────────────────────────────
  function handleSelect(planId: string) {
    emit('select', planId)
    emit('close')
  }
</script>

<template>
  <USlideover title="Choisir un plan" :ui="{ content: 'max-w-xl' }" @close="emit('close')">
    <template #body>
      <div class="flex h-full flex-col gap-4">
        <!-- Status filter -->
        <UTabs v-model="statusFilter" :items="statusFilterOptions" :content="false" size="xs" class="w-full" />

        <!-- Search -->
        <UInput
          v-model="searchQuery"
          icon="i-hugeicons-search-01"
          placeholder="Rechercher un plan..."
          size="md"
          variant="subtle"
        />

        <!-- Loading -->
        <div v-if="plansLoading" class="py-8 text-center">
          <AppSpinner />
        </div>

        <!-- Empty -->
        <div v-else-if="groupedPlans.length === 0" class="text-muted py-8 text-center text-sm">
          <UIcon name="i-hugeicons-folder-open-01" class="mb-2 size-8 opacity-50" />
          <p>Aucun plan trouvé</p>
        </div>

        <!-- List -->
        <div v-else class="flex-1 space-y-6 overflow-y-auto">
          <section v-for="group in groupedPlans" :key="group.key" class="space-y-2">
            <h4 class="text-muted text-[10px] font-bold tracking-wider uppercase">
              {{ group.label }}
            </h4>

            <button
              v-for="plan in group.plans"
              :key="plan.id"
              type="button"
              class="border-default bg-muted hover:bg-elevated focus:border-primary/80 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors focus:outline-none"
              :class="{ 'border-primary bg-primary/5': selectedPlanId === plan.id }"
              @click="handleSelect(plan.id)"
            >
              <!-- Status icon -->
              <AppIconBox
                :name="getTreatmentPlanStatusIcon(plan.status)"
                :color="getTreatmentPlanStatusColor(plan.status)"
                size="lg"
                variant="soft"
                class="shrink-0"
              />

              <!-- Title + meta -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ plan.title || 'Plan sans titre' }}</p>
                <div class="flex items-center">
                  <!-- Date range -->
                  <div class="text-muted mt-0.5 flex items-center gap-1 text-xs">
                    <UIcon name="i-hugeicons-calendar-03" class="size-3.5 shrink-0" />
                    <span class="truncate">{{ formatDateRange(plan.startDate, plan.endDate) }}</span>
                  </div>
                  <USeparator v-if="plan.priceItem" orientation="vertical" color="neutral" class="mx-2 h-3" />

                  <!-- Code + price(only clinic because it's the most used') -->
                  <div class="text-muted mt-0.5 flex items-center gap-1 text-xs">
                    <UIcon name="i-hugeicons-coins-02" class="size-3.5 shrink-0" />
                    <UBadge
                      v-if="plan.priceItem?.code"
                      :label="plan.priceItem.code"
                      size="sm"
                      color="primary"
                      variant="soft"
                      class="text-muted"
                    />
                    <span class="font-semibold tabular-nums">{{ formatCurrency(plan.pricing.clinic) }}</span>
                  </div>
                </div>

                <p class="text-muted mt-2 text-right text-xs">
                  {{ plan.completedAppointments }} / {{ plan.numberOfSessions || '?' }} séances
                </p>

                <!-- Progress -->
                <div v-if="plan.numberOfSessions" class="mt-1.5">
                  <UProgress :model-value="plan.progress" :max="100" size="sm" color="primary" />
                </div>

                <!-- Selected plan financials -->
                <div
                  v-if="selectedPlanId === plan.id && selectedPlanFinancialsSafe"
                  class="bg-muted/60 mt-2 flex items-center justify-between gap-2 rounded px-2 py-1 text-[11px]"
                >
                  <span class="text-muted">Encaissé</span>
                  <span class="font-bold tabular-nums">
                    {{ formatCurrency(selectedPlanFinancialsSafe.collectedCents) }}
                    <span class="text-muted font-normal">
                      / {{ formatCurrency(selectedPlanFinancialsSafe.billedCents) }}
                    </span>
                  </span>
                </div>
              </div>
            </button>
          </section>
        </div>
      </div>
    </template>
  </USlideover>
</template>
