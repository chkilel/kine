## Why

L'entrée "Cabinets" dans le menu latéral pointe vers la liste `/organizations`. L'utilisateur doit cliquer sur son cabinet dans cette liste pour accéder à son profil. Or, il appartient déjà à une organisation active (via Better Auth `activeOrganization`). Un lien direct "Organisation" sous "Cabinets" qui navigue vers `/organizations/[activeOrgId]` supprime cet étape intermédiaire.

## What Changes

- Transformer l'entrée "Cabinets" en groupe dépliable avec deux enfants : "Cabinets" (liste `/organizations`) et "Organisation" (lien dynamique vers `/organizations/[activeOrgId]`)
- Le lien "Organisation" détecte automatiquement l'ID de l'organisation active de l'utilisateur et navigue vers la page existante `/organizations/[id]`

## Capabilities

### New Capabilities
- `org-nav-link`: Lien dynamique dans le menu latéral sous "Cabinets" pointant vers `/organizations/[activeOrgId]`

### Modified Capabilities
_(none)_

## Impact

- **Layout**: Modification de `app/layouts/default.vue` — transformation de l'entrée "Cabinets" en groupe avec enfants
- **Aucun impact backend, aucun nouveau composant, aucune modification de page existante**
