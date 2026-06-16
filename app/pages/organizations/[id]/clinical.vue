<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    clinical: {
      requirePainAssessment: org?.clinical?.requirePainAssessment ?? true,
      requireGoals: org?.clinical?.requireGoals ?? true,
      requireNextSteps: org?.clinical?.requireNextSteps ?? true,
      noteTemplates: org?.clinical?.noteTemplates ?? []
    },
    intake: {
      requiredFields: org?.intake?.requiredFields ?? [
        'firstName',
        'lastName',
        'dateOfBirth',
        'phone',
        'email',
        'address'
      ],
      consents: {
        privacy: org?.intake?.consents?.privacy ?? false,
        treatment: org?.intake?.consents?.treatment ?? false,
        financial: org?.intake?.consents?.financial ?? false,
        telehealth: org?.intake?.consents?.telehealth ?? false
      }
    }
  })

  const state = reactive<OrgClinicalIntake>(defaultForm())

  watch(
    organization,
    (org) => {
      if (!org) return
      Object.assign(state, defaultForm(org))
    },
    { immediate: true }
  )

  const updateOrganization = useUpdateOrganization()
  const toast = useToast()
  const isSaving = computed(() => updateOrganization.isLoading.value)
  const form = useTemplateRef('form')

  function onSubmit(event: FormSubmitEvent<OrgClinicalIntake>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        clinical: event.data.clinical,
        intake: event.data.intake
      }
    })
  }

  function handleCancel() {
    if (organization.value) {
      Object.assign(state, defaultForm(organization.value))
      form.value?.clear()
      toast.add({
        title: 'Annulation',
        description: 'Modifications annulées',
        color: 'neutral'
      })
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="isPending" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
    </div>
    <UForm
      v-else
      ref="form"
      :state="state"
      :schema="orgClinicalIntakeSchema"
      class="grid grid-cols-1 items-start gap-x-12 gap-y-6 lg:grid-cols-2"
      @submit="onSubmit"
    >
      <div class="flex w-full flex-col gap-6">
        <AppCard variant="outline" title="Documentation clinique">
          <div class="flex flex-col gap-y-4">
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Exiger évaluation de la douleur</span>
              <UFormField name="clinical.requirePainAssessment">
                <USwitch v-model="state.clinical.requirePainAssessment" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Exiger objectifs</span>
              <UFormField name="clinical.requireGoals">
                <USwitch v-model="state.clinical.requireGoals" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Exiger prochaines étapes</span>
              <UFormField name="clinical.requireNextSteps">
                <USwitch v-model="state.clinical.requireNextSteps" />
              </UFormField>
            </div>
          </div>
        </AppCard>

        <AppCard variant="outline" title="Inscription patient">
          <div class="flex flex-col gap-y-4">
            <UFormField label="Champs requis" name="intake.requiredFields">
              <UCheckboxGroup
                :items="[
                  { label: 'Prénom', value: 'firstName' },
                  { label: 'Nom', value: 'lastName' },
                  { label: 'Date de naissance', value: 'dateOfBirth' },
                  { label: 'Téléphone', value: 'phone' },
                  { label: 'Email', value: 'email' },
                  { label: 'Adresse', value: 'address' }
                ]"
                v-model="state.intake.requiredFields"
              />
            </UFormField>
            <p class="text-muted mb-2 text-sm">Formulaires de consentement</p>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Politique de confidentialité</span>
              <UFormField name="intake.consents.privacy">
                <USwitch v-model="state.intake.consents.privacy" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Consentement de traitement</span>
              <UFormField name="intake.consents.treatment">
                <USwitch v-model="state.intake.consents.treatment" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Responsabilité financière</span>
              <UFormField name="intake.consents.financial">
                <USwitch v-model="state.intake.consents.financial" />
              </UFormField>
            </div>
            <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
              <span class="text-highlighted text-sm font-bold">Téléconsultation</span>
              <UFormField name="intake.consents.telehealth">
                <USwitch v-model="state.intake.consents.telehealth" />
              </UFormField>
            </div>
          </div>
        </AppCard>
      </div>

      <div class="flex w-full flex-col gap-6">
        <div
          class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
        >
          <UIcon
            :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-stethoscope'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Configuration clinique à jour' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>

        <AppCard variant="outline" title="À propos de la configuration clinique">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Configurez ici les paramètres de documentation clinique et d'inscription des patients. Ces paramètres
              s'appliquent à tous les kinésithérapeutes de l'organisation.
            </p>
            <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
              <UIcon name="i-lucide-info" class="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p class="text-primary text-sm font-bold">Conseil</p>
                <p class="text-muted mt-1 text-xs">
                  Exiger l'évaluation de la douleur et les objectifs peut améliorer la qualité des soins et le suivi des
                  patients.
                </p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </UForm>

    <div class="border-default border-t pt-4">
      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Annuler les changements"
          color="neutral"
          variant="outline"
          :disabled="isSaving"
          @click="handleCancel"
        />
        <UButton
          label="Enregistrer les modifications"
          icon="i-hugeicons-save"
          :loading="isSaving"
          :disabled="isSaving"
          @click="form?.submit()"
        />
      </div>
    </div>
  </div>
</template>
