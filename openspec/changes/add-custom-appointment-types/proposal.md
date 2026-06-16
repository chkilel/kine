## Why

Les types de rendez-vous sont actuellement codés en dur dans `VALID_APPOINTMENT_TYPES` (constante globale) avec un schéma Zod `z.enum()` figé. Un cabinet ne peut pas ajouter ses propres types de rendez-vous (ex: "Acupuncture", "Bilan ventilatoire", "Rééducation périnéale") sans modifier le code source. Les types doivent être configurables par organisation, car chaque cabinet a ses propres pratiques et spécialités.

## What Changes

- **Transformer `VALID_APPOINTMENT_TYPES`** : passer d'un simple tableau de codes `string[]` à un tableau d'objets `{ code, title, isDefault }` servant de source pour les types par défaut
- **Supprimer `APPOINTMENT_TYPES_CONFIG`** : la config des labels et icônes est fusionnée dans les données de seed (sans icônes)
- **Ajouter une colonne JSON `appointmentTypes`** sur la table `organizations` (même pattern que `pricing`, `scheduling`, etc.)
- **Modifier la colonne `appointments.type`** : passer de `text({ enum: VALID_APPOINTMENT_TYPES })` à `text()` simple (validation dynamique côté application)
- **Seeding automatique** : à la création d'une organisation, les types par défaut sont insérés avec un `id` (uuid v7), `code`, `title`, `isDefault: true`
- **Validation dynamique** : la validation d'un type de rendez-vous se fait côté serveur en vérifiant les types configurés de l'organisation
- **Nouvelle page settings** : `/organizations/[id]/appointment-types` pour lister, ajouter, modifier et (pour les non-défaut) supprimer les types
- **Protection des types par défaut** : les types marqués `isDefault: true` peuvent être modifiés (titre) mais pas supprimés
- **Helpers mis à jour** : `getAppointmentTypeTitle(code, orgTypes?)` remplace `getAppointmentTypeLabel()`, résout depuis les types de l'org avec fallback sur `VALID_APPOINTMENT_TYPES`
- **Codes en majuscules** : tous les codes doivent être en majuscules, les espaces remplacés par des underscores (ex: `BILAN_VENTILATOIRE`)
- **Pas de migration de données** : l'app est en dev, `pnpm db:gen` suffit

## Capabilities

### New Capabilities

- `org-appointment-types`: Gestion configurable des types de rendez-vous au niveau de l'organisation via une colonne JSON `appointmentTypes` sur la table `organizations`. Chaque type possède un `id` (uuid v7), un `code` (majuscule, underscores), un `title`, et un flag `isDefault`. Les types par défaut sont seedés à la création de l'organisation et ne peuvent pas être supprimés.

### Modified Capabilities

- `organization`: Le schéma organisation est étendu avec une nouvelle colonne JSON `appointmentTypes`
- `appointment-planning`: La validation du type de rendez-vous devient dynamique (vérification contre les types de l'org) au lieu d'un enum statique
- `unified-appointment-session`: La colonne `appointments.type` passe d'un enum Drizzle à un `text()` simple
- `database-seeding`: Le seed crée les types de rendez-vous pour chaque organisation et les utilise pour générer les rendez-vous

## Impact

- **Database** : Ajout colonne JSON `appointmentTypes` sur `organizations`, modification colonne `type` sur `appointments` (enum → text). Migration D1 générée via `pnpm db:gen`.
- **Shared types** : `base.types.ts` (`VALID_APPOINTMENT_TYPES` transformé), `org.types.ts` (nouveau schéma `OrgAppointmentTypeItem`), `appointment.type.ts` (validation dynamique)
- **Shared utils** : `constants.appointment.ts` (suppression `APPOINTMENT_TYPES_CONFIG`, nouveaux helpers)
- **API** : `organizations/index.post.ts` (seed), `organizations/[id].put.ts` (validation), `appointments/index.post.ts` (validation dynamique)
- **Frontend** : Nouvelle page `organizations/[id]/appointment-types.vue`, mise à jour `organizations/[id].vue` (tab), composable `useAppointmentTypes`, ~8 composants mis à jour pour la résolution des titres
- **Seed** : `server/api/db/seed.post.ts` (création types + utilisation pour rendez-vous)
- **Pas d'impact tenant** : Les types sont scopés par organisation, isolation préservée
