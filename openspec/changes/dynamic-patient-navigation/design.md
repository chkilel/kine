## Context

L'application Kine dispose de pages de détail patient existantes (`/pages/patients/[id]/index`, `/pages/patients/[id]/plan`, `/pages/patients/[id]/seances`, `/pages/patients/[id]/documents`, `/pages/patients/[id]/facturation`) accessibles via des onglets. Les kinésithérapeutes ont besoin d'un menu latéral de raccourcis rapide pour accéder à ces différentes sections du dossier patient sans devoir utiliser les onglets existants, offrant ainsi une alternative de navigation plus directe et ergonomique.

## Goals / Non-Goals

**Goals:**
- Créer un menu latéral contextuel qui s'affiche uniquement quand on consulte un dossier patient
- Offrir des liens rapides vers les sections existantes du dossier patient (index, plan, seances, documents, facturation)
- Ajouter un bouton de retour pour sortir du contexte patient et revenir à la navigation principale
- NE PAS modifier les pages patient existantes
- NE PAS modifier les onglets de navigation existants

**Non-Goals:**
- Modifier les pages patient existantes ou leurs composants
- Changer les onglets de navigation existants
- Créer une nouvelle architecture de routing
- Remplacer la navigation principale de l'application

## Decisions

### 1. Composant PatientContextualMenu dédié

**Decision:** Créer un composant `PatientContextualMenu.vue` indépendant, qui REMPLACE la navigation principale dans `app/AppDashboardPage.vue` quand on est dans un contexte patient

**Rationale:**
- Séparation des responsabilités: le menu gère uniquement la navigation contextuelle patient
- Permet une réutilisation future si d'autres contextes de navigation sont ajoutés
- Facilite le test et la maintenance du code
- Intégré conditionnellement dans `app/AppDashboardPage.vue` pour remplacer la navigation principale existante

**Alternatives considérées:**
- Intégrer directement dans chaque page patient: rejeté car duplication de code et ne respecte pas la contrainte de ne pas modifier les pages
- Modifier la navigation principale existante: rejeté car casse la navigation pour les pages non-patient
- Ajouter le menu à côté de la navigation: rejeté car prend de l'espace inutilement

### 2. Détection du contexte patient via route params

**Decision:** Utiliser `useRoute()` pour détecter si on est dans une route patient (ex: `/patients/[id]/...`)

**Rationale:**
- Approche déclarative basée sur l'URL, facile à comprendre et à maintenir
- Utilise les capacités natives de Nuxt sans nécessiter de state management supplémentaire
- Compatible avec la navigation arrière/avant du navigateur
- Ne modifie pas les routes existantes

**Alternatives considérées:**
- State management avec Pinia: rejeté car ajoute de la complexité inutile
- Props passées aux composants: rejeté car nécessiterait de modifier les pages existantes

### 3. Mapping direct vers les routes existantes

**Decision:** Le menu contextuel mappe directement vers les routes existantes: index, plan, seances, documents, facturation

**Rationale:**
- Aucune modification des routes existantes requise
- Les onglets existants continuent de fonctionner comme avant
- L'utilisateur peut utiliser soit les onglets soit le menu contextuel
- Maintient la cohérence avec l'implémentation actuelle

**Alternatives considérées:**
- Créer de nouvelles routes pour le menu: rejeté car inutile et complexifie le routing
- Renommer les routes existantes: rejeté car casse l'implémentation actuelle

### 4. Bouton de retour en bas du menu contextuel

**Decision:** Ajouter un bouton fixe en bas du menu contextuel pour retourner à `/patients`

**Rationale:**
- Accessibilité facile - toujours visible dans le menu
- Intuitif pour l'utilisateur: "je veux quitter le dossier patient"
- Coordonne avec le design Nuxt UI existant
- Ne modifie pas les pages existantes

**Alternatives considérées:**
- Bouton dans chaque page patient: rejeté car nécessite de modifier les pages existantes
- Menu déroulant: rejeté car moins accessible et ajoute de la complexité

### 5. Remplacement de la navigation principale

**Decision:** Le menu contextuel REMPLACE la navigation principale dans le contexte patient (pas de menu supplémentaire)

**Rationale:**
- Optimise l'espace écran: pas de menu supplémentaire qui prend de la place
- Transition fluide: le menu se remplace dynamiquement
- Design plus épuré: un seul menu visible à la fois
- Compatible avec le layout existant

**Alternatives considérées:**
- Menu à côté du contenu: rejeté car prend de l'espace
- Menu en haut de page: rejeté car gênerait les onglets existants
- Menu en bas de page: rejeté car moins accessible ergonomiquement
- Menu flottant (popover): rejeté car moins visible et demande une interaction pour s'afficher

## Risks / Trade-offs

### Risk: Performance avec navigation fréquente

**Risk:** La navigation entre les pages patient peut déclencher des fetchs de données répétitifs.

**Mitigation:**
- Utiliser Pinia Colada déjà en place pour le cache des données patient
- Les composants existants utilisent déjà des composables optimisés
- Le menu contextuel ne fait que la navigation, pas de fetchs de données

### Risk: UX confuse avec présence de deux modes de navigation

**Risk:** Les utilisateurs peuvent être confus entre les onglets existants et le menu contextuel.

**Mitigation:**
- Les deux modes coexistent et offrent des alternatives
- Le menu contextuel est un raccourci, pas un remplacement
- Les onglets restent visibles et fonctionnels comme avant
- Design cohérent entre onglets et menu contextuel

### Risk: Accessibilité avec menu conditionnel

**Risk:** Le menu contextuel n'étant visible que dans certains contextes peut poser des problèmes d'accessibilité.

**Mitigation:**
- Ajouter des attributs ARIA appropriés
- Navigation au clavier fluide
- Le menu s'affiche uniquement quand pertinent (contexte patient)
- Tests d'accessibilité avec lecteur d'écran