## Why

La navigation latérale statique limite l'expérience utilisateur dans le contexte patient. Les kinésithérapeutes ont besoin d'une navigation contextuelle rapide pour accéder aux différentes sections du dossier patient (vue d'ensemble, plan de traitement, hors plan, documents, facturation) sans passer par les onglets existants. Les onglets de navigation actuels restent inchangés - nous ajoutons uniquement un menu latéral contextuel qui s'affiche quand on consulte un dossier patient.

## What Changes

- Ajout d'un menu contextuel qui REMPLACE la navigation principale quand on consulte un dossier patient (routes `/patients/[id]/*`)
- Le menu contextuel détecte automatiquement le contexte patient et affiche les liens vers les sections existantes: Vue d'Ensemble (index), Plan de traitement (plan), Hors Plan (seances), Documents (documents), Facturation (facturation)
- Ajout d'un bouton de retour en bas du menu contextuel pour revenir à la navigation principale
- Transition fluide entre navigation principale et menu contextuel patient (même position, même largeur)
- Les pages patient existantes restent inchangées (index, plan, seances, documents, facturation)
- Les onglets de navigation existants restent inchangés

## Capabilities

### New Capabilities

- `patient-contextual-menu`: Menu latéral contextuel qui s'affiche uniquement quand on consulte un dossier patient, offrant un raccourci vers les sections existantes

### Modified Capabilities

Aucune spécification existante modifiée - ce sont de nouvelles fonctionnalités.

## Impact

**Composants:**
- Création d'un nouveau composant `PatientContextualMenu.vue` (menu contextuel pour patient)
- Modification de `app/AppDashboardPage.vue` pour conditionnellement afficher le menu contextuel patient OU la navigation principale (remplacement, pas ajout)

**Pages:**
- Pages patient existantes NON modifiées: `/pages/patients/[id]/index.vue`, `/pages/patients/[id]/plan.vue`, `/pages/patients/[id]/seances.vue`, `/pages/patients/[id]/documents.vue`, `/pages/patients/[id]/facturation.vue`
- Onglets de navigation existants NON modifiés

**Navigation:**
- Utilisation des route params pour détecter le contexte patient sur les routes existantes
- Le menu contextuel REMPLACE la navigation principale (pas d'espace supplémentaire)
- Transition fluide entre navigation principale et menu contextuel patient

**UX:**
- Optimisation de l'espace écran: le menu contextuel remplace la navigation principale (ne prend pas d'espace additionnel)
- Les onglets existants restent fonctionnels inchangés
- Bouton de retour pour quitter le contexte patient et revenir à la navigation principale