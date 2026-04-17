## 1. Database Schema

- [x] 1.1 Ajouter `payerType` et `payerInsuranceCompanyId` à la table `payments` dans le schéma Drizzle
- [x] 1.2 Créer la table `payment_allocations` avec les colonnes `paymentId`, `invoiceId`, `appointmentId`, et `portion`
- [x] 1.3 Créer la table `credit_notes` avec les colonnes `type`, `status`, `amount`, `reason`, et `referenceNumber`
- [x] 1.4 Créer la table `credit_note_allocations` avec les colonnes `creditNoteId`, `invoiceId`, et `amount`
- [x] 1.5 Ajouter les nouveaux enums dans `shared/utils/constants.base.ts` : `PAYMENT_PAYER_TYPES`, `PAYMENT_PORTIONS`, `CREDIT_NOTE_TYPES`, `CREDIT_NOTE_STATUSES`
- [x] 1.6 Étendre `PAYMENT_TYPES` avec `insurance_payment`, `insurance_refund`, `credit_note_applied`, `write_off`
- [x] 1.7 Étendre `PAYMENT_METHODS` avec `insurance-electronic`
- [x] 1.8 Mettre à jour `server/database/relations.ts` pour inclure les nouvelles relations
- [x] 1.9 Générer la migration Drizzle avec `pnpm db:gen`
- [x] 1.10 Appliquer la migration localement avec `pnpm db:mig`

## 2. Data Migration

- [x] 2.1 Créer le script de migration pour convertir `appointment_payment_items` en `payment_allocations`
- [x] 2.2 Tester le script de migration sur la base de données de développement
- [x] 2.3 Valider l'intégrité des données après migration
- [x] 2.4 Créer un script de backup pour la table `appointment_payment_items`
- [x] 2.5 Créer un script de rollback pour restaurer l'état précédent

## 3. Backend API - Payments

- [x] 3.1 Mettre à jour `server/api/payments/index.post.ts` pour inclure la validation de `payerType` et `payerInsuranceCompanyId`
- [x] 3.2 Mettre à jour `server/api/payments/[id].get.ts` pour retourner les allocations de paiement
- [x] 3.3 Créer `server/api/payments/[id]/allocations/index.get.ts` pour lister les allocations d'un paiement
- [x] 3.4 Créer `server/api/payments/[id]/allocations/index.post.ts` pour créer des allocations
- [x] 3.5 Supprimer ou déprécier les routes `server/api/appointment-payment-items/` existantes
- [x] 3.6 Créer les schémas Zod de validation pour `payerType` et `payerInsuranceCompanyId`
- [x] 3.7 Ajouter des tests unitaires pour la validation des payeurs

## 4. Backend API - Credit Notes

- [x] 4.1 Créer `server/api/credit-notes/index.post.ts` pour créer des avoirs
- [x] 4.2 Créer `server/api/credit-notes/index.get.ts` pour lister les avoirs
- [x] 4.3 Créer `server/api/credit-notes/[id].get.ts` pour récupérer un avoir
- [x] 4.4 Créer `server/api/credit-notes/[id].patch.ts` pour mettre à jour le statut (draft → issued/cancelled)
- [x] 4.5 Créer `server/api/credit-notes/[id]/allocations/index.post.ts` pour allouer des avoirs aux factures
- [x] 4.6 Créer `server/api/credit-notes/[id]/allocations/index.get.ts` pour lister les allocations d'un avoir
- [x] 4.7 Créer les schémas Zod de validation pour les avoirs et leurs allocations
- [x] 4.8 Implémenter la logique de validation du solde des avoirs
- [x] 4.9 Ajouter des tests unitaires pour la création et l'allocation des avoirs

## 5. Shared Types and Utilities

- [x] 5.1 Créer `shared/types/payment-allocation.ts` pour les types d'allocation de paiement
- [x] 5.2 Créer `shared/types/credit-note.ts` pour les types d'avoir
- [x] 5.3 Créer `shared/types/credit-note-allocation.ts` pour les types d'allocation d'avoir
- [x] 5.4 Mettre à jour `shared/types/payment.ts` pour inclure `payerType` et `payerInsuranceCompanyId`
- [x] 5.5 Créer des utilitaires pour la validation des règles de paiement et d'avoir
- [x] 5.6 Ajouter des tests unitaires pour les utilitaires de validation

## 6. Frontend Composables

- [x] 6.1 Mettre à jour `app/composables/usePayment.ts` pour inclure `payerType` et `payerInsuranceCompanyId`
- [x] 6.2 Créer `app/composables/usePaymentAllocation.ts` pour gérer les allocations
- [x] 6.3 Créer `app/composables/useCreditNote.ts` pour gérer les avoirs
- [x] 6.4 Créer `app/composables/useCreditNoteAllocation.ts` pour gérer les allocations d'avoir
- [x] 6.5 Ajouter des tests pour les composables

## 7. Frontend Components

- [x] 7.1 Mettre à jour les formulaires de paiement pour inclure la sélection du payeur
- [x] 7.2 Créer un composant pour afficher les allocations de paiement
- [x] 7.3 Créer un composant pour gérer la création d'avoirs
- [x] 7.4 Créer un composant pour allouer des avoirs aux factures
- [x] 7.5 Mettre à jour l'affichage des paiements pour montrer le nouveau modèle
- [ ] 7.6 Ajouter des tests de composants pour les nouveaux éléments

## 8. Frontend Pages

- [ ] 8.1 Mettre à jour `app/pages/invoices/[id].vue` pour afficher les allocations de paiement
- [x] 8.2 Créer `app/pages/credit-notes/index.vue` pour la liste des avoirs
- [x] 8.3 Créer `app/pages/credit-notes/[id].vue` pour les détails d'un avoir
- [x] 8.4 Créer `app/pages/credit-notes/new.vue` pour la création d'avoirs
- [x] 8.5 Mettre à jour `app/pages/patients/[id]/payments.vue` pour inclure les allocations

## 9. Testing

- [ ] 9.1 Créer des tests E2E pour les scénarios de paiement avec attribution de payeur
- [ ] 9.2 Créer des tests E2E pour les allocations de paiement
- [ ] 9.3 Créer des tests E2E pour la création et l'émission d'avoirs
- [ ] 9.4 Créer des tests E2E pour l'allocation d'avoirs aux factures
- [x] 9.5 Exécuter tous les tests avec `pnpm test`
- [ ] 9.6 Vérifier la couverture de tests avec `pnpm test:coverage`

## 10. Documentation

- [ ] 10.1 Documenter le nouveau schéma de base de données dans le README
- [ ] 10.2 Documenter les nouvelles routes API avec des exemples
- [x] 10.3 Documenter le processus de migration de données
- [ ] 10.4 Créer un guide pour l'utilisation des avoirs
- [ ] 10.5 Mettre à jour les commentaires dans le code si nécessaire

## 11. Deployment Preparation

- [ ] 11.1 Exécuter `pnpm typecheck` pour vérifier les types TypeScript
- [ ] 11.2 Exécuter `pnpm build` pour vérifier que le build réussit
- [ ] 11.3 Préparer le script de déploiement pour les migrations
- [x] 11.4 Créer un plan de rollback documenté
- [ ] 11.5 Préparer une communication pour les utilisateurs sur les changements
