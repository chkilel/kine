## ADDED Requirements

### Requirement: Lien Organisation sous Cabinets
Le menu latéral SHALL afficher un lien "Organisation" en tant qu'enfant du groupe "Cabinets". Ce lien SHALL naviguer dynamiquement vers `/organizations/[activeOrgId]` en utilisant l'ID de l'organisation active de l'utilisateur courant.

#### Scenario: Utilisateur avec organisation active
- **WHEN** un utilisateur connecté avec une organisation active voit le menu latéral
- **THEN** l'entrée "Organisation" sous "Cabinets" est un lien cliquable pointant vers `/organizations/[activeOrgId]`

#### Scenario: Utilisateur sans organisation active
- **WHEN** un utilisateur connecté n'a pas d'organisation active ou qu'elle n'est pas encore chargée
- **THEN** l'entrée "Organisation" SHALL être désactivée (non cliquable)

### Requirement: Groupe Cabinets dépliable
L'entrée "Cabinets" SHALL être transformée en groupe dépliable (`type: 'trigger'`) avec deux enfants : "Cabinets" (liste) et "Organisation".

#### Scenario: Menu déplié
- **WHEN** le groupe "Cabinets" est déplié
- **THEN** les deux entrées enfants sont visibles : "Cabinets" pointant vers `/organizations` et "Organisation" pointant vers `/organizations/[activeOrgId]`
