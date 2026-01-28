# Spec: Consultation Page Workflow

## Pre-Session Step

### WHEN therapist opens consultation page for scheduled consultation

- THEN URL is `/consultations/[id]?step=pre-session`
- AND consultation status is `scheduled` or `confirmed`
- AND patient info sidebar is displayed
- AND EVA input card is shown in center
- AND timer card shows planned duration but is disabled
- AND "Démarrer" button is disabled

### WHEN therapist slides EVA to pain level

- THEN pain level value updates
- AND "Valider le niveau de douleur" button is enabled

### WHEN therapist clicks "Valider le niveau de douleur"

- THEN EVA value is saved to consultation.painLevelBefore
- AND "Valider" button changes to "Modifier"
- AND "Démarrer" button is enabled
- AND step remains pre-session (timer not started)

### WHEN therapist disables EVA evaluation

- THEN pain level is cleared
- AND "Évaluation Non nécessaire" is displayed
- AND "Démarrer" button is enabled

### WHEN therapist clicks "Démarrer" button

- THEN consultation status updates to `in_progress`
- AND actualStartTime is set to current time
- AND page navigates to `?step=active-session`

---

## Active Session Step

### WHEN therapist enters active session step

- THEN URL is `/consultations/[id]?step=active-session`
- AND consultation status is `in_progress`
- AND timer is running and displayed
- AND notes editor is focused
- AND patient info sidebar is visible
- AND previous notes are loaded in editor
- AND applied tags are shown

### WHEN therapist types notes

- THEN notes are saved every 1 second (debounced)
- AND auto-save indicator shows "Sauvegardé"

### WHEN therapist adds a smart tag

- THEN tag is added to selectedTags
- AND tag is saved to consultation.tags
- AND button shows checkmark icon

### WHEN therapist clicks "Pause" button

- THEN timer pauses
- AND pauseStartTime is recorded
- AND "Pause" button changes to "Reprendre"
- AND message shows "En pause depuis X min"

### WHEN therapist clicks "Reprendre" button

- THEN timer resumes
- AND pauseDuration is calculated and stored
- AND "Reprendre" button changes to "Pause"

### WHEN therapist clicks "Prolonger de 5 min" button

- THEN extendedDurationMinutes increases by 5
- AND timer countdown updates

### WHEN remaining time is 5 minutes or less

- THEN warning banner is displayed
- AND warning message shows "5 minutes restantes"
- AND extend button is visible

### WHEN therapist clicks "Terminer" button

- THEN confirmation modal opens
- AND modal shows message "Terminer la consultation ?"
- AND timer is paused

### WHEN therapist confirms termination

- THEN consultation status remains `in_progress`
- AND page navigates to `?step=post-session`

---

## Post-Session Step

### WHEN therapist enters post-session step

- THEN URL is `/consultations/[id]?step=post-session`
- AND final EVA card is displayed in center
- AND notes are shown in read-only mode
- AND applied tags are shown
- AND timer shows elapsed time (stopped)
- AND pain differential card is empty (waiting for input)

### WHEN therapist slides final EVA

- THEN pain level after value updates
- AND pain differential is calculated immediately
- AND differential color is:
  - Green if pain level decreased
  - Red if pain level increased
  - Gray if pain level unchanged

### WHEN differential is negative (improvement)

- THEN differential shows green color
- AND message shows "Douleur diminuée de X points"

### WHEN differential is positive (worse)

- THEN differential shows red color
- AND message shows "Douleur augmentée de X points"

### WHEN differential is zero

- THEN differential shows gray color
- AND message shows "Douleur stable"

### WHEN therapist clicks "Confirmer et Continuer"

- THEN pain level after is saved to consultation.painLevelAfter
- AND consultation status is updated to `completed`
- AND actualDurationSeconds is calculated
- AND notes and tags are finalized
- AND page navigates to `?step=summary`

---

## Summary Step

### WHEN therapist enters summary step

- THEN URL is `/consultations/[id]?step=summary`
- AND consultation status is `completed`
- AND EVA progression chart is displayed
- AND plan progress is updated
- AND billing section is shown

### WHEN chart loads

- THEN all past consultations are fetched
- AND EVA levels (before and after) are plotted
- AND latest session is highlighted
- AND trend line shows pain improvement over time

### WHEN therapist views billing section

- THEN consultation duration is shown
- AND billing amount is calculated
- AND payment status is shown (pending/paid)

### WHEN therapist clicks "Marquer comme payé"

- THEN consultation.billingStatus updates to `paid`
- AND payment amount is recorded
- AND button changes to "Payé"

### WHEN therapist clicks "Prendre prochain rendez-vous"

- THEN PlanningSlideover opens
- AND patient is pre-selected
- AND consultation date is suggested based on frequency

### WHEN therapist completes next appointment booking

- THEN PlanningSlideover closes
- AND new consultation is created
- AND confirmation toast is shown

### WHEN therapist clicks "Retour au tableau de bord"

- THEN page navigates to `/therapists/day`
- AND consultation list is refreshed

### WHEN therapist clicks "Voir dossier patient"

- THEN page navigates to `/patients/[id]?tab=seances`
- AND sessions tab is selected

---

## URL Navigation & Recovery

### WHEN therapist navigates back in browser

- THEN step changes to previous step
- AND state is preserved
- AND unsaved changes are preserved (if any)

### WHEN therapist navigates forward in browser

- THEN step changes to next step
- AND state is preserved

### WHEN therapist refreshes page during active session

- THEN current step is restored from URL
- AND consultation data is refetched
- AND timer recalculates elapsed time
- AND unsaved notes may be lost (if not auto-saved)

### WHEN therapist accidentally closes tab during active session

- AND reopens `/consultations/[id]?step=active-session`
- THEN session state is restored from database
- AND timer continues from last saved state
- AND notes are loaded from database

### WHEN therapist tries to skip to summary step from pre-session

- THEN navigation is blocked
- AND error message shows "Veuillez d'abord démarrer la séance"
- OR auto-redirect to pre-session

### WHEN therapist tries to open completed consultation

- THEN page navigates to `?step=summary`
- AND all steps are read-only
- AND analytics are displayed

---

## Error Handling

### WHEN consultation not found

- THEN 404 error page is shown
- AND "Consultation introuvable" message is displayed
- AND "Retour au tableau de bord" button is shown

### WHEN patient not found

- THEN error message shows "Patient introuvable"
- AND consultation details are hidden
- AND therapist can still view notes and timer

### WHEN network error during auto-save

- THEN auto-save indicator shows "Erreur de sauvegarde"
- AND retry button is shown
- AND changes are preserved in local state

### WHEN timer sync fails

- THEN timer continues locally
- AND error toast is shown
- AND data syncs on next refresh

---

## Responsive Behavior

### WHEN view is on mobile (<768px)

- THEN layout is single column
- AND patient info is collapsible
- AND step progress bar shows stepper
- AND bottom navigation has step buttons
- AND chart in summary is scrollable

### WHEN view is on tablet (768-1024px)

- THEN patient info stacks on top
- AND content and controls are two-column
- AND patient info can be collapsed to save space

### WHEN view is on desktop (>1024px)

- THEN three-column layout is maintained
- AND patient info is fixed on left
- AND content takes center
- AND controls are fixed on right

---

## Accessibility

### WHEN keyboard user navigates

- THEN all interactive elements are focusable
- AND step navigation works with arrow keys
- AND pain level can be selected with number keys (0-9)
- AND timer can be paused/resumed with Space key

### WHEN screen reader is active

- THEN step progress is announced
- AND timer countdown is announced
- AND pain differential color is described ("green" vs "red")
- AND error messages are announced

### WHEN color contrast is checked

- THEN all text meets WCAG AA standards
- AND pain level buttons have sufficient contrast
- AND warning alerts have sufficient contrast

---

## Integration Scenarios

### WHEN therapist starts session from day page

- THEN navigateTo(`/consultations/${consultation.id}`) is called
- AND page opens in new tab or same tab
- AND pre-session step is shown

### WHEN therapist starts session from planning slideover

- THEN PlanningSlideover closes
- AND navigateTo(`/consultations/${consultation.id}`) is called
- AND pre-session step is shown

### WHEN therapist views active session from patient sessions tab

- THEN navigateTo(`/consultations/${consultation.id}`) is called
- AND active-session step is shown (if in_progress)
- OR summary step is shown (if completed)
