## Context

Le layout `default.vue` contient un menu latéral avec une entrée "Cabinets" (`i-lucide-building-2`, to: `/organizations`). Le composable `useOrganization()` expose `activeOrganization` qui contient l'ID de l'organisation courante. L'entrée "Paramètres" est déjà un `type: 'trigger'` avec enfants — on réutilise le même pattern.

## Goals / Non-Goals

**Goals:**
- Ajouter un lien "Organisation" sous "Cabinets" naviguant vers `/organizations/[activeOrgId]`
- Gérer le cas où `activeOrganization` n'est pas encore chargé ou absent

**Non-Goals:**
- Toute modification de la page `/organizations/[id]` ou de ses composants
- Nouvelle page, nouveau composable, ou modification backend

## Decisions

### Pattern de navigation

**Choix**: Transformer "Cabinets" en `type: 'trigger'` avec `defaultOpen: true`, deux enfants : "Cabinets" (liste) et "Organisation" (lien dynamique).

**Rationale**: Même pattern que "Paramètres" déjà en place. Le `to` de "Organisation" est un computed vers `/organizations/${activeOrganization.value?.data?.id ?? ''}`. Si pas d'org, le lien est désactivé.

## Risks / Trade-offs

- **[Org non chargé au premier rendu]** → L'entrée "Organisation" peut temporairement pointer vers une route vide. Mitigation: désactiver le lien tant que `activeOrganization` n'est pas résolu.
