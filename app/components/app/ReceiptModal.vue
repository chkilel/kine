<script setup lang="ts">
  const { sessionId } = defineProps<{ sessionId: string }>()
  const emit = defineEmits<{ close: [] }>()

  // ─── Composables ─────────────────────────────────────────────────────────────
  const { data: payments, isPending: paymentsLoading } = useTreatmentSessionPayments(() => sessionId)

  // ─── Template refs ────────────────────────────────────────────────────────────
  const iframeRef = useTemplateRef<HTMLIFrameElement>('receiptIframe')

  // ─── Computed ───────────────────────────────────────────────────────────────
  // FIXME why the first payment
  const payment = computed(() => {
    const list = payments.value as Payment[] | undefined
    return list?.length ? list[0] : null
  })

  const {
    data: receiptUrl,
    state: receiptState,
    refresh: refreshReceipt
  } = usePaymentReceipt(() => payment.value?.id ?? '')

  const paymentTypeLabel = computed(() => {
    if (!payment.value) return ''
    return getPaymentTypeLabel(payment.value.type)
  })

  // ─── Actions ───────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const iframe = iframeRef.value?.contentWindow
    if (!iframe) return
    iframe.focus()
    iframe.print()
  }

  const handleDownload = () => {
    if (!receiptUrl.value) return
    const link = document.createElement('a')
    link.href = receiptUrl.value
    link.download = `recu-${payment.value!.receiptNumber}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Iframe handlers ──────────────────────────────────────────────────────────
  const onIframeLoad = () => {
    const doc = iframeRef.value?.contentDocument
    if (!doc) return

    const body = doc.body
    const availableWidth = iframeRef.value!.clientWidth
    const receiptWidth = 302
    const scale = availableWidth / receiptWidth

    const style = doc.createElement('style')
    style.textContent = `html { overflow: hidden; } body { transform-origin: top left; transform: scale(${scale}); width: ${receiptWidth}px; overflow: hidden; } @media print { html { overflow: auto; } body { transform: none; width: auto; overflow: auto; } }`
    doc.head.appendChild(style)

    requestAnimationFrame(() => {
      iframeRef.value!.style.height = `${Math.ceil(body.scrollHeight * scale)}px`
    })
  }
</script>

<template>
  <UModal title="Reçu de paiement">
    <template #actions>
      <UBadge v-if="paymentTypeLabel" variant="subtle" size="sm">{{ paymentTypeLabel }}</UBadge>
    </template>

    <template #body>
      <div v-if="paymentsLoading" class="flex justify-center py-10">
        <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
      </div>

      <template v-else-if="payment">
        <div v-if="receiptState.status === 'pending'" class="flex flex-col items-center gap-3 py-10">
          <UIcon name="i-hugeicons-loading-03" class="h-8 w-8 animate-spin" />
          <p class="text-sm">Chargement du reçu...</p>
        </div>

        <iframe
          v-else-if="receiptUrl"
          ref="receiptIframe"
          :src="receiptUrl"
          class="w-full border-none"
          @load="onIframeLoad"
        />

        <div v-else class="text-error flex flex-col items-center gap-3 py-10">
          <UIcon name="i-hugeicons-cancel-circle" class="h-8 w-8" />
          <p class="text-sm">Impossible de charger le reçu</p>
        </div>
      </template>

      <div v-else class="text-muted flex justify-center py-10 text-sm">Aucun paiement trouvé</div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full items-center justify-between gap-3">
        <UButton color="neutral" variant="outline" @click="close">Fermer</UButton>
        <div class="flex items-center gap-3">
          <template v-if="receiptUrl">
            <UButton
              label="Télécharger"
              color="neutral"
              variant="outline"
              icon="i-hugeicons-download-02"
              @click="handleDownload"
            />
            <UButton label="Imprimer" color="primary" icon="i-hugeicons-printer" @click="handlePrint" />
          </template>
          <UButton
            v-else-if="receiptState.status === 'error'"
            label="Réessayer"
            color="primary"
            variant="soft"
            icon="i-hugeicons-refresh-01"
            @click="refreshReceipt()"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
