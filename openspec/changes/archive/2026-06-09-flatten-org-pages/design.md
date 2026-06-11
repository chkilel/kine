## Context

L'architecture actuelle des pages de l'organisation (`app/pages/organizations/[id]/`) suit un pattern wrapper : chaque page (7 pages) délègue la totalité de son contenu à un composant `organization/*Tab.vue` correspondant, se limitant à exposer `handleSave`/`handleCancel` via un `ref` template.

7 composants Tab concernés : `GeneralInformationTab`, `PricingReservationsTab`, `ClinicalConfigurationTab`, `AppearanceTab`, `RoomsTab`, `AdvancedTab`, `LegalInformationTab`.

Total : ~1410 lignes dans les composants Tab, ~120 lignes dans les pages (presque identiques).

## Goals / Non-Goals

**Goals:**
- Fusionner le contenu de chaque composant `*Tab.vue` directement dans la page correspondante
- Supprimer les 7 composants Tab devenus redondants
- Conserver exactement le même comportement et la même UX

**Non-Goals:**
- Refactorer le contenu interne des composants (logique, template, imports)
- Modifier les autres composants de `organization/` (`CreateModal`, `RoomSlideover`, `SwitchMenu`)
- Changer le pattern de sauvegarde/annulation via `ref`

## Decisions

### 1. Page becomes the component (no wrapper)

**Choix** : Déplacer tout le `<script setup>` et le `<template>` du composant Tab dans la page, supprimer le composant.

**Alternative considérée** : Garder les composants mais les renommer/réorganiser — rejeté car l'indirection n'apporte rien (pas de réutilisation, pas de partage entre pages).

### 2. Refactoring mécanique, page par page

**Choix** : Traiter chaque page indépendamment (7 étapes identiques) pour limiter la taille des diffs et faciliter la review.

**Rationale** : Chaque page-composant pair est indépendant. Les faire un par un réduit le risque d'erreurs et permet un revert granulaire.

### 3. Salve/Cancel footer reste dans la page

**Choix** : Le footer avec les boutons Annuler/Enregistrer (présent dans 6 pages sur 7) reste dans la page tel quel.

**Note** : `rooms.vue` est un cas particulier — pas de boutons save/cancel, juste un wrapper autour de `RoomsTab`.

## Risks / Trade-offs

- **[Taille des pages]** Les pages passeront de ~20 lignes à ~150-260 lignes → acceptable, c'est la norme pour des pages Nuxt avec formulaire
- **[Import refactoring]** Les imports de sous-composants utilisés par les Tab devront être déplacés dans les pages → mécanique, pas de risque fonctionnel
- **[Aucun risque backend/API]** Changement purement frontend, aucun impact sur l'API ou la DB
