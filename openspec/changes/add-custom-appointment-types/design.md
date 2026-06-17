## Context

Les types de rendez-vous sont définis globalement dans `shared/types/base.types.ts` :

```ts
export const VALID_APPOINTMENT_TYPES = [
  'initial', 'follow_up', 'treatment', 'mobilization', 'reinforcement',
  'reeducation', 'exercise_supervision', 'post_op_follow_up',
  'urgent_visit', 'consultation', 'discharge'
] as const
export const appointmentTypeSchema = z.enum(VALID_APPOINTMENT_TYPES)
```

Un second objet `APPOINTMENT_TYPES_CONFIG` dans `shared/utils/constants.appointment.ts` mappe chaque code à un label et une icône. La colonne `appointments.type` utilise `text({ enum: VALID_APPOINTMENT_TYPES })` au niveau base de données.

Ce système est figé — aucune organisation ne peut personnaliser ses types. La table `organizations` possède déjà plusieurs colonnes JSON pour la configuration (`pricing`, `scheduling`, `clinical`, etc.), chacune validée par un schéma Zod dans `shared/types/org.types.ts`.

## Goals / Non-Goals

**Goals:**

- Rendre les types de rendez-vous configurables par organisation
- Stocker les types dans une colonne JSON `appointmentTypes` sur `organizations` (pattern établi)
- Seeder les types par défaut à la création de l'organisation
- Permettre l'ajout, la modification et la suppression (sauf pour les types `isDefault`)
- Valider dynamiquement les types côté serveur lors de la création de rendez-vous
- Fournir une UI dans les settings de l'organisation

**Non-Goals:**

- Ajouter des icônes par type (suppression complète du concept d'icône liée au type)
- Créer une table séparée pour les types (utilise une colonne JSON)
- Gérer des traductions de types multi-langues
- Permettre la suppression des types par défaut

## Decisions

### 1. Colonne JSON sur `organizations` (pattern pricing)

**Choix** : Stocker les types dans une colonne JSON `appointmentTypes` sur la table `organizations`.

**Raison** : Suit exactement le pattern des `priceItems` dans `pricing` — un tableau d'objets avec `id`, `code`, `title`. Pas besoin de table séparée ni de jointures. La CRUD passe par l'endpoint unique `PUT /api/organizations/[id]`.

**Alternative rejetée** : Table séparée `appointment_types` (pattern rooms) — ajoute de la complexité (nouvelles routes CRUD, relations, migrations) pour un simple config qui ne justifie pas l'overhead.

### 2. Structure du type item

```ts
interface OrgAppointmentTypeItem {
  id: string        // uuid v7
  code: string      // majuscule, underscores (ex: 'SUIVI_POST_OP')
  title: string     // label affiché (ex: 'Suivi post-opératoire')
  isDefault: boolean // true pour les types seedés (non supprimables)
}
```

**Raison** : Le `id` uuid v7 permet d'identifier chaque type de manière unique dans l'UI. Le `code` est l'identifiant machine stocké dans `appointments.type`. Le `title` est le label humain. Le flag `isDefault` protège contre la suppression accidentelle.

### 3. `appointments.type` reste `text()` (pas de FK)

**Choix** : La colonne `appointments.type` passe de `text({ enum: VALID_APPOINTMENT_TYPES })` à `text()` simple. La validation se fait côté application.

**Raison** : Une FK vers une colonne JSON n'est pas possible en SQLite. Les types étant dans un JSON sur `organizations`, on ne peut pas avoir d'intégrité référentielle au niveau DB. La validation applicative suffit — on vérifie que le code existe dans les types de l'org.

### 4. Validation dynamique côté serveur

**Pattern** :
```ts
// Dans appointments/index.post.ts
const org = await db.query.organizations.findFirst({
  where: eq(organizations.id, organizationId)
})
const validCodes = (org.appointmentTypes || []).map(t => t.code)
if (body.type && !validCodes.includes(body.type)) {
  throw createError({ statusCode: 400, message: 'Type de rendez-vous invalide' })
}
```

Si l'org n'a pas encore de `appointmentTypes` (null), on fallback sur les codes de `VALID_APPOINTMENT_TYPES`.

### 5. Codes en majuscules avec underscores

**Choix** : Tous les codes doivent respecter le format `UPPER_SNAKE_CASE`.

**Règles** :
- Transformation : `code.toUpperCase().replace(/\s+/g, '_')`
- Validation Zod : `z.string().regex(/^[A-Z][A-Z0-9_]*$/)`

**Seed data** (codes transformés) :
- `INITIAL`, `FOLLOW_UP`, `TREATMENT`, `MOBILIZATION`, `REINFORCEMENT`
- `REEDUCATION`, `EXERCISE_SUPERVISION`, `POST_OP_FOLLOW_UP`
- `URGENT_VISIT`, `CONSULTATION`, `DISCHARGE`

### 6. Suppression de `APPOINTMENT_TYPES_CONFIG`

**Choix** : Supprimer entièrement `APPOINTMENT_TYPES_CONFIG`, `APPOINTMENT_TYPES_OPTIONS`, `getAppointmentTypeLabel`, `getAppointmentTypeIcon`.

**Remplacement** :
- Les titres des types par défaut sont maintenant dans `VALID_APPOINTMENT_TYPES` (champ `title`)
- `getAppointmentTypeTitle(code, orgTypes?)` résout le titre depuis les types de l'org, avec fallback sur `VALID_APPOINTMENT_TYPES`
- Les composants qui utilisaient `getAppointmentTypeIcon()` utilisent une icône statique (ex: `i-hugeicons-calendar-03`)

### 7. Helper `getAppointmentTypeTitle`

```ts
export function getAppointmentTypeTitle(
  code: string | null,
  orgTypes?: OrgAppointmentTypeItem[]
): string {
  if (!code) return 'Suivi'
  // 1. Chercher dans les types de l'org
  if (orgTypes) {
    const found = orgTypes.find(t => t.code === code)
    if (found) return found.title
  }
  // 2. Fallback sur les types par défaut
  const defaultType = VALID_APPOINTMENT_TYPES.find(t => t.code === code)
  if (defaultType) return defaultType.title
  // 3. Fallback final : retourner le code tel quel
  return code
}
```

### 8. Composable `useAppointmentTypes`

**Choix** : Créer un composable qui fournit les types de l'org active + le resolver de titre.

```ts
export function useAppointmentTypes() {
  const { activeOrganization } = useOrganization()
  const orgTypes = computed(() => activeOrganization.value?.appointmentTypes ?? [])
  const resolveTitle = (code: string | null) => getAppointmentTypeTitle(code, orgTypes.value)
  return { orgTypes, resolveTitle }
}
```

### 9. UI : Nouvelle page settings

**Choix** : Créer `app/pages/organizations/[id]/appointment-types.vue`.

**Pattern** : Suivre `pricing.vue` — liste des items, formulaire d'ajout/édition, bouton de suppression (désactivé pour `isDefault`).

## Risks / Trade-offs

- **Pas d'intégrité référentielle DB** : Si un type est supprimé alors que des rendez-vous l'utilisent, ces rendez-vous auront un `type` orphelin. → Atténuation : `getAppointmentTypeTitle()` retourne le code brut si non trouvé. Les types par défaut ne sont pas supprimables.
- **Validation dynamique plus coûteuse** : Chaque création de rendez-vous nécessite une lecture des types de l'org. → Atténuation : L'org est déjà chargée dans le contexte de la requête via `requireAuthWithOrg()`.
- **Codes en majuscules — breaking change** : Les rendez-vous existants ont des codes en minuscules (`follow_up`). → Atténuation : L'app est en dev, pas de données critiques. Le seed régénère tout. Le resolver de titre ne tient pas compte de la casse (comparaison insensible à la casse en fallback).
