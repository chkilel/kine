## Why

Chaque page dans `app/pages/organizations/[id]/` (7 pages) délègue tout son contenu à un composant `*Tab.vue` correspondant, se contentant d'un fin wrapper qui expose `handleSave`/`handleCancel` via `ref`. Cette indirection est inutile : les pages Nuxt sont déjà des composants Vue — le wrapper ne fait qu'ajouter une couche de fichier et de navigation. En fusionnant le contenu du composant dans la page et en supprimant le composant, on simplifie la hiérarchie et on réduit le nombre de fichiers.

## What Changes

- Déplacer le contenu de chaque composant `organization/*Tab.vue` dans la page `organizations/[id]/` correspondante
- Supprimer les 7 composants `organization/*Tab.vue` (`GeneralInformationTab`, `PricingReservationsTab`, `ClinicalConfigurationTab`, `AppearanceTab`, `RoomsTab`, `AdvancedTab`, `LegalInformationTab`)
- Garder les autres composants de `organization/` inchangés (`CreateModal`, `RoomSlideover`, `SwitchMenu`)
- Aucun changement fonctionnel, API, ni UX

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

_(aucune — refactoring interne, pas de changement de comportement spec-level)_

## Impact

- **Fichiers modifiés** : 7 pages dans `app/pages/organizations/[id]/`
- **Fichiers supprimés** : 7 composants dans `app/components/organization/*Tab.vue`
- **Aucun impact** : API, base de données, authentification, autres composants
- **Aucune contrainte Workers** : changement purement frontend
