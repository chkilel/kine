## Context

Le système actuel de Kine ne gère pas les conventions d'assurance adaptées au modèle marocain. Les kinésithérapeutes marocains travaillent avec des compagnies d'assurance via des conventions qui définissent des pourcentages de couverture et des règles de co-paiement. Actuellement, il n'existe aucune infrastructure pour:

- Gérer les relations avec les compagnies d'assurance
- Stocker les attributs de convention (pourcentage de couverture, prix par séance, règles de co-paiement)
- Hériter du contexte d'assurance d'un plan de traitement vers ses rendez-vous
- Calculer automatiquement les co-paiements et les paiements d'assurance
- Assurer l'isolation des données par organisation pour les compagnies d'assurance

Le projet utilise Cloudflare D1 (SQLite) avec Drizzle ORM, avec un modèle de suppression douce (soft-delete) sur toutes les données. L'architecture est multi-tenant avec une isolation stricte basée sur les organisations.

## Goals / Non-Goals

**Goals:**

- Créer une infrastructure complète pour gérer les compagnies d'assurance et leurs conventions
- Permettre l'héritage du contexte d'assurance des plans de traitement vers les rendez-vous
- Calculer automatiquement les montants de co-paiement et d'assurance
- Assurer l'isolation multi-tenant pour toutes les données d'assurance
- Maintenir la compatibilité avec l'architecture existante (soft-delete, Drizzle ORM, API RESTful)
- Supporter le modèle de facturation par convention spécifique au Maroc

**Non-Goals:**

- Gestion des réclamations d'assurance (remboursements)
- Portail patient pour consulter leur couverture
- Intégration directe avec les systèmes des compagnies d'assurance
- Gestion des contrats d'assurance côté patient
- Facturation complexe avec plusieurs compagnies par rendez-vous
- Historique des changements de convention pour une compagnie

## Decisions

### 1. Source de vérité pour le contexte d'assurance

**Decision:** Le `insuranceCompanyId` sur `treatment_plans` est la source de vérité unique pour le contexte d'assurance. Les rendez-vous héritent de ce contexte via une FK nullable.

**Rationale:**

- Les plans de traitement représentent une série de séances pour une condition spécifique, souvent entièrement couverte par une seule convention
- Cela évite la redondance et les incohérences potentielles
- Simplifie le calcul automatique lors de la création de rendez-vous

**Alternatives considérées:**

- Stocker `insuranceCompanyId` uniquement sur `appointments` (rejeté: redondant, difficile à maintenir cohérent)
- Permettre des compagnies d'assurance différentes par rendez-vous dans un même plan (rejeté: complexité inutile pour le cas d'usage marocain)

### 2. Modèle de données pour les compagnies d'assurance

**Decision:** Nouvelle table `insurance_companies` avec les champs suivants:

- `id` (UUID, PK)
- `organizationId` (UUID, FK, NOT NULL) - isolation multi-tenant
- `name` (text, NOT NULL)
- `code` (text, UNIQUE, NOT NULL) - identifiant externe (ex: "Wafa Assurance")
- `status` (enum: active/suspended/terminated, NOT NULL)
- `coveragePercentage` (integer, 0-100, NOT NULL) - pourcentage couvert par l'assurance
- `sessionPriceCents` (integer, NOT NULL) - prix de séance conventionné
- `coPayRule` (enum: fixed/percentage, NOT NULL) - règle de calcul du co-paiement
- `coPayAmountCents` (integer, NULLABLE) - montant fixe de co-paiement si règle = fixed
- `coPayPercentage` (integer, 0-100, NULLABLE) - pourcentage de co-paiement si règle = percentage
- `notes` (text, NULLABLE)
- `deletedAt` (timestamp, NULLABLE) - soft-delete

**Rationale:**

- Structure flexible qui supporte différents modèles de convention (pourcentage fixe, montant fixe, règles personnalisées)
- Isolation stricte par organisation via `organizationId`
- Code externe pour l'intégration future avec des systèmes d'assurance
- Statut pour gérer les conventions suspendues ou terminées

**Alternatives considérées:**

- Table séparée pour les règles de co-paiement (rejeté: sur-architecture pour ce cas d'usage)
- Calcul dynamique basé sur des formules stockées (rejeté: complexité inutile, moins performant)

### 3. Champs de suivi des paiements sur les rendez-vous

**Decision:** Ajouter les champs suivants à `appointments`:

- `insuranceCompanyId` (UUID, FK, NULLABLE) - hérité du plan de traitement
- `expectedCoPayCents` (integer, NULLABLE) - co-paiement attendu calculé automatiquement
- `expectedInsuranceCents` (integer, NULLABLE) - paiement d'assurance attendu calculé automatiquement
- `coPayPaidCents` (integer, NULLABLE, default 0) - montant de co-paiement payé par le patient
- `insurancePaidCents` (integer, NULLABLE, default 0) - montant payé par l'assurance

**Rationale:**

- Séparation claire entre les montants attendus (calculés) et les montants réels (saisis manuellement)
- Permet le suivi des paiements partiels et des écarts
- Supporte le workflow de facturation: création → calcul → paiement → réconciliation

**Alternatives considérées:**

- Table séparée pour les paiements (rejeté: overkill pour le cas d'usage actuel)
- Champs de paiement uniquement sur les factures (rejeté: besoin de suivi au niveau rendez-vous)

### 4. Calcul automatique des montants

**Decision:** Le calcul des montants (co-paiement et assurance) s'effectue:

- À la création d'un rendez-vous lié à un plan de traitement avec assurance
- À la modification de la convention d'assurance d'un plan de traitement (mise à jour en cascade des rendez-vous futurs, pas des passés)

**Rationale:**

- Automatisation réduit les erreurs humaines
- Les rendez-vous passés ne sont pas modifiés pour préserver l'historique de facturation
- Le calcul est dérivé, pas stocké comme vérité unique

**Logique de calcul:**

```
total = insuranceCompany.sessionPriceCents

if insuranceCompany.coPayRule == 'fixed':
  coPay = insuranceCompany.coPayAmountCents
  insurance = total - coPay
elif insuranceCompany.coPayRule == 'percentage':
  coPay = total * (insuranceCompany.coPayPercentage / 100)
  insurance = total - coPay
```

### 5. Migration de données existantes

**Decision:** Les plans de traitement et rendez-vous existants auront `insuranceCompanyId` NULL. Aucune rétroactivité sur les données historiques.

**Rationale:**

- Approche non-breaking pour les données existantes
- Les utilisateurs pourront associer des assurances aux nouveaux plans de traitement
- Les données historiques restent inchangées

## Risks / Trade-offs

### Risque 1: Incohérence entre le contexte d'assurance du plan et des rendez-vous

**Description:** Un utilisateur pourrait modifier manuellement l'`insuranceCompanyId` d'un rendez-vous, le rendant différent de celui du plan de traitement parent.

**Mitigation:**

- Valider à l'API que si un rendez-vous est lié à un plan de traitement avec `insuranceCompanyId`, le rendez-vous doit avoir le même `insuranceCompanyId` ou NULL
- Documenter clairement que le contexte d'assurance doit être hérité du plan
- Considérer un trigger de base de données pour forcer cette contrainte (si D1 le supporte)

### Risque 2: Complexité du calcul des co-paiements

**Description:** Les règles de co-paiement pourraient évoluer vers des formules plus complexes (plafonds, franchises, etc.).

**Mitigation:**

- Architecture extensible: ajouter de nouveaux champs à `insurance_companies` plutôt que changer le modèle de données
- Prévoir une table `insurance_company_rules` pour des règles complexes si nécessaire dans le futur
- Documenter les limites actuelles du modèle

### Risque 3: Performance des requêtes avec jointures multiples

**Description:** Les requêtes sur les rendez-vous nécessiteront des jointures avec `treatment_plans` et `insurance_companies`, ce qui pourrait impacter les performances.

**Mitigation:**

- Utiliser les requêtes relationnelles de Drizzle pour optimiser les jointures
- Indexer `insuranceCompanyId` sur `treatment_plans` et `appointments`
- Considérer la dénormalisation si les performances sont problématiques (ajouter des champs calculés sur `appointments`)

### Trade-off 1: Flexibilité vs Simplicité

**Description:** Le modèle actuel supporte les règles de co-paiement fixes et en pourcentage, mais pas les formules complexes.

**Décision:** Prioriser la simplicité pour le MVP, avec une architecture extensible pour l'évolution future. Le modèle marocain actuel se contente généralement de ces deux types de règles.

### Trade-off 2: Rétroactivité vs Préserver l'historique

**Description:** Modifier la convention d'assurance d'un plan de traitement pourrait-elle impacter les rendez-vous passés?

**Décision:** Non, les rendez-vous passés conservent leurs montants calculés originaux pour préserver l'historique de facturation. Seuls les rendez-vous futurs sont recalculés.

## Migration Plan

### Étapes de déploiement

1. **Phase 1: Schema Database**
   - Créer la table `insurance_companies` via Drizzle migration
   - Ajouter `insuranceCompanyId` à `treatment_plans` (nullable)
   - Ajouter les champs de paiement à `appointments` (nullable)
   - Créer les index nécessaires
   - Exécuter la migration sur l'environnement de développement

2. **Phase 2: Backend API**
   - Implémenter les routes CRUD pour `insurance_companies`
   - Modifier les routes `treatment_plans` pour supporter `insuranceCompanyId`
   - Modifier les routes `appointments` pour supporter les nouveaux champs et le calcul automatique
   - Ajouter la logique de calcul des co-paiements
   - Tester les API avec Postman/Insomnia

3. **Phase 3: Frontend UI**
   - Créer la page de gestion des compagnies d'assurance (`/settings/insurance-companies`)
   - Modifier le formulaire de création/édition de plans de traitement
   - Modifier le formulaire de création/édition de rendez-vous
   - Ajouter l'affichage des montants calculés sur les rendez-vous
   - Tester l'ensemble du workflow

4. **Phase 4: Tests et Validation**
   - Écrire des tests unitaires pour la logique de calcul
   - Écrire des tests d'intégration pour les API
   - Effectuer des tests manuels sur l'environnement de staging
   - Valider l'isolation multi-tenant

5. **Phase 5: Déploiement Production**
   - Exécuter la migration sur la base de données de production (D1 remote)
   - Déployer le code sur Cloudflare Workers
   - Surveiller les erreurs et les performances
   - Former les utilisateurs au nouveau flux de travail

### Stratégie de rollback

- **Rollback base de données:** Supprimer les colonnes ajoutées et la table `insurance_companies` via une migration de rollback
- **Rollback code:** Revenir à la version précédente via git et redéployer
- **Rollback données:** Les rendez-vous créés avec le nouveau système auront des champs NULL après le rollback, ce qui est acceptable car ils étaient nullable initialement

## Open Questions

1. **Q:** Doit-on permettre à un utilisateur de modifier manuellement les montants calculés (expectedCoPayCents, expectedInsuranceCents) sur un rendez-vous?

   **A:** Non, les montants calculés doivent être en lecture seule pour éviter les incohérences. Si un ajustement est nécessaire, l'utilisateur doit modifier la convention d'assurance ou créer une exception manuelle via les champs de paiement réels (coPayPaidCents, insurancePaidCents).

2. **Q:** Comment gérer les rendez-vous qui n'ont pas de plan de traitement parent?

   **A:** Ces rendez-vous peuvent avoir un `insuranceCompanyId` direct (saisi manuellement) ou NULL (pas d'assurance). Le calcul s'effectue uniquement si `insuranceCompanyId` est présent.

3. **Q:** Doit-on journaliser les changements de convention d'assurance pour les compagnies?

   **A:** Non, hors scope pour le MVP. Si nécessaire dans le futur, implémenter une table d'audit ou un champ `version` sur `insurance_companies`.

4. **Q:** Comment gérer les compagnies d'assurance qui ont des règles différentes selon le type de traitement?

   **A:** Pour le MVP, une convention par compagnie avec une règle unique. Si nécessaire dans le futur, créer une table `insurance_convention_types` pour associer plusieurs conventions à une compagnie selon le type de traitement.
