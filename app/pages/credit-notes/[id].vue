<script setup lang="ts">
  definePageMeta({
    layout: 'default'
  })

  const route = useRoute()
  const creditNoteId = route.params.id as string

  const { data: creditNote, isLoading } = useCreditNote(() => creditNoteId)
  const { data: allocations } = useCreditNoteAllocations(() => creditNoteId)
  const { mutate: updateCreditNote } = useUpdateCreditNote()

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon'
      case 'issued':
        return 'Émis'
      case 'cancelled':
        return 'Annulé'
      default:
        return status
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'neutral'
    }
  }

  function issueCreditNote() {
    updateCreditNote({ creditNoteId, data: { status: 'issued' } }, {})
  }

  function cancelCreditNote() {
    updateCreditNote({ creditNoteId, data: { status: 'cancelled' } }, {})
  }
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="text-dimmed py-8 text-center">Chargement...</div>

    <template v-else-if="creditNote">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ creditNote.referenceNumber }}</h1>
          <p class="text-dimmed">{{ creditNote.reason }}</p>
        </div>
        <div class="flex items-center gap-3">
          <UBadge :label="statusLabel(creditNote.status)" :color="statusColor(creditNote.status)" variant="subtle" />
          <UDropdownMenu
            v-if="creditNote.status === 'draft'"
            :items="[
              [
                { label: 'Émettre', icon: 'i-hugeicons-checkmark-circle-02', click: issueCreditNote },
                { label: 'Annuler', icon: 'i-hugeicons-cancel-01', click: cancelCreditNote }
              ]
            ]"
          >
            <UButton icon="i-hugeicons-more-horizontal" variant="ghost" />
          </UDropdownMenu>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="border-default bg-default space-y-3 rounded-lg border p-4">
          <h2 class="font-medium">Détails</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-dimmed">Type</span>
              <span>{{ creditNote.type === 'correction' ? 'Correction' : 'Remboursement' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-dimmed">Montant</span>
              <span class="font-medium">{{ formatCurrency(creditNote.amountCents) }}</span>
            </div>
            <div v-if="creditNote.notes" class="flex justify-between">
              <span class="text-dimmed">Notes</span>
              <span>{{ creditNote.notes }}</span>
            </div>
          </div>
        </div>

        <div class="border-default bg-default space-y-3 rounded-lg border p-4">
          <h2 class="font-medium">Allocations</h2>
          <div v-if="!allocations?.length" class="text-dimmed text-sm">Aucune allocation</div>
          <div v-for="alloc in allocations" :key="alloc.id" class="flex justify-between text-sm">
            <span class="text-dimmed">Facture: {{ alloc.invoiceId.slice(0, 8) }}...</span>
            <span>{{ formatCurrency(alloc.amountCents) }}</span>
          </div>
        </div>
      </div>

      <div v-if="creditNote.status === 'issued'" class="border-default bg-default rounded-lg border p-4">
        <h2 class="mb-3 font-medium">Allouer à une facture</h2>
        <CreditNoteAllocateForm :credit-note-id="creditNoteId" @allocated="() => {}" />
      </div>
    </template>
  </div>
</template>
