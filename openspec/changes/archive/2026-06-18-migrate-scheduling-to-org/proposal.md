## Why

Les paramètres de planification (`defaultAppointmentDuration`, `appointmentGapMinutes`, `slotIncrementMinutes`) sont actuellement attachés au profil thérapeute (table `users`). Or ces réglages sont de nature organisationnelle — un cabinet définit les durées et intervalles standards pour tous ses thérapeutes. Actuellement, chaque thérapeute doit configurer ces valeurs individuellement, ce qui crée des incohérences au sein d'un même cabinet et ne reflète pas la réalité métier.

## What Changes

- **BREAKING** : Retirer les 3 colonnes (`defaultAppointmentDuration`, `appointmentGapMinutes`, `slotIncrementMinutes`) de la table `users` et de la config Better Auth (`additionalFields`)
- Ajouter ces 3 champs au schéma `OrgScheduling` (colonne JSON `scheduling` de la table `organizations`) avec des valeurs par défaut
- Remplacer le champ `clinical.defaultDurationMinutes` par `scheduling.defaultAppointmentDuration` (même concept, nouveau nom et emplacement)
- Supprimer les champs des schemas Zod `signUpSchema` et `userUpdateSchema` dans `shared/types/auth.types.ts`
- Supprimer les types exportés `AppointmentGapMinutes` et `SlotIncrementMinutes` de `auth.types.ts`
- Migrer l'UI de configuration depuis `ProfileTab.vue` (thérapeute) vers la page `organizations/[id]/clinical.vue` (ou une section planification dédiée)
- Mettre à jour les routes API de disponibilité (`availability/therapists/[therapistId]/slots.post.ts` et `availability/rooms/[roomId]/slots.post.ts`) pour lire les valeurs depuis l'organisation du thérapeute au lieu du profil utilisateur
- Mettre à jour `PlanningSlideover.vue` pour lire `defaultAppointmentDuration` depuis l'organisation
- Créer une migration DB pour retirer les colonnes de la table `users`
- Mettre à jour le seed et les tests

## Capabilities

### New Capabilities

- `org-scheduling-settings`: Gestion des paramètres de planification au niveau de l'organisation (durée par défaut, intervalle entre séances, incrément de créneaux) via la colonne JSON `scheduling`

### Modified Capabilities

- `organization`: Le schéma `OrgScheduling` est étendu avec 3 nouveaux champs
- `appointment-planning`: Les algorithmes de génération de créneaux et la PlanningSlideover lisent désormais les paramètres depuis l'organisation
- `onboarding`: Le flux d'inscription ne demande plus ces 3 champs au niveau utilisateur

## Impact

- **Database** : Migration D1 — suppression de 3 colonnes de `users`, mise à jour des données existantes vers `organizations.scheduling`
- **Auth** : Better Auth `additionalFields` — retrait de 3 fields
- **API** : 2 routes availability modifiées, 1 route seed mise à jour
- **Frontend** : `ProfileTab.vue` (suppression), `clinical.vue` (ajout), `PlanningSlideover.vue` (modification), `register.vue` (nettoyage)
- **Types** : `auth.types.ts` (retrait), `org.types.ts` (ajout dans `OrgScheduling`)
- **Tests** : `planning-utils.spec.ts` — les tests n'utilisent pas directement les values user, seul le paramètre `slotIncrementMinutes` est passé en argument, pas de changement de tests requis
- **Pas d'impact tenant** : ces settings sont globaux par organisation, pas de problème d'isolation
