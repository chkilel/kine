# treatment-plan Specification (Delta)

## Purpose

Modifications aux spécifications des plans de traitement pour ajouter le support des compagnies d'assurance et l'héritage du contexte d'assurance.

## MODIFIED Requirements

### Requirement: Treatment Plan Pricing

Le système DOIT stocker la tarification pour chaque plan de traitement comme un objet JSON unique. Lorsqu'un plan de traitement est créé, la tarification DOIT être héritée automatiquement des tarifs de séance par défaut de l'organisation. La tarification du plan peut être remplacée à tout moment via le endpoint de mise à jour standard, et les modifications de la tarification de l'organisation NE doivent PAS affecter les plans de traitement existants.

L'objet de tarification DOIT avoir la structure suivante:

```json
{
  "clinic": number,
  "home": number,
  "telehealth": number
}
```

Tous les champs sont requis et doivent être des nombres >= 100 représentant le coût en centimes (minimum 100 centimes = 1 DH, ne peut pas être 0).

**MODIFICATION:** Le système DOIT également stocker une référence facultative à une compagnie d'assurance (`insuranceCompanyId`) sur le plan de traitement. Cette référence est la source de vérité unique pour le contexte d'assurance qui sera hérité par les rendez-vous associés à ce plan.

Lorsqu'un plan de traitement est créé avec `insuranceCompanyId`, les rendez-vous créés ultérieurement et associés à ce plan DOIVENT hériter automatiquement de ce contexte d'assurance. Les rendez-vous existants NE sont PAS modifiés rétroactivement.

#### Scenario: Treatment plan inherits org pricing on creation

- **GIVEN** une organisation existe avec pricing.sessionRates: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** POST /api/treatment-plans est appelé pour créer un nouveau plan de traitement
- **THEN** la réponse HTTP est 201 Created
- **AND** le nouveau plan de traitement a pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** la tarification correspond aux tarifs par défaut de l'organisation au moment de la création

#### Scenario: Treatment plan pricing can be updated via standard update endpoint

- **GIVEN** un plan de traitement existe avec pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** PATCH /api/treatment-plans/plan-123 est appelé avec le corps {
  pricing: {
  clinic: 5500,
  home: 7000,
  telehealth: 4500
  }
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** la tarification du plan de traitement est mise à jour
- **AND** les séances dans ce plan utiliseront ces nouveaux coûts

#### Scenario: Treatment plan pricing can be partially updated

- **GIVEN** un plan de traitement existe avec pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** PATCH /api/treatment-plans/plan-123 est appelé avec le corps {
  pricing: {
  home: 7000,
  telehealth: 4500
  }
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** pricing.home est mis à jour à 7000
- **AND** pricing.telehealth est mis à jour à 4500
- **AND** pricing.clinic reste à 5000 (inchangé)

#### Scenario: Prevent updating pricing for non-existent treatment plan

- **GIVEN** aucun plan de traitement n'existe avec l'id "nonexistent-plan"
- **WHEN** PATCH /api/treatment-plans/nonexistent-plan est appelé avec le corps {
  pricing: { clinic: 5500, home: 6500, telehealth: 4000 }
  }
- **THEN** la réponse HTTP est 404 Not Found
- **AND** un message d'erreur indique "Treatment plan not found"

#### Scenario: Validate pricing values must be >= 100

- **GIVEN** un plan de traitement existe
- **WHEN** PATCH /api/treatment-plans/plan-123 est appelé avec le corps {
  pricing: { clinic: 0, home: 6500, telehealth: 4000 }
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que les valeurs de tarification doivent être >= 100 (minimum 1 DH)

#### Scenario: Validate pricing values cannot be negative

- **GIVEN** un plan de traitement existe
- **WHEN** PATCH /api/treatment-plans/plan-123 est appelé avec le corps {
  pricing: { clinic: -100, home: 6500, telehealth: 4000 }
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que les valeurs de tarification doivent être >= 100 (minimum 1 DH)

#### Scenario: Calculate session cost using treatment plan pricing

- **GIVEN** une séance de traitement existe avec appointment.location "home"
- **AND** la séance appartient à un plan de traitement avec pricing: { clinic: 5000, home: 7000, telehealth: 4000 }
- **AND** le tarif par défaut de l'organisation pour home est 6500
- **WHEN** le coût de la séance est calculé
- **THEN** le coût final est 7000 (tarification du plan de traitement)
- **AND** le système utilise uniquement la tarification du plan, pas de repli vers la tarification de l'organisation

#### Scenario: Organization pricing changes don't affect existing plans

- **GIVEN** une organisation a pricing.sessionRates: { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** un plan de traitement existe avec pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
- **WHEN** la tarification de l'organisation est mise à jour à { clinic: 5500, home: 7000, telehealth: 4500 }
- **AND** le coût d'une séance de traitement existante est calculé pour l'ancien plan
- **THEN** le coût de la séance utilise l'ancienne tarification du plan: 6500 pour home
- **AND** le coût de la séance n'utilise PAS la nouvelle tarification de l'organisation: 7000

#### Scenario: New plan inherits updated organization pricing

- **GIVEN** une organisation a pricing.sessionRates: { clinic: 5500, home: 7000, telehealth: 4500 }
- **WHEN** POST /api/treatment-plans est appelé pour créer un nouveau plan de traitement
- **THEN** la réponse HTTP est 201 Created
- **AND** le nouveau plan de traitement a pricing: { clinic: 5500, home: 7000, telehealth: 4500 }
- **AND** la tarification correspond aux tarifs actuels de l'organisation

#### Scenario: Calculate session cost for independent appointment

- **GIVEN** une séance de traitement existe avec appointment.location "home"
- **AND** la séance n'a pas de treatmentPlanId (rendez-vous indépendant)
- **AND** le tarif par défaut de l'organisation pour home est 6500
- **WHEN** le coût de la séance est calculé
- **THEN** le coût final est 6500 (tarification par défaut de l'organisation)
- **AND** le système utilise la tarification de l'organisation car aucun plan n'existe

#### Scenario: Handle incomplete organization pricing during plan creation

- **GIVEN** une organisation a une tarification incomplète: { clinic: 5000, home: null, telehealth: 4000 }
- **WHEN** POST /api/treatment-plans est appelé pour créer un nouveau plan de traitement
- **THEN** la réponse HTTP est 201 Created
- **AND** le plan de traitement a une tarification complète: { clinic: 5000, home: 6500, telehealth: 4000 }
- **AND** la tarification home manquante est remplie avec une valeur par défaut raisonnable

#### Scenario: Create treatment plan with insurance company

- **GIVEN** une organisation existe avec une compagnie d'assurance active id="insurance-789"
- **AND** la compagnie d'assurance a sessionPriceCents=5000, coPayRule="fixed", coPayAmountCents=1000
- **WHEN** POST /api/treatment-plans est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  pricing: { clinic: 5000, home: 6500, telehealth: 4000 },
  insuranceCompanyId: "insurance-789"
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** le plan de traitement a insuranceCompanyId = "insurance-789"
- **AND** les rendez-vous créés ultérieurement avec ce plan hériteront de ce contexte d'assurance

#### Scenario: Create treatment plan without insurance company

- **GIVEN** une organisation existe
- **WHEN** POST /api/treatment-plans est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  pricing: { clinic: 5000, home: 6500, telehealth: 4000 }
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** le plan de traitement a insuranceCompanyId = NULL
- **AND** les rendez-vous créés avec ce plan n'auront pas de contexte d'assurance par défaut

#### Scenario: Update treatment plan insurance company

- **GIVEN** un plan de traitement existe avec id="plan-123" et insuranceCompanyId = NULL
- **AND** une compagnie d'assurance active existe avec id="insurance-789"
- **WHEN** PATCH /api/treatment-plans/plan-123 est appelé avec le corps {
  insuranceCompanyId: "insurance-789"
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** insuranceCompanyId est mis à jour à "insurance-789"
- **AND** les nouveaux rendez-vous créés avec ce plan hériteront de ce contexte d'assurance
- **AND** les rendez-vous existants avec ce plan conservent leur insuranceCompanyId actuel (NULL ou autre valeur)

#### Scenario: Prevent associating suspended insurance company to treatment plan

- **GIVEN** une compagnie d'assurance existe avec id="insurance-suspended" et status="suspended"
- **WHEN** POST /api/treatment-plans est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  pricing: { clinic: 5000, home: 6500, telehealth: 4000 },
  insuranceCompanyId: "insurance-suspended"
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que seules les compagnies d'assurance actives peuvent être associées aux plans de traitement

#### Scenario: Validate insurance company belongs to same organization

- **GIVEN** un utilisateur authentifié appartient à l'organisation "org-123"
- **AND** une compagnie d'assurance existe avec id="insurance-789" et organizationId="org-456"
- **WHEN** POST /api/treatment-plans est appelé avec le corps {
  patientId: "patient-123",
  therapistId: "therapist-456",
  pricing: { clinic: 5000, home: 6500, telehealth: 4000 },
  insuranceCompanyId: "insurance-789"
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que la compagnie d'assurance n'appartient pas à la même organisation

#### Scenario: Remove insurance company from treatment plan

- **GIVEN** un plan de traitement existe avec id="plan-123" et insuranceCompanyId = "insurance-789"
- **WHEN** PATCH /api/treatment-plans/plan-123 est appelé avec le corps {
  insuranceCompanyId: null
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** insuranceCompanyId est défini à NULL
- **AND** les nouveaux rendez-vous créés avec ce plan n'hériteront plus du contexte d'assurance
