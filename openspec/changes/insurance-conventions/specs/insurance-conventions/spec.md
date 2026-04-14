# insurance-conventions Specification

## Purpose

Gestion des compagnies d'assurance et des conventions pour le modèle de facturation marocain, incluant le calcul automatique des co-paiements et l'héritage du contexte d'assurance.

## ADDED Requirements

### Requirement: Insurance Company CRUD Operations

Le système DOIT permettre aux utilisateurs authentifiés de créer, lire, mettre à jour et supprimer des compagnies d'assurance dans le contexte de leur organisation. Chaque compagnie d'assurance est isolée par organisation et ne peut être accédée que par les membres de cette organisation.

La table `insurance_companies` DOIT contenir les champs suivants:

- `id` (UUID, PRIMARY KEY)
- `organizationId` (UUID, FOREIGN KEY NOT NULL, référence organizations.id)
- `name` (TEXT, NOT NULL) - nom de la compagnie d'assurance
- `code` (TEXT, NOT NULL, UNIQUE par organizationId) - identifiant externe (ex: "Wafa Assurance")
- `status` (ENUM, NOT NULL) - statut de la convention: "active", "suspended", "terminated"
- `coveragePercentage` (INTEGER, NOT NULL, 0-100) - pourcentage couvert par l'assurance
- `sessionPriceCents` (INTEGER, NOT NULL, >= 100) - prix de séance conventionné en centimes
- `coPayRule` (ENUM, NOT NULL) - règle de calcul du co-paiement: "fixed", "percentage"
- `coPayAmountCents` (INTEGER, NULLABLE) - montant fixe de co-paiement si coPayRule = "fixed"
- `coPayPercentage` (INTEGER, NULLABLE, 0-100) - pourcentage de co-paiement si coPayRule = "percentage"
- `notes` (TEXT, NULLABLE) - notes supplémentaires
- `deletedAt` (TIMESTAMP, NULLABLE) - pour la suppression douce

Toutes les opérations DOIVENT respecter le modèle de suppression douce (soft-delete). Les compagnies supprimées ne doivent pas apparaître dans les listes, mais doivent rester accessibles via l'ID pour les références historiques.

#### Scenario: Create insurance company with fixed co-pay rule

- **GIVEN** un utilisateur authentifié appartient à l'organisation "org-123"
- **WHEN** POST /api/insurance-companies est appelé avec le corps {
  name: "Wafa Assurance",
  code: "WAFA",
  status: "active",
  coveragePercentage: 80,
  sessionPriceCents: 5000,
  coPayRule: "fixed",
  coPayAmountCents: 1000
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** la nouvelle compagnie d'assurance est créée avec organizationId = "org-123"
- **AND** tous les champs sont stockés correctement
- **AND** id est un UUID valide

#### Scenario: Create insurance company with percentage co-pay rule

- **GIVEN** un utilisateur authentifié appartient à l'organisation "org-123"
- **WHEN** POST /api/insurance-companies est appelé avec le corps {
  name: "AXA Assurance",
  code: "AXA",
  status: "active",
  coveragePercentage: 70,
  sessionPriceCents: 6000,
  coPayRule: "percentage",
  coPayPercentage: 30
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** la nouvelle compagnie d'assurance est créée
- **AND** coPayRule est "percentage" et coPayPercentage est 30
- **AND** coPayAmountCents est NULL

#### Scenario: List insurance companies for organization

- **GIVEN** l'organisation "org-123" a 3 compagnies d'assurance actives
- **AND** l'organisation "org-456" a 2 compagnies d'assurance actives
- **WHEN** GET /api/insurance-companies est appelé par un utilisateur de "org-123"
- **THEN** la réponse HTTP est 200 OK
- **AND** seules les 3 compagnies de "org-123" sont retournées
- **AND** aucune compagnie de "org-456" n'est retournée
- **AND** les compagnies supprimées (deletedAt non NULL) ne sont pas incluses

#### Scenario: Get insurance company by ID

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789" et organizationId "org-123"
- **WHEN** GET /api/insurance-companies/insurance-789 est appelé par un utilisateur de "org-123"
- **THEN** la réponse HTTP est 200 OK
- **AND** tous les détails de la compagnie sont retournés
- **AND** l'utilisateur ne peut pas accéder à une compagnie d'une autre organisation

#### Scenario: Update insurance company

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789"
- **WHEN** PATCH /api/insurance-companies/insurance-789 est appelé avec le corps {
  status: "suspended",
  coveragePercentage: 75
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** status est mis à jour à "suspended"
- **AND** coveragePercentage est mis à jour à 75
- **AND** les autres champs restent inchangés

#### Scenario: Soft delete insurance company

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789"
- **WHEN** DELETE /api/insurance-companies/insurance-789 est appelé
- **THEN** la réponse HTTP est 200 OK
- **AND** deletedAt est défini à l'horodatage actuel
- **AND** la compagnie n'apparaît plus dans les listes
- **AND** la compagnie reste accessible via l'ID pour les références historiques

#### Scenario: Prevent creating insurance company with invalid co-pay rule

- **GIVEN** un utilisateur authentifié
- **WHEN** POST /api/insurance-companies est appelé avec le corps {
  name: "Test Assurance",
  code: "TEST",
  status: "active",
  coveragePercentage: 80,
  sessionPriceCents: 5000,
  coPayRule: "fixed"
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que coPayAmountCents est requis quand coPayRule est "fixed"

#### Scenario: Prevent accessing insurance company from different organization

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789" et organizationId "org-123"
- **WHEN** GET /api/insurance-companies/insurance-789 est appelé par un utilisateur de "org-456"
- **THEN** la réponse HTTP est 403 Forbidden
- **AND** un message d'erreur indique que l'utilisateur n'a pas accès à cette ressource

#### Scenario: Validate unique code per organization

- **GIVEN** une compagnie d'assurance existe avec code "WAFA" et organizationId "org-123"
- **WHEN** POST /api/insurance-companies est appelé avec le corps {
  name: "Autre Wafa",
  code: "WAFA",
  status: "active",
  coveragePercentage: 80,
  sessionPriceCents: 5000,
  coPayRule: "fixed",
  coPayAmountCents: 1000
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que le code existe déjà pour cette organisation

#### Scenario: Allow same code in different organizations

- **GIVEN** une compagnie d'assurance existe avec code "WAFA" et organizationId "org-123"
- **WHEN** POST /api/insurance-companies est appelé par un utilisateur de "org-456" avec le corps {
  name: "Wafa Assurance",
  code: "WAFA",
  status: "active",
  coveragePercentage: 80,
  sessionPriceCents: 5000,
  coPayRule: "fixed",
  coPayAmountCents: 1000
  }
- **THEN** la réponse HTTP est 201 Created
- **AND** la nouvelle compagnie est créée avec le même code dans une organisation différente

### Requirement: Insurance Coverage Calculation

Le système DOIT calculer automatiquement les montants de co-paiement et d'assurance basés sur les règles de la convention d'assurance. Le calcul s'effectue selon la règle de co-paiement définie (fixed ou percentage).

**Formule de calcul:**

Pour la règle `fixed`:

```
coPayCents = insuranceCompany.coPayAmountCents
insuranceCents = insuranceCompany.sessionPriceCents - coPayCents
```

Pour la règle `percentage`:

```
coPayCents = insuranceCompany.sessionPriceCents * (insuranceCompany.coPayPercentage / 100)
insuranceCents = insuranceCompany.sessionPriceCents - coPayCents
```

Le montant total DOIT toujours être égal à `insuranceCompany.sessionPriceCents`.

#### Scenario: Calculate co-pay with fixed rule

- **GIVEN** une compagnie d'assurance existe avec sessionPriceCents = 5000, coPayRule = "fixed", coPayAmountCents = 1000
- **WHEN** le calcul de couverture est effectué
- **THEN** coPayCents = 1000
- **AND** insuranceCents = 4000
- **AND** total = 5000

#### Scenario: Calculate co-pay with percentage rule

- **GIVEN** une compagnie d'assurance existe avec sessionPriceCents = 5000, coPayRule = "percentage", coPayPercentage = 20
- **WHEN** le calcul de couverture est effectué
- **THEN** coPayCents = 1000 (5000 \* 0.20)
- **AND** insuranceCents = 4000
- **AND** total = 5000

#### Scenario: Handle 100% coverage (no co-pay)

- **GIVEN** une compagnie d'assurance existe avec sessionPriceCents = 5000, coPayRule = "percentage", coPayPercentage = 0
- **WHEN** le calcul de couverture est effectué
- **THEN** coPayCents = 0
- **AND** insuranceCents = 5000
- **AND** total = 5000

#### Scenario: Handle 0% coverage (full co-pay)

- **GIVEN** une compagnie d'assurance existe avec sessionPriceCents = 5000, coPayRule = "percentage", coPayPercentage = 100
- **WHEN** le calcul de couverture est effectué
- **THEN** coPayCents = 5000
- **AND** insuranceCents = 0
- **AND** total = 5000

#### Scenario: Calculate with coverage percentage attribute

- **GIVEN** une compagnie d'assurance existe avec coveragePercentage = 80 et sessionPriceCents = 5000
- **WHEN** le calcul de l'attribut coveragePercentage est effectué
- **THEN** insuranceCents = 4000 (5000 \* 0.80)
- **AND** ceci est distinct du calcul de co-paiement basé sur coPayRule

### Requirement: Insurance Context Inheritance

Le système DOIT permettre l'héritage du contexte d'assurance d'un plan de traitement vers ses rendez-vous associés. Le champ `insuranceCompanyId` sur `treatment_plans` est la source de vérité unique. Les rendez-vous liés à ce plan DOIVENT hériter automatiquement de ce contexte.

L'héritage s'applique aux rendez-vous créés après l'association de l'assurance au plan de traitement. Les rendez-vous existants NE sont PAS modifiés rétroactivement.

#### Scenario: Inherit insurance context from treatment plan

- **GIVEN** un plan de traitement existe avec id "plan-123" et insuranceCompanyId = "insurance-789"
- **AND** la compagnie d'assurance "insurance-789" a sessionPriceCents = 5000, coPayRule = "fixed", coPayAmountCents = 1000
- **WHEN** un nouveau rendez-vous est créé avec treatmentPlanId = "plan-123"
- **THEN** le rendez-vous a insuranceCompanyId = "insurance-789" (hérité)
- **AND** expectedCoPayCents = 1000 (calculé automatiquement)
- **AND** expectedInsuranceCents = 4000 (calculé automatiquement)

#### Scenario: Do not retroactively update existing appointments

- **GIVEN** un plan de traitement existe avec id "plan-123" et insuranceCompanyId = NULL
- **AND** 3 rendez-vous existent déjà avec treatmentPlanId = "plan-123" et insuranceCompanyId = NULL
- **WHEN** le plan de traitement est mis à jour avec insuranceCompanyId = "insurance-789"
- **THEN** les 3 rendez-vous existants conservent insuranceCompanyId = NULL
- **AND** seuls les nouveaux rendez-vous créés après la mise à jour héritent de l'assurance

#### Scenario: Create appointment without treatment plan

- **GIVEN** aucun plan de traitement n'est associé
- **WHEN** un rendez-vous est créé sans treatmentPlanId
- **THEN** insuranceCompanyId peut être spécifié manuellement (NULL par défaut)
- **AND** si insuranceCompanyId est fourni, les montants sont calculés automatiquement
- **AND** si insuranceCompanyId est NULL, les montants attendus sont NULL

#### Scenario: Prevent mismatched insurance context

- **GIVEN** un plan de traitement existe avec insuranceCompanyId = "insurance-789"
- **AND** un rendez-vous existe avec treatmentPlanId = "plan-123"
- **WHEN** PATCH /api/appointments/apt-456 est appelé avec body { insuranceCompanyId: "insurance-999" }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que le contexte d'assurance doit correspondre à celui du plan de traitement

#### Scenario: Allow null insurance on appointment with insured treatment plan

- **GIVEN** un plan de traitement existe avec insuranceCompanyId = "insurance-789"
- **WHEN** un rendez-vous est créé avec treatmentPlanId = "plan-123" et insuranceCompanyId = NULL
- **THEN** la réponse HTTP est 201 Created
- **AND** insuranceCompanyId est NULL
- **AND** expectedCoPayCents et expectedInsuranceCents sont NULL

### Requirement: Insurance Status Management

Le système DOIT gérer les statuts de convention d'assurance: "active", "suspended", "terminated". Seules les compagnies avec le statut "active" DOIVENT être disponibles pour l'association aux nouveaux plans de traitement.

Les compagnies avec le statut "suspended" ou "terminated" NE doivent PAS être supprimées (elles restent accessibles pour l'historique), mais ne doivent pas être disponibles pour de nouvelles associations.

#### Scenario: List only active insurance companies for selection

- **GIVEN** l'organisation a 5 compagnies: 3 "active", 1 "suspended", 1 "terminated"
- **WHEN** GET /api/insurance-companies?status=active est appelé
- **THEN** seules les 3 compagnies "active" sont retournées
- **AND** les compagnies "suspended" et "terminated" ne sont pas incluses

#### Scenario: Prevent associating suspended insurance to new treatment plan

- **GIVEN** une compagnie d'assurance existe avec status = "suspended"
- **WHEN** POST /api/treatment-plans est appelé avec body { insuranceCompanyId: "insurance-suspended" }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que seules les compagnies actives peuvent être associées

#### Scenario: Allow associating suspended insurance to existing treatment plan

- **GIVEN** un plan de traitement existe déjà avec insuranceCompanyId = "insurance-789" (status = "active")
- **AND** la compagnie est mise à jour à status = "suspended"
- **WHEN** le plan de traitement est consulté
- **THEN** insuranceCompanyId reste "insurance-789"
- **AND** les rendez-vous existants continuent d'utiliser cette compagnie
- **AND** les nouveaux rendez-vous héritent toujours du contexte (bien que la compagnie soit suspendue)

#### Scenario: Prevent creating insurance company with invalid status

- **GIVEN** un utilisateur authentifié
- **WHEN** POST /api/insurance-companies est appelé avec le corps {
  name: "Test Assurance",
  code: "TEST",
  status: "invalid",
  coveragePercentage: 80,
  sessionPriceCents: 5000,
  coPayRule: "fixed",
  coPayAmountCents: 1000
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que le statut doit être "active", "suspended" ou "terminated"

### Requirement: Insurance Payment Tracking

Le système DOIT permettre le suivi des paiements réels sur les rendez-vous, distincts des montants attendus calculés automatiquement. Les champs de suivi des paiements DOIVENT être sur la table `appointments`:

- `expectedCoPayCents` (INTEGER, NULLABLE) - co-paiement attendu (calculé automatiquement)
- `expectedInsuranceCents` (INTEGER, NULLABLE) - paiement d'assurance attendu (calculé automatiquement)
- `coPayPaidCents` (INTEGER, NULLABLE, default 0) - montant de co-paiement payé par le patient
- `insurancePaidCents` (INTEGER, NULLABLE, default 0) - montant payé par l'assurance

Les montants attendus (expected) sont en lecture seule et calculés automatiquement. Les montants réels (paid) sont saisis manuellement par l'utilisateur.

#### Scenario: Track payment amounts on appointment

- **GIVEN** un rendez-vous existe avec expectedCoPayCents = 1000 et expectedInsuranceCents = 4000
- **WHEN** PATCH /api/appointments/apt-123/payments est appelé avec body {
  coPayPaidCents: 1000,
  insurancePaidCents: 4000
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** coPayPaidCents est mis à jour à 1000
- **AND** insurancePaidCents est mis à jour à 4000
- **AND** expectedCoPayCents et expectedInsuranceCents restent inchangés

#### Scenario: Track partial payments

- **GIVEN** un rendez-vous existe avec expectedCoPayCents = 1000 et expectedInsuranceCents = 4000
- **WHEN** PATCH /api/appointments/apt-123/payments est appelé avec body {
  coPayPaidCents: 500,
  insurancePaidCents: 2000
  }
- **THEN** la réponse HTTP est 200 OK
- **AND** coPayPaidCents est mis à jour à 500 (paiement partiel)
- **AND** insurancePaidCents est mis à jour à 2000 (paiement partiel)

#### Scenario: Prevent modifying expected amounts manually

- **GIVEN** un rendez-vous existe
- **WHEN** PATCH /api/appointments/apt-123 est appelé avec body {
  expectedCoPayCents: 1500
  }
- **THEN** la réponse HTTP est 400 Bad Request
- **AND** un message d'erreur indique que les montants attendus sont calculés automatiquement et ne peuvent pas être modifiés manuellement

#### Scenario: Recalculate expected amounts when insurance changes

- **GIVEN** un rendez-vous existe avec insuranceCompanyId = "insurance-789" (sessionPriceCents = 5000, coPayAmountCents = 1000)
- **AND** expectedCoPayCents = 1000, expectedInsuranceCents = 4000
- **WHEN** la compagnie d'assurance est mise à jour à coPayAmountCents = 1500
- **AND** le rendez-vous est recalculé
- **THEN** expectedCoPayCents = 1500
- **AND** expectedInsuranceCents = 3500
- **AND** coPayPaidCents et insurancePaidCents restent inchangés

#### Scenario: Handle payments without insurance

- **GIVEN** un rendez-vous existe avec insuranceCompanyId = NULL
- **WHEN** le rendez-vous est créé
- **THEN** expectedCoPayCents = NULL
- **AND** expectedInsuranceCents = NULL
- **AND** coPayPaidCents = 0
- **AND** insurancePaidCents = 0

### Requirement: Insurance Company Organization Isolation

Le système DOIT assurer une isolation stricte des données de compagnie d'assurance par organisation. Aucune compagnie d'assurance ne doit être accessible ou visible par les utilisateurs d'une organisation différente.

Toutes les requêtes API DOIVENT vérifier automatiquement que l'utilisateur authentifié appartient à l'organisation de la compagnie d'assurance ciblée.

#### Scenario: Query automatically filters by organization

- **GIVEN** l'utilisateur authentifié appartient à l'organisation "org-123"
- **AND** l'organisation "org-123" a 3 compagnies d'assurance
- **AND** l'organisation "org-456" a 5 compagnies d'assurance
- **WHEN** GET /api/insurance-companies est appelé
- **THEN** seules les 3 compagnies de "org-123" sont retournées
- **AND** aucune compagnie de "org-456" n'est retournée
- **AND** aucun filtre organizationId explicite n'est nécessaire dans la requête

#### Scenario: Prevent cross-organization access on read

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789" et organizationId "org-123"
- **WHEN** GET /api/insurance-companies/insurance-789 est appelé par un utilisateur de "org-456"
- **THEN** la réponse HTTP est 403 Forbidden
- **AND** un message d'erreur indique que la ressource n'existe pas ou que l'utilisateur n'a pas accès

#### Scenario: Prevent cross-organization update

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789" et organizationId "org-123"
- **WHEN** PATCH /api/insurance-companies/insurance-789 est appelé par un utilisateur de "org-456"
- **THEN** la réponse HTTP est 403 Forbidden
- **AND** la compagnie n'est pas modifiée

#### Scenario: Prevent cross-organization delete

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789" et organizationId "org-123"
- **WHEN** DELETE /api/insurance-companies/insurance-789 est appelé par un utilisateur de "org-456"
- **THEN** la réponse HTTP est 403 Forbidden
- **AND** la compagnie n'est pas supprimée

#### Scenario: Soft-delete maintains organization isolation

- **GIVEN** une compagnie d'assurance existe avec id "insurance-789", organizationId "org-123", et deletedAt non NULL
- **WHEN** GET /api/insurance-companies est appelé par un utilisateur de "org-123"
- **THEN** la compagnie supprimée n'apparaît pas dans les résultats
- **AND** si l'utilisateur tente d'accéder directement à cette compagnie via l'ID
- **THEN** la compagnie est accessible (pour les références historiques)
- **AND** l'organisation de l'utilisateur est toujours vérifiée
