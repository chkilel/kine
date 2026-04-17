## Context

Le système de paiement actuel de Kine présente deux lacunes critiques : l'absence d'attribution de payeur (impossible de distinguer si un paiement provient du patient ou de la mutuelle) et l'absence de lien direct entre paiement et facture. La table V1 `appointment_payment_items` ne lie les paiements qu'aux rendez-vous, ce qui rend les factures orphelines. Cela brise la traçabilité financière nécessaire pour le système de co-paiement au Maroc.

La base de données actuelle utilise Cloudflare D1 (SQLite) avec Drizzle ORM. L'application suit le modèle multi-tenant avec isolation stricte des données par organisation. Tous les modèles de données utilisent le pattern de suppression douce (soft-delete) via `deleted_at`.

L'architecture de l'application est basée sur Nuxt 4 avec Nitro côté serveur, déployée sur Cloudflare Workers. Les API suivent un schéma RESTful avec validation Zod sur toutes les requêtes/réponses.

## Goals / Non-Goals

**Goals:**

- Permettre l'attribution de payeur pour chaque paiement (patient ou mutuelle)
- Créer une table de liaison flexible entre paiements, factures et rendez-vous
- Implémenter un système d'avoirs (credit notes) pour les corrections de facture
- Étendre les types de paiements et méthodes de paiement existants
- Maintenir la compatibilité avec le système de suppression douce
- Assurer l'intégrité des données financières avec un pattern de ledger immuable

**Non-Goals:**

- Implémentation complète du système de facturation (ce sera fait ultérieurement)
- Intégration directe avec les systèmes d'assurance (hors de portée pour le moment)
- Interface utilisateur de facturation (limitée aux modifications nécessaires pour les paiements)
- Gestion des paiements récurrents ou automatiques
- Portail patient pour les paiements en ligne

## Decisions

### Decision 1: Remplacement de `appointment_payment_items` par `payment_allocations`

**Rationale:**
La table `appointment_payment_items` actuelle lie uniquement les paiements aux rendez-vous, ce qui ne permet pas de relier les paiements aux factures futures. Le nouveau modèle `payment_allocations` utilise une approche plus flexible avec des clés étrangères nullable vers `invoices` et `appointments`, et un champ `portion` pour distinguer entre paiement complet, co-paiement patient et paiement d'assurance.

**Alternatives considérées:**

1. **Conserver `appointment_payment_items` et ajouter `invoice_payment_items`** : Cette approche dupliquerait la logique et rendrait les requêtes plus complexes.
2. **Utiliser une table polymorphe** : Trop complexe pour SQLite/D1 et difficile à maintenir.
3. **Remplacer par `payment_allocations`** : Choisi pour sa flexibilité et sa simplicité relative.

### Decision 2: Ajout de `payerType` et `payerInsuranceCompanyId` dans la table `payments`

**Rationale:**
Permet de distinguer la source du financement (patient vs mutuelle) et de lier le paiement à une mutuelle spécifique. C'est essentiel pour le système de co-paiement marocain où les deux parties paient des portions différentes.

**Alternatives considérées:**

1. **Créer une table `payment_payers` séparée** : Surcouche inutile pour une simple attribution.
2. **Utiliser une colonne `source` générique** : Moins explicite et sans validation de type.
3. **Ajouter directement dans `payments`** : Choisi pour la simplicité et la clarté.

### Decision 3: Pattern immuable pour `credit_notes`

**Rationale:**
Les avoirs représentent des enregistrements financiers critiques qui ne doivent jamais être modifiés après création. Le pattern immuable assure la traçabilité complète et la conformité aux régulations financières.

**Alternatives considérées:**

1. **Modèle mutable avec historique** : Plus complexe et risqué pour la cohérence des données.
2. **Système de versioning** : Surdimensionné pour ce cas d'usage.
3. **Pattern immuable** : Choisi pour sa robustesse et sa simplicité.

### Decision 4: FK nullable vers `invoices` dans `payment_allocations`

**Rationale:**
Permet d'implémenter le système de paiement-allocation maintenant, avant que le système de facturation ne soit complet. Les paiements peuvent être liés aux rendez-vous uniquement, et le lien vers la facture peut être ajouté plus tard.

**Alternatives considérées:**

1. **Attendre l'implémentation complète des factures** : Bloquerait les améliorations de paiement nécessaires.
2. **Créer deux tables séparées** : Duplicat inutile et complexité additionnelle.
3. **FK nullable** : Choisi pour permettre une implémentation progressive.

### Decision 5: Extension des enums plutôt que création de nouveaux enums séparés

**Rationale:**
Les types de paiement et méthodes de paiement existants (`PAYMENT_TYPES`, `PAYMENT_METHODS`) sont étendus plutôt que créés comme nouveaux enums séparés pour éviter la fragmentation et maintenir la cohérence.

**Alternatives considérées:**

1. **Créer `INSURANCE_PAYMENT_TYPES` et `INSURANCE_PAYMENT_METHODS`** : Plus verbeux et moins cohérent.
2. **Utiliser des enums génériques avec un champ de sous-type** : Trop complexe.
3. **Étendre les enums existants** : Choisi pour la simplicité et la cohérence.

## Risks / Trade-offs

### Risk 1: Migration de données depuis `appointment_payment_items`

**Risk**: La table `appointment_payment_items` contient potentiellement des données existantes qui doivent être migrées vers `payment_allocations`. Une migration incorrecte pourrait entraîner une perte de traçabilité financière.

**Mitigation**:

- Créer un script de migration qui préserve toutes les données existantes
- Tester la migration sur une copie de la base de données de production
- Inclure des validations pour vérifier l'intégrité des données après migration
- Conserver la table `appointment_payment_items` en backup pendant une période

### Risk 2: Performance des requêtes avec la nouvelle table `payment_allocations`

**Risk**: Les requêtes devront joindre `payments` avec `payment_allocations`, et potentiellement `invoices` ou `appointments`. Cela pourrait impacter les performances.

**Mitigation**:

- Ajouter des indexes appropriés sur les clés étrangères (`paymentId`, `invoiceId`, `appointmentId`)
- Utiliser les relations Drizzle optimisées
- Implémenter la pagination sur les listes de paiements
- Surveiller les performances avec des outils de profiling

### Risk 3: Complexité accrue de la validation des paiements

**Risk**: Avec l'ajout de `payerType`, `portion`, et la possibilité de lier à la fois factures et rendez-vous, la validation des paiements devient plus complexe.

**Mitigation**:

- Créer des schémas Zod robustes pour toutes les opérations de paiement
- Documenter clairement les règles de validation
- Implémenter des tests unitaires complets pour tous les scénarios de validation
- Utiliser des fonctions utilitaires réutilisables pour la logique de validation

### Trade-off 1: FK nullable vs null not strict

**Trade-off**: Le fait de rendre `invoiceId` nullable dans `payment_allocations` introduit une flexibilité mais réduit la rigueur du schéma.

**Rationale**: C'est un compromis nécessaire pour permettre une implémentation progressive sans bloquer les améliorations de paiement. À long terme, une fois le système de facturation implémenté, cette colonne pourra être rendue obligatoire.

### Trade-off 2: Délai entre paiement et facturation

**Trade-off**: Le système permet d'enregistrer des paiements avant que la facture ne soit créée. Cela crée un état transitoire où des paiements existent sans lien vers une facture.

**Rationale**: C'est une caractéristique du modèle progressive adoption. Dans la pratique, les cliniques reçoivent souvent des paiements avant d'émettre la facture, ce qui est plus réaliste que d'exiger la facture d'abord.

## Migration Plan

### Phase 1: Préparation

1. Créer les nouvelles tables dans le schéma Drizzle
2. Générer et appliquer les migrations D1
3. Créer les nouveaux enums dans `shared/utils/constants.base.ts`

### Phase 2: Migration des données

1. Créer un script de migration pour convertir `appointment_payment_items` en `payment_allocations`
2. Exécuter le script sur l'environnement de développement
3. Valider l'intégrité des données migrées
4. Exécuter sur l'environnement de staging avec backup

### Phase 3: Mise à jour du code backend

1. Mettre à jour les routes API pour utiliser `payment_allocations`
2. Mettre à jour les routes API pour gérer `payerType` et `payerInsuranceCompanyId`
3. Créer les nouvelles routes API pour les avoirs
4. Mettre à jour les schémas de validation Zod

### Phase 4: Mise à jour du code frontend

1. Mettre à jour les formulaires de paiement pour inclure l'attribution de payeur
2. Créer l'interface de gestion des avoirs
3. Mettre à jour l'affichage des paiements pour montrer la nouvelle structure
4. Mettre à jour les tests E2E

### Phase 5: Déploiement

1. Déployer sur l'environnement de staging
2. Effectuer des tests d'acceptation utilisateur
3. Déployer sur l'environnement de production
4. Surveiller les erreurs et les performances

### Rollback Strategy

- Conserver la table `appointment_payment_items` en backup pendant 30 jours
- Créer un script de rollback pour restaurer l'état précédent
- Avoir une procédure documentée pour revenir à la version précédente
- Préparer une communication pour les utilisateurs en cas de problème majeur

## Open Questions

1. **Format de référence pour les avoirs**: Quel sera le format des numéros de référence pour les avoirs (ex: CRN-2024-001)?
   - À décider en collaboration avec l'équipe comptable

2. **Workflow d'approbation des avoirs**: Les avoirs nécessitent-ils une approbation avant d'être émis?
   - Probablement oui, mais les détails à définir

3. **Intégration future avec les mutuelles**: Comment les informations des mutuelles seront-elles gérées?
   - À définir lors de l'implémentation du module d'assurance

4. **Règles comptables locales**: Y a-t-il des exigences comptables spécifiques au Maroc qui doivent être respectées?
   - À valider avec un expert comptable local

5. **Historique des modifications de paiements**: Les paiements existants peuvent-ils être modifiés ou doivent-ils suivre le pattern immuable?
   - À décider : modification limitée vs création d'avoir pour corrections
