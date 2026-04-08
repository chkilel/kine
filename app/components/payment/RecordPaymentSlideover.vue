<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'

  // ─── Props / Emits ───────────────────────────────────────────
  const props = defineProps<{
    patientId: string
    preselectedSessionIds?: string[]
  }>()

  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })
  const createPayment = useCreatePayment()
  const { data: balanceData } = usePatientBalance(() => props.patientId)
  const { data: sessionsData, isLoading: sessionsLoading } = usePatientSessionsPaymentStatus(() => props.patientId)

  // ─── Base state ──────────────────────────────────────────────
  const checkedIds = ref<Set<string>>(new Set(props.preselectedSessionIds))
  const isSubmitting = ref(false)
  const formError = ref('')

  // ─── Computed state ──────────────────────────────────────────
  const creditBalanceCents = computed(() => (balanceData.value as number) ?? 0)

  const unbilledSessions = computed(() => {
    const items = sessionsData.value?.data ?? []
    return items.filter((s) => {
      const status: PaymentStatus = s.paymentStatus
      return status === 'unpaid' || status === 'partial'
    })
  })

  const selectedSessions = computed(() => unbilledSessions.value.filter((s: any) => checkedIds.value.has(s.id)))
  const selectedTotalCents = computed(() =>
    selectedSessions.value.reduce((sum: number, s: any) => sum + ((s.priceCent || 0) - (s.paidCents || 0)), 0)
  )
  const selectedCount = computed(() => selectedSessions.value.length)

  // ─── Form ────────────────────────────────────────────────────
  const formState = reactive({
    amount: 0,
    useCredit: false,
    method: 'cash' as PaymentMethod,
    date: shallowRef<CalendarDate | null>(today(getLocalTimeZone())),
    notes: ''
  })

  // ─── UI helpers ──────────────────────────────────────────────
  const methodButtons = computed(() =>
    PAYMENT_METHOD_OPTIONS.map((m) => ({
      value: m.value,
      label: m.label === 'Carte bancaire' ? 'Carte' : m.label === 'Virement' ? 'Vir.' : m.label,
      icon: m.icon
    }))
  )

  const hasCreditOption = computed(() => creditBalanceCents.value > 0 && formState.method !== 'deposit')

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
      if (use && creditBalanceCents.value > 0) {
        formState.amount = Math.max(
          0,
          centsToCurrency(selectedTotalCents.value) -
            centsToCurrency(Math.min(creditBalanceCents.value, selectedTotalCents.value))
        )
      } else {
        formState.amount = centsToCurrency(selectedTotalCents.value)
      }
    }
  )

  // ─── Event handlers ──────────────────────────────────────────
  function toggleSession(sessionId: string) {
    if (checkedIds.value.has(sessionId)) {
      checkedIds.value = new Set([...checkedIds.value].filter((id) => id !== sessionId))
    } else {
      checkedIds.value = new Set([...checkedIds.value, sessionId])
    }
  }

  function sessionLabel(s: any): string {
    return s.planTitle || 'Séance de kinésithérapie'
  }

  function sessionLocation(s: TreatmentSessionWithPaymentStatus) {
    const loc = s.appointmentLocation
    return loc ? getLocationLabel(loc) : loc || ''
  }

  function sessionRemaining(s: TreatmentSessionWithPaymentStatus) {
    return (s.priceCent || 0) - (s.paidCents || 0)
  }

  // ─── Submit ──────────────────────────────────────────────────
  type SessionItem = { treatmentSessionId: string; amountCents: number }

  async function onSubmit() {
    formError.value = ''
    if (selectedCount.value === 0) return
    if (formState.amount <= 0 && !formState.useCredit) return

    isSubmitting.value = true

    try {
      const totalCents = selectedTotalCents.value
      const creditToUse = formState.useCredit ? Math.min(creditBalanceCents.value, totalCents) : 0

      const depositItems: SessionItem[] = []
      const cashItems: SessionItem[] = []
      let creditRemaining = creditToUse

      for (const session of selectedSessions.value) {
        const remaining = sessionRemaining(session)
        if (creditRemaining >= remaining) {
          depositItems.push({ treatmentSessionId: session.id, amountCents: remaining })
          creditRemaining -= remaining
        } else if (creditRemaining > 0) {
          depositItems.push({ treatmentSessionId: session.id, amountCents: creditRemaining })
          cashItems.push({ treatmentSessionId: session.id, amountCents: remaining - creditRemaining })
          creditRemaining = 0
        } else {
          cashItems.push({ treatmentSessionId: session.id, amountCents: remaining })
        }
      }

      const basePayment = {
        patientId: props.patientId,
        type: 'session_payment' as const,
        notes: formState.notes || undefined,
        paidOn: formState.date?.toString()
      }

      if (depositItems.length > 0) {
        const hasPartialSession = depositItems.some((item) => {
          const session = selectedSessions.value.find((s) => s.id === item.treatmentSessionId)
          return session && item.amountCents < sessionRemaining(session)
        })

        if (hasPartialSession && depositItems.length > 1) {
          const fullCoverItems = depositItems.filter((item) => {
            const session = selectedSessions.value.find((s) => s.id === item.treatmentSessionId)
            return session && item.amountCents >= sessionRemaining(session)
          })
          const partialItem = depositItems.find((item) => {
            const session = selectedSessions.value.find((s) => s.id === item.treatmentSessionId)
            return session && item.amountCents < sessionRemaining(session)
          })!

          await createPayment.mutateAsync({
            paymentData: {
              ...basePayment,
              amountCents: fullCoverItems.reduce((sum, i) => sum + i.amountCents, 0),
              method: 'deposit',
              sessionItems: fullCoverItems
            }
          })

          await createPayment.mutateAsync({
            paymentData: {
              ...basePayment,
              amountCents: partialItem.amountCents,
              method: 'deposit',
              sessionItems: [partialItem]
            }
          })
        } else {
          await createPayment.mutateAsync({
            paymentData: {
              ...basePayment,
              amountCents: depositItems.reduce((sum, i) => sum + i.amountCents, 0),
              method: 'deposit',
              sessionItems: depositItems
            }
          })
        }
      }

      const cashCents = cashItems.reduce((sum, i) => sum + i.amountCents, 0)

      if (cashItems.length > 0 && cashCents > 0) {
        await createPayment.mutateAsync({
          paymentData: {
            ...basePayment,
            amountCents: cashCents,
            method: formState.method,
            sessionItems: cashItems
          },
          onSuccess: () => emit('close')
        })
      } else {
        emit('close')
      }
    } catch (error) {
      formError.value = parseError(error, "Erreur lors de l'enregistrement du paiement").message
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <USlideover title="Enregistrer un paiement" @close="emit('close')">
    <template #body>
      <div class="space-y-6">
        <div v-if="sessionsLoading" class="py-8 text-center">
          <AppSpinner />
        </div>
        <div v-else>
          <h3 class="text-muted text-[10px] font-bold tracking-wider uppercase">Étape 1 — Sélectionner les séances</h3>
          <div class="mt-3 space-y-2">
            <p v-if="unbilledSessions.length === 0" class="text-muted py-4 text-center text-sm">
              Aucune séance impayée
            </p>
            <label
              v-for="session in unbilledSessions"
              :key="session.id"
              class="border-default hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              :class="{ 'border-primary bg-primary/5': checkedIds.has(session.id) }"
            >
              <UCheckbox :model-value="checkedIds.has(session.id)" @update:model-value="toggleSession(session.id)" />
              <div class="min-w-0 flex-1">
                <p class="text-default truncate text-sm font-medium">{{ sessionLabel(session) }}</p>
                <p class="text-muted text-xs">{{ session.appointmentDate || '' }} — {{ sessionLocation(session) }}</p>
              </div>
              <span class="text-default text-sm font-bold whitespace-nowrap tabular-nums">
                {{ formatCurrency(sessionRemaining(session)) }}
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

            <div v-if="hasCreditOption" class="flex items-center justify-between">
              <label class="cursor-pointer text-sm font-medium">Utiliser l'avance disponible</label>
              <div class="flex items-center gap-2">
                <span class="text-primary text-xs font-semibold tabular-nums">
                  {{ formatCurrency(creditBalanceCents) }}
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

        <div v-if="formError">
          <UAlert color="error" variant="subtle" :description="formError" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton label="Annuler" variant="outline" @click="emit('close')" />
        <UButton
          label="Enregistrer le paiement"
          color="primary"
          :disabled="selectedCount === 0 || isSubmitting"
          :loading="isSubmitting"
          @click="onSubmit"
        />
      </div>
    </template>
  </USlideover>
</template>
