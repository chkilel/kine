## 1. Navigation latérale

- [x] 1.1 Dans `app/layouts/default.vue`, ajouter `useOrganization()` pour récupérer `activeOrganization`
- [x] 1.2 Transformer l'entrée "Cabinets" en `type: 'trigger'` avec `defaultOpen: true` et deux enfants : "Cabinets" (to: `/organizations`) et "Organisation" (to computed vers `/organizations/${activeOrgId}`)
- [x] 1.3 Désactiver le lien "Organisation" quand `activeOrganization` n'est pas disponible
