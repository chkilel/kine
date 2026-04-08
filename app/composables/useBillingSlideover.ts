import { createSharedComposable } from '@vueuse/core'
import {
  LazyPaymentAddDepositSlideover,
  LazyPaymentCancelPaymentModal,
  LazyPaymentHistorySlideover,
  LazyPaymentRecordPaymentSlideover,
  LazyPaymentRefundBalanceSlideover,
  LazyAppReceiptModal
} from '#components'

const _useBillingSlideover = () => {
  // ─── Overlays ────────────────────────────────────────────────
  const overlay = useOverlay()
  const recordPaymentOverlay = overlay.create(LazyPaymentRecordPaymentSlideover)
  const addDepositOverlay = overlay.create(LazyPaymentAddDepositSlideover)
  const refundBalanceOverlay = overlay.create(LazyPaymentRefundBalanceSlideover)
  const paymentHistoryOverlay = overlay.create(LazyPaymentHistorySlideover)
  const cancelPaymentOverlay = overlay.create(LazyPaymentCancelPaymentModal)
  const receiptOverlay = overlay.create(LazyAppReceiptModal)

  // ─── Open functions ─────────────────────────────────────────
  const openRecordPayment = (patientId: string, preselectedSessionIds?: string[]) => {
    recordPaymentOverlay.open({ patientId, preselectedSessionIds: preselectedSessionIds ?? [] })
  }

  const openAddDeposit = (patientId: string) => {
    addDepositOverlay.open({ patientId })
  }

  const openRefundBalance = (patientId: string) => {
    refundBalanceOverlay.open({ patientId })
  }

  const openPaymentHistory = (patientId: string) => {
    paymentHistoryOverlay.open({ patientId })
  }

  const openCancelPayment = (payment: PaymentWithSessions) => {
    cancelPaymentOverlay.open({ payment })
  }

  const viewPaymentReceipt = (paymentId: string) => {
    receiptOverlay.open({ paymentId })
  }

  return {
    openRecordPayment,
    openAddDeposit,
    openRefundBalance,
    openPaymentHistory,
    openCancelPayment,
    viewPaymentReceipt
  }
}

export const useBillingSlideover = createSharedComposable(_useBillingSlideover)
