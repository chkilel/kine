<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = withDefaults(
    defineProps<{
      preselectedSessionIds?: string[]
    }>(),
    {
      preselectedSessionIds: () => []
    }
  )

  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  // ─── Mock data ──────────────────────────────────────────────
  const mockSessions = [
    { id: 's1', date: '15 Mars 2026', planName: 'Kiné du dos', location: 'Cabinet', amountCents: 9500, checked: false },
    { id: 's2', date: '12 Mars 2026', planName: 'Kiné du dos', location: 'Cabinet', amountCents: 9500, checked: false },
    {
      id: 's3',
      date: '08 Mars 2026',
      planName: 'Rééducation épaule',
      location: 'Domicile',
      amountCents: 12000,
      checked: false
    },
    { id: 's4', date: '05 Mars 2026', planName: 'Kiné du dos', location: 'Cabinet', amountCents: 9500, checked: false },
    {
      id: 's5',
      date: '01 Mars 2026',
      planName: 'Rééducation épaule',
      location: 'Cabinet',
      amountCents: 12000,
      checked: false
    }
  ]

  const mockCreditBalanceCents = 15000

  // ─── State ──────────────────────────────────────────────────
  const sessions = reactive(mockSessions)
  const formState = reactive({
    amount: 0,
    useCredit: false,
    method: 'cash' as PaymentMethod,
    date: shallowRef<CalendarDate | null>(
      new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
    ),
    notes: ''
  })

  // ─── Computed ───────────────────────────────────────────────
  const selectedSessions = computed(() => sessions.filter((s) => s.checked))
  const selectedTotalCents = computed(() => selectedSessions.value.reduce((sum, s) => sum + s.amountCents, 0))
  const selectedCount = computed(() => selectedSessions.value.length)

  const methodButtons = computed(() =>
    Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label === 'Carte bancaire' ? 'Carte' : config.label === 'Virement' ? 'Vir.' : config.label,
      icon: config.icon
    }))
  )

  // ─── Lifecycle ───────────────────────────────────────────────
  onMounted(() => {
    for (const session of sessions) {
      if (props.preselectedSessionIds.includes(session.id)) {
        session.checked = true
      }
    }
  })

  // ─── Watchers ────────────────────────────────────────────────
  watch(
    selectedTotalCents,
    (cents) => {
      formState.amount = centsToCurrency(cents)
    },
    { immediate: true }
  )

  watch(
    () => formState.useCredit,
    (use) => {
      if (use && mockCreditBalanceCents > 0) {
        formState.amount = Math.max(
          0,
          centsToCurrency(selectedTotalCents.value) - centsToCurrency(mockCreditBalanceCents)
        )
      } else {
        formState.amount = centsToCurrency(selectedTotalCents.value)
      }
    }
  )

  // ─── Actions ─────────────────────────────────────────────────
  function onSubmit() {
    emit('close')
  }
</script>

<template>
  <USlideover title="Enregistrer un paiement" @close="emit('close')">
    <template #body>
      <div class="space-y-6">
        <div>
          <h3 class="text-muted text-[10px] font-bold tracking-wider uppercase">Étape 1 — Sélectionner les séances</h3>
          <div class="mt-3 space-y-2">
            <label
              v-for="session in sessions"
              :key="session.id"
              class="border-default hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              :class="{ 'border-primary bg-primary/5': session.checked }"
            >
              <UCheckbox v-model="session.checked" />
              <div class="min-w-0 flex-1">
                <p class="text-default truncate text-sm font-medium">{{ session.planName }}</p>
                <p class="text-muted text-xs">{{ session.date }} — {{ session.location }}</p>
              </div>
              <span class="text-default text-sm font-bold whitespace-nowrap tabular-nums">
                {{ formatCurrency(session.amountCents) }}
              </span>
            </label>
          </div>
          <div class="mt-2 text-right text-sm">
            <span class="text-muted">Total sélectionné :</span>
            <span class="text-primary font-bold tabular-nums">{{ formatCurrency(selectedTotalCents) }}</span>
            <span v-if="selectedCount > 0" class="text-muted text-xs">
              ({{ selectedCount }} séance{{ selectedCount > 1 ? 's' : '' }})
            </span>
          </div>
        </div>

        <USeparator />

        <div>
          <h3 class="text-muted text-[10px] font-bold tracking-wider uppercase">Étape 2 — Détails du paiement</h3>
          <div class="mt-3 space-y-4">
            <UFormField label="Montant" hint="En dirhams">
              <UInputNumber v-model="formState.amount" :min="0" :step="10" size="md" class="w-full" />
            </UFormField>

            <div v-if="mockCreditBalanceCents > 0" class="flex items-center justify-between">
              <label class="cursor-pointer text-sm font-medium">Utiliser l'avance disponible</label>
              <div class="flex items-center gap-2">
                <span class="text-primary text-xs font-semibold tabular-nums">
                  {{ formatCurrency(mockCreditBalanceCents) }}
                </span>
                <USwitch v-model="formState.useCredit" />
              </div>
            </div>

            <UFormField label="Mode de règlement">
              <div class="grid w-full grid-cols-4 gap-2">
                <button
                  v-for="method in methodButtons"
                  :key="method.value"
                  type="button"
                  class="flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 transition-colors"
                  :class="
                    formState.method === method.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-default text-muted hover:border-primary/50'
                  "
                  @click="formState.method = method.value as PaymentMethod"
                >
                  <UIcon :name="method.icon" class="size-5" />
                  <span class="text-[8px] font-bold uppercase">{{ method.label }}</span>
                </button>
              </div>
            </UFormField>

            <UFormField label="Date">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" block>
                  {{ formState.date ? df.format(formState.date.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                </UButton>
                <template #content>
                  <UCalendar v-model="formState.date" class="p-2" />
                </template>
              </UPopover>
            </UFormField>

            <UFormField label="Notes" hint="Optionnel">
              <UTextarea v-model="formState.notes" placeholder="Commentaire..." :rows="2" size="md" class="w-full" />
            </UFormField>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton label="Annuler" variant="outline" @click="emit('close')" />
        <UButton label="Enregistrer le paiement" color="primary" :disabled="selectedCount === 0" @click="onSubmit" />
      </div>
    </template>
  </USlideover>
</template>
