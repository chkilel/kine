## Context

Les paramètres de planification de rendez-vous (`defaultAppointmentDuration`, `appointmentGapMinutes`, `slotIncrementMinutes`) sont actuellement définis au niveau thérapeute (table `users`). Ils sont utilisés pour :

- **Pré-remplir la durée** d'un nouveau rendez-vous dans la `PlanningSlideover`
- **Calculer les créneaux disponibles** dans les routes API `availability/therapists/[therapistId]/slots.post.ts` et `availability/rooms/[roomId]/slots.post.ts`
- **Générer les time slots** via `generateTimeSlots()` dans `planning-utils.ts`

La table `organizations` possède déjà une colonne JSON `scheduling` (`OrgScheduling`) qui contient les settings de planification (bookingWindowDays, cancellationHours, etc.). C'est l'emplacement naturel pour ces 3 champs.

## Goals / Non-Goals

**Goals:**

- Déplacer les 3 champs de `users` vers `organizations.scheduling` (colonne JSON existante)
- Fournir une UI pour configurer ces paramètres au niveau organisation (page clinical existante ou section dédiée)
- Mettre à jour les routes availability pour lire depuis l'organisation
- Supprimer les champs du profil thérapeute et de Better Auth
- Migration DB rétrocompatible (les données existantes doivent migrer proprement)

**Non-Goals:**

- Permettre des overrides par thérapeute (champs délégués à l'org uniquement)
- Refondre la page clinical.vue (on ajoute simplement les champs dans la section existante)

## Decisions

### 1. Stockage dans la colonne JSON `scheduling` existante

**Choix** : Ajouter les 3 champs au type `OrgScheduling` plutôt que de créer de nouvelles colonnes SQL.

**Raison** : La colonne `scheduling` existe déjà et est du type JSON. Ces settings sont des préférences de configuration, pas des données relationnelles. Pas besoin de colonnes dédiées ni d'index.

**Alternative rejetée** : Créer 3 nouvelles colonnes `integer` sur `organizations` — ajoute de la complexité de migration sans bénéfice fonctionnel.

### 2. Lecture dans les routes availability : jointure via `members`

**Choix** : Les routes availability vont récupérer l'organisation du thérapeute via la table `members` (userId + organizationId) pour lire `organizations.scheduling`.

**Raison** : Un thérapeute peut appartenir à plusieurs organisations. On utilise l'organisation active (du session) ou on fait une jointure directe.

**Pattern** :
```ts
// Récupérer l'org du thérapeute
const membership = await db.query.members.findFirst({
  where: eq(members.userId, therapistId),
  with: { organization: true }
})
const scheduling = membership?.organization?.scheduling
```

### 3. UI : Section dans la page `organizations/[id]/clinical.vue`

**Choix** : Ajouter les 3 champs dans un nouveau `AppCard` "Planification" dans la page clinical existante, en haut de la colonne de gauche (avant "Documentation clinique").

**Raison** : La page clinical gère déjà les settings de configuration de l'organisation liés aux séances. Les paramètres de planification y sont cohérents.

**Alternative rejetée** : Créer une nouvelle page `/organizations/[id]/scheduling` — nécessiterait d'ajouter un nouveau tab dans la navigation org pour 3 champs, overkill.

### 4. Migration des données existantes

**Choix** : Script de migration qui :
1. Pour chaque utilisateur ayant une membership, copie les 3 champs dans `organizations.scheduling` (seulement si `scheduling` n'a pas déjà ces valeurs)
2. Supprime ensuite les colonnes de `users`

**Fallback** : Les nouvelles valeurs par défaut dans `OrgScheduling` sont les mêmes que celles des colonnes `users` (30min, 5min, 15min), donc aucune donnée n'est perdue si la migration ne s'exécute pas.

### 5. Suppression de Better Auth additionalFields

**Choix** : Retirer les 3 champs de `server/utils/auth.ts` (`additionalFields` config).

**Impact** : Les champs ne seront plus disponibles dans le session Better Auth. Toute lecture frontend via `user.value?.defaultAppointmentDuration` doit être remplacée par la lecture de l'organisation active.

## Risks / Trade-offs

- **Thérapeute dans plusieurs organisations** : Les settings sont au niveau org, pas du thérapeute. Si un thérapeute travaille dans 2 orgs avec des configs différentes, c'est correct — chaque org a ses propres settings. → Atténuation : les routes availability utilisent déjà un contexte org (room ou therapistId).
- **Perte de granularité individuelle** : On ne peut plus avoir des durées par thérapeute. → Acceptable : c'est le but de la migration (cohérence au niveau cabinet).
- **Migration DB irréversible** : La suppression de colonnes est définitive. → Atténuation : les colonnes JSON conservent les données. Un rollback est possible via re-création des colonnes et script inverse.
