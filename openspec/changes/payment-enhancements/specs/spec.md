## ADDED Requirements

### Requirement: Payment payer attribution

Le système DOIT permettre d'attribuer chaque paiement à un payeur spécifique (patient ou compagnie d'assurance).

#### Scenario: Création d'un paiement avec payeur patient

- **LORSQUE** un utilisateur crée un paiement avec `payerType` défini à "patient"
- **ALORS** le système enregistre le paiement sans exiger `payerInsuranceCompanyId`
- **ET** `payerInsuranceCompanyId` est NULL dans la base de données

#### Scenario: Création d'un paiement avec payeur assurance

- **LORSQUE** un utilisateur crée un paiement avec `payerType` défini à "insurance_company"
- **ET** fournit un `payerInsuranceCompanyId` valide
- **ALORS** le système enregistre le paiement avec l'ID de la compagnie d'assurance
- **ET** valide que la compagnie d'assurance appartient à la même organisation

#### Scenario: Tentative de création de paiement sans payerType

- **LORSQUE** un utilisateur tente de créer un paiement sans spécifier `payerType`
- **ALORS** le système retourne une erreur de validation
- **ET** le message indique que `payerType` est requis

#### Scenario: Tentative de paiement assurance sans compagnie

- **LORSQUE** un utilisateur tente de créer un paiement avec `payerType` à "insurance_company"
- **ET** ne fournit pas `payerInsuranceCompanyId`
- **ALORS** le système retourne une erreur de validation
- **ET** le message indique que `payerInsuranceCompanyId` est requis pour les paiements d'assurance

### Requirement: Payment allocations

Le système DOIT permettre d'allouer un paiement à une facture, un rendez-vous, ou les deux, avec suivi de la portion allouée.

#### Scenario: Allocation d'un paiement à un rendez-vous uniquement

- **LORSQUE** un utilisateur alloue un paiement à un rendez-vous avec `portion` défini à "full"
- **ET** ne spécifie pas de facture
- **ALORS** le système crée une allocation de paiement avec `invoiceId` NULL
- **ET** `appointmentId` contient l'ID du rendez-vous
- **ET** `portion` est enregistré comme "full"

#### Scenario: Allocation d'un paiement à une facture et un rendez-vous

- **LORSQUE** un utilisateur alloue un paiement à la fois à une facture et un rendez-vous
- **ET** spécifie `portion` comme "copay"
- **ALORS** le système crée une allocation avec les deux `invoiceId` et `appointmentId`
- **ET** `portion` est enregistré comme "copay"

#### Scenario: Allocation d'un paiement d'assurance

- **LORSQUE** un utilisateur alloue un paiement d'assurance
- **ET** spécifie `portion` comme "insurance"
- **ALORS** le système enregistre l'allocation avec `portion` à "insurance"
- **ET** peut lier à la facture, au rendez-vous, ou aux deux

#### Scenario: Liste des allocations pour un paiement

- **LORSQUE** un utilisateur demande les allocations pour un paiement spécifique
- **ALORS** le système retourne toutes les allocations liées à ce paiement
- **ET** inclut les détails des factures et rendez-vous liés si disponibles

### Requirement: Credit notes

Le système DOIT permettre de créer des avoirs pour corriger ou rembourser des factures, avec un pattern de ledger immuable.

#### Scenario: Création d'un avoir de correction

- **LORSQUE** un utilisateur crée un avoir avec `type` défini à "correction"
- **ET** spécifie le motif et le montant
- **ALORS** le système crée un avoir avec le statut "draft"
- **ET** l'avoir n'est pas encore appliqué aux factures
- **ET** l'enregistrement est immuable (non modifiable après création)

#### Scenario: Création d'un avoir de remboursement

- **LORSQUE** un utilisateur crée un avoir avec `type` défini à "refund"
- **ET** spécifie le motif et le montant
- **ALORS** le système crée un avoir avec le statut "draft"
- **ET** prépare l'avoir pour le traitement de remboursement

#### Scenario: Émission d'un avoir

- **LORSQUE** un utilisateur change le statut d'un avoir de "draft" à "issued"
- **ALORS** le système génère un numéro de référence unique
- **ET** l'avoir devient applicable aux factures
- **ET** l'action est journalisée pour audit

#### Scenario: Annulation d'un avoir

- **LORSQUE** un utilisateur annule un avoir avec le statut "draft" ou "issued"
- **ALORS** le système change le statut à "cancelled"
- **ET** l'avoir ne peut plus être appliqué aux factures
- **ET** la raison de l'annulation est enregistrée

#### Scenario: Tentative de modification d'un avoir émis

- **LORSQUE** un utilisateur tente de modifier un avoir avec le statut "issued"
- **ALORS** le système rejette la modification
- **ET** retourne une erreur indiquant que les avoirs émis sont immuables

### Requirement: Credit note allocations

Le système DOIT permettre d'allouer des avoirs aux factures pour réduire ou annuler les montants dus.

#### Scenario: Allocation d'un avoir à une facture

- **LORSQUE** un utilisateur alloue un avoir à une facture
- **ET** spécifie le montant à appliquer
- **ALORS** le système crée une allocation d'avoir
- **ET** déduit le montant du solde de la facture
- **ET** valide que le montant alloué ne dépasse pas le montant de l'avoir

#### Scenario: Allocation partielle d'un avoir

- **LORSQUE** un utilisateur alloue une partie d'un avoir à une facture
- **ET** l'avoir a un solde restant
- **ALORS** le système crée une allocation partielle
- **ET** maintient le solde restant de l'avoir
- **ET** l'avoir peut être alloué à d'autres factures

#### Scenario: Liste des allocations pour un avoir

- **LORSQUE** un utilisateur demande les allocations pour un avoir spécifique
- **ALORS** le système retourne toutes les allocations liées à cet avoir
- **ET** inclut le montant alloué et les détails des factures
- **ET** calcule le solde restant de l'avoir

#### Scenario: Validation du solde d'avoir

- **LORSQUE** un utilisateur tente d'allouer un montant supérieur au solde de l'avoir
- **ALORS** le système rejette l'allocation
- **ET** retourne une erreur indiquant le montant maximum allouable
