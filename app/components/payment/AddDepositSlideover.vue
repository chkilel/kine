<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  // ─── Props / Emits ───────────────────────────────────────────
  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  // ─── Form state ──────────────────────────────────────────────
  const formState = reactive({
    amount: 0,
    method: 'cash' as PaymentMethod,
    date: shallowRef<CalendarDate | null>(
      new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
    ),
    notes: ''
  })

  // ─── UI helpers ──────────────────────────────────────────────
  const methodButtons = computed(() =>
    Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label === 'Carte bancaire' ? 'Carte' : config.label === 'Virement' ? 'Vir.' : config.label,
      icon: config.icon
    }))
  )

  // ─── Actions ─────────────────────────────────────────────────
  function onSubmit() {
    emit('close')
  }
</script>

<template>
  <USlideover title="Ajouter une avance" @close="emit('close')">
    <template #body>
      <div class="space-y-5">
        <UAlert
          size="sm"
          color="info"
          variant="subtle"
          icon="i-hugeicons-information-diamond"
          description="Cette avance sera ajoutée au solde du patient et pourra être utilisée pour les futures séances."
        />

        <UFormField label="Montant" hint="En dirhams">
          <UInputNumber v-model="formState.amount" :min="0" :step="10" size="md" class="w-full" />
        </UFormField>

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
    </template>

    <template #footer>
      <div class="flex w-full justify-between gap-3">
        <UButton label="Annuler" variant="outline" @click="emit('close')" />
        <UButton label="Ajouter l'avance" color="primary" :disabled="formState.amount <= 0" @click="onSubmit" />
      </div>
    </template>
  </USlideover>
</template>
