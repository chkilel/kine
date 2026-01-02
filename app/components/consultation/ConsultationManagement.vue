<script setup lang="ts">
  const props = defineProps<{ activePlanningTab: string }>()

  const consultations = ref<Consultation[]>([])
  const selectedConsultations = ref<string[]>([])

  const toggleConsultationSelection = (consultationId: string) => {
    const index = selectedConsultations.value.indexOf(consultationId)
    if (index > -1) {
      selectedConsultations.value.splice(index, 1)
    } else {
      selectedConsultations.value.push(consultationId)
    }
  }

  const postponeConsultation = () => {}
  const changeStatusConsultation = () => {}
  const handleDeleteConsultation = async () => {}
</script>

<template>
  <AppCard title="Gestion des Séances" description="Prévisualisez, générez et ajustez les séances ci-dessous.">
    <div class="mt-4 overflow-x-auto">
      <UTable
        :data="consultations"
        :columns="[
          { accessorKey: 'selected', header: '' },
          { accessorKey: 'date', header: 'Date & Heure' },
          { accessorKey: 'details', header: 'Détails Séance' },
          { accessorKey: 'status', header: 'Statut' },
          { id: 'actions', header: '' }
        ]"
      >
        <template #selected-cell="{ row }">
          <UCheckbox
            :model-value="selectedConsultations.includes(row.original.id)"
            @update:model-value="toggleConsultationSelection(row.original.id)"
          />
        </template>

        <template #date-cell="{ row }">
          <div>
            <div class="font-medium">
              {{
                new Date(row.original.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })
              }}
            </div>
            <div class="text-muted-foreground">{{ removeSecondsFromTime(row.original.startTime) || '' }}</div>
          </div>
        </template>

        <template #details-cell="{ row }">
          <div>
            <div class="font-medium" v-if="row.original.type">
              {{ getConsultationTypeLabel(row.original.type) }}
            </div>
            <div class="text-muted-foreground">{{ row.original.chiefComplaint || '' }}</div>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getConsultationStatusColor(row.original.status)" variant="soft" size="xs">
            {{ getConsultationStatusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UButton icon="i-lucide-edit" variant="ghost" color="neutral" size="sm" square />
            <UButton
              icon="i-lucide-trash"
              variant="ghost"
              color="error"
              size="sm"
              square
              @click="handleDeleteConsultation"
            />
          </div>
        </template>
      </UTable>
    </div>

    <div class="border-border bg-muted/50 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div class="text-muted-foreground text-sm font-medium">
        <span class="text-foreground font-bold">{{ selectedConsultations.length }}</span>
        séances sélectionnées
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-skip-forward"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="selectedConsultations.length === 0"
          @click="postponeConsultation"
        >
          Reporter
        </UButton>
        <UButton
          icon="i-lucide-check-square"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="selectedConsultations.length === 0"
          @click="changeStatusConsultation"
        >
          Changer statut
        </UButton>
        <UButton
          icon="i-lucide-trash"
          variant="outline"
          color="error"
          size="sm"
          :disabled="selectedConsultations.length === 0"
          @click="handleDeleteConsultation"
        >
          Supprimer
        </UButton>
      </div>
    </div>
  </AppCard>
</template>
