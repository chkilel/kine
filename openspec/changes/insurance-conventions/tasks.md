## 1. Database Schema & Migrations

- [x] 1.1 Créer le fichier de schéma Drizzle pour insurance_companies dans server/database/schema/insurance-companies.ts
- [x] 1.2 Ajouter le champ insuranceCompanyId à la table treatment_plans dans server/database/schema/treatment-plans.ts
- [x] 1.3 Ajouter les champs d'assurance et de paiement à la table appointments dans server/database/schema/appointments.ts
- [x] 1.4 Créer l'énumération VALID_CONVENTION_STATUSES dans shared/types/base.types.ts
- [x] 1.5 Mettre à jour les relations dans server/database/relations.ts pour inclure insuranceCompany
- [x] 1.6 Générer la migration Drizzle avec pnpm db:gen
- [x] 1.7 Tester la migration en local avec pnpm db:mig
- [ ] 1.8 Appliquer la migration à la base de données distante (production) avec pnpm db:mig-remote

## 2. Backend - Shared Types & Utilities

- [x] 2.1 Créer les types TypeScript partagés pour insurance companies dans shared/types/insurance-company.ts
- [x] 2.2 Créer les types TypeScript partagés pour insurance payment tracking dans shared/types/insurance-payment.ts
- [x] 2.3 Créer la fonction utilitaire de calcul de couverture d'assurance dans server/utils/insurance-calculation.ts
- [x] 2.4 Ajouter les schémas de validation Zod pour insurance companies dans shared/types/insurance-company.ts
- [x] 2.5 Ajouter les schémas de validation Zod pour insurance payments dans shared/types/insurance-payment.ts

## 3. Backend - Insurance Companies API

- [x] 3.1 Créer le composable useInsuranceCompany dans app/composables/useInsuranceCompany.ts
- [x] 3.2 Créer l'endpoint GET /api/insurance-companies pour lister les compagnies (filtré par organisation)
- [x] 3.3 Créer l'endpoint GET /api/insurance-companies/:id pour récupérer une compagnie spécifique
- [x] 3.4 Créer l'endpoint POST /api/insurance-companies pour créer une nouvelle compagnie
- [x] 3.5 Créer l'endpoint PATCH /api/insurance-companies/:id pour mettre à jour une compagnie
- [x] 3.6 Créer l'endpoint DELETE /api/insurance-companies/:id pour soft-delete une compagnie
- [x] 3.7 Ajouter la validation des requêtes avec Zod sur tous les endpoints
- [ ] 3.8 Ajouter les tests d'intégration pour l'API insurance companies

## 4. Backend - Treatment Plans API Enhancement

- [x] 4.1 Mettre à jour le schéma Zod pour la création de treatment plans pour inclure insuranceCompanyId
- [x] 4.2 Mettre à jour le schéma Zod pour la mise à jour de treatment plans pour inclure insuranceCompanyId
- [x] 4.3 Modifier l'endpoint POST /api/treatment-plans pour accepter et stocker insuranceCompanyId
- [x] 4.4 Modifier l'endpoint PATCH /api/treatment-plans/:id pour permettre la mise à jour d'insuranceCompanyId
- [x] 4.5 Ajouter la validation que insuranceCompanyId appartient à la même organisation
- [x] 4.6 Ajouter la validation que la compagnie d'assurance a le statut "active"
- [ ] 4.7 Mettre à jour les tests d'intégration pour treatment plans

## 5. Backend - Appointments API Enhancement

- [x] 5.1 Mettre à jour le schéma Zod pour la création d'appointments pour inclure insuranceCompanyId (optionnel)
- [x] 5.2 Modifier l'endpoint POST /api/appointments pour hériter insuranceCompanyId du treatment plan si spécifié
- [x] 5.3 Ajouter le calcul automatique des expectedCoPayCents et expectedInsuranceCents lors de la création
- [x] 5.4 Créer l'endpoint PATCH /api/appointments/:id/payments pour mettre à jour coPayPaidCents et insurancePaidCents
- [x] 5.5 Ajouter la validation pour empêcher la modification manuelle des montants attendus
- [x] 5.6 Modifier GET /api/appointments/:id pour inclure tous les champs d'assurance et de paiement
- [x] 5.7 Modifier GET /api/appointments pour inclure les champs d'assurance et de paiement
- [ ] 5.8 Ajouter les tests d'intégration pour les nouvelles fonctionnalités d'appointments

## 6. Backend - Insurance Calculation Logic

- [x] 6.1 Implémenter la fonction calculateInsuranceCoverage dans server/utils/insurance-calculation.ts
- [x] 6.2 Ajouter la logique de calcul pour la règle "fixed" (coPayAmountCents)
- [x] 6.3 Ajouter la logique de calcul pour la règle "percentage" (coPayPercentage)
- [x] 6.4 Ajouter les tests unitaires pour calculateInsuranceCoverage avec la règle fixed
- [x] 6.5 Ajouter les tests unitaires pour calculateInsuranceCoverage avec la règle percentage
- [x] 6.6 Ajouter les tests unitaires pour les cas limite (0% couverture, 100% couverture)
- [x] 6.7 Intégrer calculateInsuranceCoverage dans la logique de création d'appointments

## 7. Frontend - Insurance Companies UI

- [x] 7.1 Créer la page /settings/insurance-companies/index.vue pour lister les compagnies
- [x] 7.2 Créer le composant InsuranceCompanyList.vue pour afficher la liste des compagnies
- [x] 7.3 Créer le composant InsuranceCompanyForm.vue pour créer/éditer une compagnie
- [x] 7.4 Créer le composant InsuranceCompanyStatusBadge.vue pour afficher le statut (active/suspended/terminated)
- [x] 7.5 Ajouter le bouton "Nouvelle compagnie d'assurance" dans la page settings
- [x] 7.6 Implémenter le filtrage par statut dans la liste des compagnies
- [x] 7.7 Ajouter la confirmation de suppression pour les compagnies d'assurance
- [x] 7.8 Ajouter la validation des formulaires côté frontend

## 8. Frontend - Treatment Plans UI Enhancement

- [x] 8.1 Modifier le formulaire de création de treatment plan pour inclure le sélecteur de compagnie d'assurance
- [x] 8.2 Modifier le formulaire d'édition de treatment plan pour permettre la modification de l'assurance
- [x] 8.3 Ajouter le composant InsuranceCompanySelect.vue pour le choix de la compagnie
- [x] 8.4 Ajouter l'affichage de la compagnie d'assurance associée dans la vue détails du treatment plan
- [x] 8.5 Ajouter la validation que seule une compagnie active peut être sélectionnée
- [x] 8.6 Mettre à jour le composable useTreatmentPlan pour inclure insuranceCompanyId

## 9. Frontend - Appointments UI Enhancement

- [x] 9.1 Modifier le formulaire de création d'appointment pour afficher l'assurance héritée du treatment plan
- [x] 9.2 Ajouter l'affichage des montants attendus (expectedCoPayCents, expectedInsuranceCents) dans la vue appointment
- [x] 9.3 Créer le composant PaymentTrackingForm.vue pour saisir les paiements
- [x] 9.4 Ajouter l'affichage des montants payés (coPayPaidCents, insurancePaidCents) dans la vue appointment
- [x] 9.5 Ajouter un indicateur visuel pour les paiements partiels
- [x] 9.6 Créer le composant InsuranceInfoCard.vue pour afficher les détails d'assurance sur un appointment
- [x] 9.7 Mettre à jour le composable useAppointment pour inclure les champs d'assurance et de paiement
- [x] 9.8 Ajouter la possibilité de modifier les paiements depuis la vue appointment

## 10. Testing

- [x] 10.1 Écrire des tests unitaires pour la logique de calcul d'assurance (calculateInsuranceCoverage)
- [ ] 10.2 Écrire des tests d'intégration pour l'API insurance companies
- [ ] 10.3 Écrire des tests d'intégration pour l'héritage d'assurance dans les appointments
- [ ] 10.4 Écrire des tests d'intégration pour le suivi des paiements
- [ ] 10.5 Écrire des tests E2E pour le flux complet (créer compagnie → créer plan → créer appointment → enregistrer paiements)
- [ ] 10.6 Vérifier que tous les tests passent avec pnpm test
- [ ] 10.7 Vérifier que la couverture de tests est >90% pour la logique métier critique

## 11. Documentation

- [ ] 11.1 Mettre à jour AGENTS.md pour inclure les nouvelles fonctionnalités d'assurance
- [ ] 11.2 Ajouter des commentaires dans le code pour expliquer la logique de calcul d'assurance
- [ ] 11.3 Créer un guide utilisateur pour la gestion des compagnies d'assurance
- [ ] 11.4 Documenter l'API insurance companies dans un fichier README ou Swagger
- [ ] 11.5 Mettre à jour les README des composants modifiés

## 12. Deployment & Validation

- [x] 12.1 Exécuter pnpm typecheck pour vérifier qu'il n'y a pas d'erreurs TypeScript
- [x] 12.2 Exécuter pnpm test pour vérifier que tous les tests passent
- [ ] 12.3 Tester manuellement le flux complet sur l'environnement de développement
- [ ] 12.4 Vérifier l'isolation multi-tenant pour les compagnies d'assurance
- [ ] 12.5 Tester la migration de données sur l'environnement de staging
- [x] 12.6 Déployer sur Cloudflare Workers avec pnpm deploy
- [ ] 12.7 Surveiller les erreurs et les performances en production
- [ ] 12.8 Former les utilisateurs au nouveau flux de travail d'assurance
