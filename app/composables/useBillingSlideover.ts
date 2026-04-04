import { createSharedComposable } from '@vueuse/core'
import {
  LazyPaymentAddDepositSlideover,
  LazyPaymentCancelPaymentModal,
  LazyPaymentHistorySlideover,
  LazyPaymentRecordPaymentSlideover,
  LazyPaymentRefundBalanceSlideover
} from '#components'

// ─── Composable implementation ─────────────────────────────────
const _useBillingSlideover = () => {
  // ─── Overlay setup ───────────────────────────────────────────
  const overlay = useOverlay()
  const recordPaymentOverlay = overlay.create(LazyPaymentRecordPaymentSlideover)
  const addDepositOverlay = overlay.create(LazyPaymentAddDepositSlideover)
  const refundBalanceOverlay = overlay.create(LazyPaymentRefundBalanceSlideover)
  const paymentHistoryOverlay = overlay.create(LazyPaymentHistorySlideover)
  const cancelPaymentOverlay = overlay.create(LazyPaymentCancelPaymentModal)

  // ─── Actions ─────────────────────────────────────────────────
  const openRecordPayment = (preselectedSessionIds?: string[]) => {
    recordPaymentOverlay.open({ preselectedSessionIds: preselectedSessionIds ?? [] })
  }

  const openAddDeposit = () => {
    addDepositOverlay.open()
  }

  const openRefundBalance = () => {
    refundBalanceOverlay.open()
  }

  const openPaymentHistory = () => {
    paymentHistoryOverlay.open()
  }

  const openCancelPayment = () => {
    cancelPaymentOverlay.open()
  }

  return {
    openRecordPayment,
    openAddDeposit,
    openRefundBalance,
    openPaymentHistory,
    openCancelPayment
  }
}

export const useBillingSlideover = createSharedComposable(_useBillingSlideover)
