<script setup lang="ts">
  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const pricing = reactive({
    sessionRates: {
      cabinet: null as number | null,
      domicile: null as number | null,
      teleconsultation: null as number | null
    }
  })

  const scheduling = reactive({
    bookingWindowDays: 30,
    cancellationHours: 24,
    allowSameDay: false,
    requirePaymentUpfront: false,
    remindersEnabled: true,
    reminderIntervals: [24, 48]
  })

  watchEffect(() => {
    if (organization.value) {
      Object.assign(
        pricing,
        organization.value.pricing || {
          sessionRates: { cabinet: null, domicile: null, teleconsultation: null }
        }
      )
      Object.assign(
        scheduling,
        organization.value.scheduling || {
          bookingWindowDays: 30,
          cancellationHours: 24,
          allowSameDay: false,
          requirePaymentUpfront: false,
          remindersEnabled: true,
          reminderIntervals: [24, 48]
        }
      )
    }
  })

  const isSaving = ref(false)
  const toast = useToast()

  async function handleSave() {
    isSaving.value = true

    try {
      const organizationId = route.params.id as string

      const formData = {
        pricing: toRaw(pricing),
        scheduling: toRaw(scheduling)
      }

      const result = updateOrganizationSchema.safeParse(formData)

      if (!result.success) {
        const errors = result.error.issues
        const firstError = errors[0]
        if (firstError) {
          toast.add({
            title: 'Erreur de validation',
            description: firstError.message,
            color: 'error'
          })
        }
        isSaving.value = false
        return
      }

      await authClient.organization.update({
        organizationId,
        data: formData
      })

      toast.add({
        title: 'Succès',
        description: 'Les tarifs et règles de réservation ont été mis à jour',
        color: 'success'
      })
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.add({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de la mise à jour",
        color: 'error'
      })
    } finally {
      isSaving.value = false
    }
  }

  function handleCancel() {
    toast.add({
      title: 'Annulation',
      description: 'Modifications annulées',
      color: 'neutral'
    })
  }

  defineExpose({
    handleSave
  })
</script>

<template>
  <div v-if="isPending" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
  </div>
  <div v-else class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2">
    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Tarifs de séance">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted text-sm">
            Ces tarifs sont utilisés par défaut pour les séances. Ils peuvent être surchargés au niveau du plan de
            traitement ou de la séance.
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <UFormField label="Cabinet (MAD)">
                <UInput v-model="pricing.sessionRates.cabinet" type="number" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Domicile (MAD)">
                <UInput v-model="pricing.sessionRates.domicile" type="number" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Téléconsultation (MAD)">
                <UInput v-model="pricing.sessionRates.teleconsultation" type="number" class="w-full" />
              </UFormField>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard variant="outline" title="Règles de rendez-vous">
        <div class="flex flex-col gap-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Fenêtre de réservation (jours)">
                <UInput v-model="scheduling.bookingWindowDays" type="number" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Délai d'annulation (heures)">
                <UInput v-model="scheduling.cancellationHours" type="number" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Rappels (heures avant)">
                <UTextarea
                  :value="scheduling.reminderIntervals?.join(', ') || ''"
                  @input="
                    (e: Event) =>
                      (scheduling.reminderIntervals = (e.target as HTMLTextAreaElement).value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean)
                        .map(Number))
                  "
                  placeholder="24, 48, 72"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
          <div class="bg-elevated/50 border-border mt-2 flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Réservation le jour même</span>
            <USwitch v-model="scheduling.allowSameDay" />
          </div>
          <div class="bg-elevated/50 border-border flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Paiement à l'avance requis</span>
            <USwitch v-model="scheduling.requirePaymentUpfront" />
          </div>
        </div>
      </AppCard>
    </div>

    <div class="flex w-full flex-col gap-6">
      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon name="i-lucide-calendar-clock" class="text-muted size-16" />
        <div>
          <p class="text-highlighted text-sm font-bold">Tarifs et réservations à jour</p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>

      <AppCard variant="outline" title="À propos des tarifs">
        <div class="flex flex-col gap-y-4">
          <p class="text-muted text-sm">
            Les tarifs configurés ici sont les tarifs par défaut pour votre organisation. Vous pouvez les adapter pour
            chaque plan de traitement ou séance individuelle si nécessaire.
          </p>
          <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
            <UIcon name="i-lucide-info" class="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <p class="text-primary text-sm font-bold">Conseil</p>
              <p class="text-muted mt-1 text-xs">
                Assurez-vous de mettre à jour les tarifs régulièrement pour refléter vos prix actuels.
              </p>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
