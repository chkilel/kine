import { eq } from 'drizzle-orm'
import {
  payments,
  paymentSessionItems,
  organizations,
  patients,
  users,
  treatmentSessions
} from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event)
  const { organizationId } = await requireAuthWithOrg(event)

  try {
    const paymentId = getRouterParam(event, 'id')
    if (!paymentId) {
      throw createError({ statusCode: 400, message: 'Payment ID required' })
    }

    const paymentResult = await db
      .select({
        payment: payments,
        organization: {
          name: organizations.name,
          address: organizations.address,
          contact: organizations.contact
        },
        patient: {
          firstName: patients.firstName,
          lastName: patients.lastName
        },
        therapist: {
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(payments)
      .leftJoin(organizations, eq(payments.organizationId, organizations.id))
      .leftJoin(patients, eq(payments.patientId, patients.id))
      .leftJoin(users, eq(payments.recordedById, users.id))
      .where(eq(payments.id, paymentId))
      .limit(1)

    if (!paymentResult || paymentResult.length === 0) {
      throw createError({ statusCode: 404, message: 'Payment not found' })
    }

    const { payment, organization, patient, therapist } = paymentResult[0]!

    if (payment.organizationId !== organizationId) {
      throw createError({ statusCode: 403, message: 'Access denied' })
    }

    const sessionItems = await db
      .select({
        id: paymentSessionItems.id,
        treatmentSessionId: paymentSessionItems.treatmentSessionId,
        amountCents: paymentSessionItems.amountCents,
        treatmentSession: treatmentSessions
      })
      .from(paymentSessionItems)
      .leftJoin(treatmentSessions, eq(paymentSessionItems.treatmentSessionId, treatmentSessions.id))
      .where(eq(paymentSessionItems.paymentId, paymentId))

    const amountDhs = centsToCurrency(payment.amountCents)

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu - ${payment.receiptNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      width: 80mm;
      padding: 8mm 5mm;
      max-width: 80mm;
    }
    .center {
      text-align: center;
    }
    .bold {
      font-weight: bold;
    }
    .separator {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .separator-double {
      border: none;
      border-top: 3px double #000;
      margin: 6px 0;
    }
    .header h1 {
      font-size: 16px;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .receipt-number {
      font-size: 11px;
      margin-bottom: 2px;
    }
    .org-name {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .org-details, .patient-name {
      font-size: 12px;
      margin-bottom: 1px;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
    }
    .payment-row .label {
      color: #444;
    }
    .amount-section {
      margin-top: 8px;
      text-align: center;
    }
    .amount-label {
      font-size: 12px;
      color: #444;
    }
    .amount-value {
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .session-block {
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 11px;
    }
    @media print {
      body {
        width: 80mm;
        padding: 4mm 5mm;
      }
    }
  </style>
</head>
<body>
  <div class="header center">
    <h1>REÇU DE PAIEMENT</h1>
    <p class="receipt-number">${payment.receiptNumber}</p>
  </div>

  <hr class="separator-double">

  <div class="center">
    <p class="org-name">${organization?.name || ''}</p>
    <p class="org-details">${organization?.address?.street || ''}</p>
    <p class="org-details">${organization?.address?.postalCode || ''} ${organization?.address?.city || ''}</p>
    <p class="org-details">Tél: ${organization?.contact?.phones?.[0]?.number || ''}</p>
  </div>

  <hr class="separator">

  <p class="patient-name"><strong>Patient:</strong> ${patient?.firstName || ''} ${patient?.lastName || ''}</p>

  <hr class="separator">

  <div class="payment-row">
    <span class="label">${getPaymentTypeLabel(payment.type)}</span>
    <span class="bold">${getPaymentMethodLabel(payment.method)}</span>
  </div>

  <div class="payment-row">
    <span class="label">Date</span>
    <span>${new Date(payment.paidOn).toLocaleDateString('fr-FR')}</span>
  </div>
  ${
    payment.notes
      ? `
  <div class="payment-row">
    <span class="label">Notes</span>
    <span>${payment.notes}</span>
  </div>
  `
      : ''
  }
  ${
    therapist
      ? `
  <div class="payment-row">
    <span class="label">Par</span>
    <span>${therapist.firstName} ${therapist.lastName}</span>
  </div>
  `
      : ''
  }

  ${
    sessionItems.length > 0
      ? `
  <hr class="separator">
  <div class="session-block">
    <div class="payment-row bold">
      <span>Détail des séances</span>
    </div>
    ${sessionItems
      .map(
        (item) => `
    <div class="payment-row">
      <span class="label">${item.treatmentSession ? new Date(item.treatmentSession.createdAt).toLocaleDateString('fr-FR') : '-'}</span>
      <span>${centsToCurrency(item.amountCents)} Dh</span>
    </div>
    `
      )
      .join('')}
  </div>
  `
      : payment.type === 'deposit_add'
        ? `
  <hr class="separator">
  <div class="session-block">
    <div class="payment-row bold">
      <span>Avance sur soins</span>
    </div>
  </div>
  `
        : ''
  }

  <hr class="separator-double">

  <div class="amount-section">
    <p class="amount-label">TOTAL</p>
    <p class="amount-value">${amountDhs} Dh</p>
  </div>

  <hr class="separator-double">

  <div class="footer">
    <p>Merci pour votre confiance!</p>
  </div>
</body>
</html>
    `

    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return html
  } catch (error) {
    handleApiError(error, 'Erreur lors de la génération du reçu')
  }
})
