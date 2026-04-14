# unified-appointment-session Specification (Delta)

## Purpose

Modifications aux spécifications des rendez-vous unifiés pour ajouter le support du contexte d'assurance et du suivi des paiements de co-paiement et d'assurance.

## ADDED Requirements

### Requirement: Insurance Context on Appointment

Le système DOIT permettre le stockage du contexte d'assurance sur les rendez-vous via les champs suivants:

- `insuranceCompanyId` (UUID, FOREIGN KEY, NULLABLE) - référence à la compagnie d'assurance
- `expectedCoPayCents` (INTEGER, NULLABLE) - co-paiement attendu calculé automatiquement
- `expectedInsuranceCents` (INTEGER, NULLABLE) - paiement d'assurance attendu calculé automatiquement
- `coPayPaidCents` (INTEGER, NULLABLE, default 0) - montant de co-paiement payé par le patient
- `insurancePaidCents` (INTEGER, NULLABLE, default 0) - montant payé par l'assurance

Le contexte d'assurance peut être hérité du plan de traitement parent ou spécifié manuellement pour les rendez-vous indépendants. Les montants attendus (expected) sont calculés automatiquement basés sur les règles de la compagnie d'assurance et sont en lecture seule. Les montants réels (paid) sont saisis manuellement.

#### Scenario: Appointment inherits insurance context from treatment plan

- **GIVEN** un plan de traitement existe avec id="plan-123" et insuranceCompanyId="insurance-789"
- **AND** la compagnie d'assurance a sessionPriceCents=5000, coPayRule="fixed", coPayAmountCents=1000
- **WHEN** POST /api/appointments est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  treatmentPlanId: "plan-123",
  date: "2025-04-15",
  startTime: "10:00:00",
  endTime: "10:30:00"
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** le rendez-vous a insuranceCompanyId="insurance-789" (hérité)
- **AND** expectedCoPayCents=1000 (calculé automatiquement)
- **AND** expectedInsuranceCents=4000 (calculé automatiquement)
- **AND** coPayPaidCents=0
- **AND** insurancePaidCents=0

#### Scenario: Create independent appointment with manual insurance context

- **GIVEN** une compagnie d'assurance active existe avec id="insurance-789"
- **AND** la compagnie a sessionPriceCents=5000, coPayRule="percentage", coPayPercentage=20
- **WHEN** POST /api/appointments est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  insuranceCompanyId: "insurance-789",
  date: "2025-04-15",
  startTime: "10:00:00",
  endTime: "10:30:00"
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** le rendez-vous a insuranceCompanyId="insurance-789"
- **AND** expectedCoPayCents=1000 (5000 \* 0.20, calculé automatiquement)
- **AND** expectedInsuranceCents=4000 (5000 - 1000, calculé automatiquement)

#### Scenario: Create appointment without insurance context

- **GIVEN** aucun plan de traitement avec assurance n'est associé
- **WHEN** POST /api/appointments est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  date: "2025-04-15",
  startTime: "10:00:00",
  endTime: "10:30:00"
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** insuranceCompanyId est NULL
- **AND** expectedCoPayCents est NULL
- **AND** expectedInsuranceCents est NULL
- **AND** coPayPaidCents=0
- **AND** insurancePaidCents=0

#### Scenario: Prevent mismatched insurance context with treatment plan

- **GIVEN** un plan de traitement existe avec insuranceCompanyId="insurance-789"
- **WHEN** POST /api/appointments est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  treatmentPlanId: "plan-123",
  insuranceCompanyId: "insurance-999",
  date: "2025-04-15",
  startTime: "10:00:00",
  endTime: "10:30:00"
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que le contexte d'assurance doit correspondre à celui du plan de traitement

### Requirement: Insurance Payment Tracking

Le système DOIT permettre le suivi des paiements réels sur les rendez-vous, distincts des montants attendus calculés automatiquement. Les utilisateurs DOIVENT pouvoir mettre à jour les montants payés (coPayPaidCents, insurancePaidCents) mais pas les montants attendus (expectedCoPayCents, expectedInsuranceCents).

#### Scenario: Record payment amounts on appointment

- **GIVEN** un rendez-vous existe avec expectedCoPayCents=1000, expectedInsuranceCents=4000
- **WHEN** PATCH /api/appointments/apt-123/payments est appelé avec le corps {
  coPayPaidCents: 1000,
  insurancePaidCents: 4000
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** coPayPaidCents est mis à jour à 1000
- **AND** insurancePaidCents est mis à jour à 4000
- **AND** expectedCoPayCents et expectedInsuranceCents restent inchangés

#### Scenario: Record partial payments

- **GIVEN** un rendez-vous existe avec expectedCoPayCents=1000, expectedInsuranceCents=4000
- **WHEN** PATCH /api/appointments/apt-123/payments est appelé avec le corps {
  coPayPaidCents: 500,
  insurancePaidCents: 2000
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** coPayPaidCents est mis à jour à 500
- **AND** insurancePaidCents est mis à jour à 2000

#### Scenario: Update payment amounts incrementally

- **GIVEN** un rendez-vous existe avec coPayPaidCents=500, insurancePaidCents=2000
- **WHEN** PATCH /api/appointments/apt-123/payments est appelé avec le corps {
  coPayPaidCents: 1000,
  insurancePaidCents: 4000
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** coPayPaidCents est mis à jour à 1000 (remplace la valeur précédente)
- **AND** insurancePaidCents est mis à jour à 4000 (remplace la valeur précédente)

#### Scenario: Prevent modifying expected amounts manually

- **GIVEN** un rendez-vous existe
- **WHEN** PATCH /api/appointments/apt-123 est appelé avec le corps {
  expectedCoPayCents: 1500
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que les montants attendus sont calculés automatiquement et ne peuvent pas être modifiés

#### Scenario: Recalculate expected amounts when insurance company changes

- **GIVEN** un rendez-vous existe avec insuranceCompanyId="insurance-789" (sessionPriceCents=5000, coPayAmountCents=1000)
- **AND** expectedCoPayCents=1000, expectedInsuranceCents=4000
- **WHEN** la compagnie d'assurance est mise à jour à coPayAmountCents=1500
- **AND** le calcul des montants attendus est déclenché pour le rendez-vous
- **THEN** expectedCoPayCents=1500
- **AND** expectedInsuranceCents=3500
- **AND** coPayPaidCents et insurancePaidCents restent inchangés

#### Scenario: Get appointment with payment status

- **GIVEN** un rendez-vous existe avec expectedCoPayCents=1000, expectedInsuranceCents=4000, coPayPaidCents=500, insurancePaidCents=2000
- **WHEN** GET /api/appointments/apt-123 est appelé
- **THEN** la réponse HTTP est 200 OK
- **AND** la réponse inclut tous les champs d'assurance et de paiement
- **AND** les montants attendus et réels sont clairement distingués

## MODIFIED Requirements

### Requirement: Appointment created in scheduled status

Le système DOIT créer un rendez-vous avec le statut "scheduled" lors de sa création. Tous les champs cliniques (primaryConcern, treatmentSummary, observations, nextSteps, painLevelBefore, painLevelAfter) DOIVENT être null. Tous les champs de timer (actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime) DOIVENT être null. priceCents DOIT par défaut être 0.

**MODIFICATION:** Les champs d'assurance et de paiement DOIVENT également être définis:

- `insuranceCompanyId` DOIT être hérité du plan de traitement parent si spécifié, ou NULL par défaut
- `expectedCoPayCents` et `expectedInsuranceCents` DOIVENT être calculés automatiquement si `insuranceCompanyId` est présent, ou NULL par défaut
- `coPayPaidCents` et `insurancePaidCents` DOIVENT par défaut être 0

#### Scenario: Appointment created in scheduled status

- **GIVEN** un thérapeute crée un nouveau rendez-vous
- **AND** aucun plan de traitement avec assurance n'est associé
- **WHEN** POST /api/appointments est appelé avec les champs de planification (patientId, therapistId, date, startTime, endTime, roomId)
- **THEN** le rendez-vous est créé avec le statut "scheduled"
- **AND** tous les champs cliniques (primaryConcern, treatmentSummary, observations, nextSteps, painLevelBefore, painLevelAfter) sont null
- **AND** tous les champs de timer (actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime) sont null
- **AND** priceCents par défaut est 0
- **AND** insuranceCompanyId est NULL
- **AND** expectedCoPayCents est NULL
- **AND** expectedInsuranceCents est NULL
- **AND** coPayPaidCents est 0
- **AND** insurancePaidCents est 0
- **AND** la réponse HTTP est 201 Created

#### Scenario: Appointment created with insurance context from treatment plan

- **GIVEN** un plan de traitement existe avec insuranceCompanyId="insurance-789"
- **AND** la compagnie d'assurance a sessionPriceCents=5000, coPayRule="fixed", coPayAmountCents=1000
- **WHEN** POST /api/appointments est appelé avec les champs de planification et treatmentPlanId="plan-123"
- **THEN** le rendez-vous est créé avec le statut "scheduled"
- **AND** insuranceCompanyId est "insurance-789" (hérité)
- **AND** expectedCoPayCents est 1000 (calculé automatiquement)
- **AND** expectedInsuranceCents est 4000 (calculé automatiquement)
- **AND** coPayPaidCents est 0
- **AND** insurancePaidCents est 0
- **AND** la réponse HTTP est 201 Created

### Requirement: Merged Database Schema

Le système DOIT stocker toutes les données de planification, cliniques, timer, facturation, verrouillage et d'assurance dans une seule table `appointments`. Aucune table `treatment_sessions` n'existe.

**MODIFICATION:** La table `appointments` DOIT également inclure les colonnes suivantes pour le contexte d'assurance et le suivi des paiements:

- `insuranceCompanyId` (UUID, FOREIGN KEY, NULLABLE) - référence insurance_companies.id
- `expectedCoPayCents` (INTEGER, NULLABLE) - co-paiement attendu calculé automatiquement
- `expectedInsuranceCents` (INTEGER, NULLABLE) - paiement d'assurance attendu calculé automatiquement
- `coPayPaidCents` (INTEGER, NULLABLE, default 0) - montant de co-paiement payé
- `insurancePaidCents` (INTEGER, NULLABLE, default 0) - montant payé par l'assurance

#### Scenario: Appointments table includes insurance and payment columns

- **GIVEN** le schéma de base de données est migré
- **WHEN** la table appointments est inspectée
- **THEN** elle contient les colonnes: primaryConcern, treatmentSummary, observations, nextSteps, painLevelBefore, painLevelAfter, actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime, extendedDurationMinutes, tags, priceCents, isLocked, lockedAt, lockedById, cancelledAt, cancellationReason, insuranceCompanyId, expectedCoPayCents, expectedInsuranceCents, coPayPaidCents, insurancePaidCents

### Requirement: Merged Relations

Le système DOIT définir des relations sur la table appointments qui incluent toutes les relations de planification, cliniques, verrouillage et d'assurance. Aucune relation treatmentSessions n'existe.

**MODIFICATION:** Les relations appointments DOIVENT inclure: patient, therapist, organization, treatmentPlan, room, service, lockedBy, insuranceCompany. La relation insuranceCompany DOIT pointer vers la table insurance_companies.

#### Scenario: Appointments have complete relations including insurance

- **GIVEN** les relations sont définies dans server/database/relations.ts
- **WHEN** les relations appointments sont inspectées
- **THEN** elles incluent: patient, therapist, organization, treatmentPlan, room, service, lockedBy, insuranceCompany
- **AND** aucune relation treatmentSession n'existe
- **AND** la relation insuranceCompany est définie avec la table insurance_companies
