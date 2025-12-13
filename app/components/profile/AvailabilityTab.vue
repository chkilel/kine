<script setup lang="ts">
  const toast = useToast()

  // Availability Management State
  const weeklyTemplates = ref<WeeklyAvailabilityTemplate[]>([
    {
      id: '1',
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '2',
      dayOfWeek: 'Mon',
      startTime: '14:00',
      endTime: '18:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '3',
      dayOfWeek: 'Tue',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '4',
      dayOfWeek: 'Wed',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '5',
      dayOfWeek: 'Thu',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    },
    {
      id: '6',
      dayOfWeek: 'Fri',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    }
  ])

  const exceptions = ref<AvailabilityException[]>([
    {
      id: '1',
      date: '2024-12-25',
      isAvailable: false,
      reason: 'Jour férié - Noël'
    },
    {
      id: '2',
      date: '2024-12-31',
      startTime: '09:00',
      endTime: '12:00',
      isAvailable: true,
      reason: 'Horaires réduits'
    }
  ])

  // Template management functions
  function addNewTemplate() {
    const newTemplate: WeeklyAvailabilityTemplate = {
      id: Date.now().toString(),
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '12:00',
      location: 'clinic',
      maxSessions: 4
    }
    weeklyTemplates.value.push(newTemplate)
  }

  function deleteTemplate(template: WeeklyAvailabilityTemplate) {
    const index = weeklyTemplates.value.findIndex((t: WeeklyAvailabilityTemplate) => t.id === template.id)
    if (index !== -1) {
      weeklyTemplates.value.splice(index, 1)
      toast.add({
        title: 'Succès',
        description: 'Modèle de disponibilité supprimé',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }
  }

  // Exception management functions
  function addNewException() {
    const newException: AvailabilityException = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0] || '',
      startTime: undefined,
      endTime: undefined,
      isAvailable: false,
      reason: undefined
    }
    exceptions.value.push(newException)
  }

  function deleteException(exception: AvailabilityException) {
    const index = exceptions.value.findIndex((e: AvailabilityException) => e.id === exception.id)
    if (index !== -1) {
      exceptions.value.splice(index, 1)
      toast.add({
        title: 'Succès',
        description: 'Exception supprimée',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }
  }

  // Global action functions
  function cancelChanges() {
    // Reset to original data (in real app, this would fetch from API)
    toast.add({
      title: 'Info',
      description: 'Modifications annulées',
      icon: 'i-lucide-info',
      color: 'neutral'
    })
  }

  function saveAllChanges() {
    // Save all changes (in real app, this would send to API)
    toast.add({
      title: 'Succès',
      description: 'Disponibilités enregistrées avec succès',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  }
</script>

<template>
  <div class="mt-5 space-y-6">
    <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800/50">
      <h3 class="mb-4 text-base font-bold text-gray-900 dark:text-white">Modèles de disponibilité hebdomadaire</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th class="px-4 py-3" scope="col">Jour de la semaine</th>
              <th class="px-4 py-3" scope="col">Heure de début</th>
              <th class="px-4 py-3" scope="col">Heure de fin</th>
              <th class="px-4 py-3" scope="col">Lieu</th>
              <th class="px-4 py-3" scope="col">Max séances</th>
              <th class="px-4 py-3 text-right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(template, index) in weeklyTemplates"
              :key="template.id"
              class="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <td class="min-w-[150px] px-4 py-3">
                <USelectMenu
                  v-model="template.dayOfWeek"
                  :items="PREFERRED_DAYS_OPTIONS"
                  value-key="value"
                  size="sm"
                  class="w-full"
                />
              </td>
              <td class="min-w-[120px] px-4 py-3">
                <UInput v-model="template.startTime" type="time" size="sm" class="w-full" />
              </td>
              <td class="min-w-[120px] px-4 py-3">
                <UInput v-model="template.endTime" type="time" size="sm" class="w-full" />
              </td>
              <td class="min-w-[150px] px-4 py-3">
                <USelectMenu
                  v-model="template.location"
                  :items="CONSULTATION_LOCATION_OPTIONS"
                  value-key="value"
                  size="sm"
                  class="w-full"
                />
              </td>
              <td class="min-w-[120px] px-4 py-3">
                <UInput v-model="template.maxSessions" type="number" min="1" max="10" size="sm" class="w-full" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-trash"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="deleteTemplate(template)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <UButton icon="i-lucide-plus" size="sm" variant="outline" class="mt-4" @click="addNewTemplate">
        Ajouter une plage
      </UButton>
    </div>

    <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800/50">
      <h3 class="mb-4 text-base font-bold text-gray-900 dark:text-white">Exceptions (indisponibilités spécifiques)</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th class="px-4 py-3" scope="col">Date</th>
              <th class="px-4 py-3" scope="col">Heure de début</th>
              <th class="px-4 py-3" scope="col">Heure de fin</th>
              <th class="px-4 py-3" scope="col">Disponible</th>
              <th class="px-4 py-3" scope="col">Motif</th>
              <th class="px-4 py-3 text-right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="exception in exceptions"
              :key="exception.id"
              class="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <td class="min-w-[150px] px-4 py-3">
                <UInput v-model="exception.date" type="date" size="sm" class="w-full" />
              </td>
              <td class="min-w-[120px] px-4 py-3">
                <UInput v-model="exception.startTime" type="time" size="sm" class="w-full" />
              </td>
              <td class="min-w-[120px] px-4 py-3">
                <UInput v-model="exception.endTime" type="time" size="sm" class="w-full" />
              </td>
              <td class="px-4 py-3">
                <USwitch v-model="exception.isAvailable" />
              </td>
              <td class="min-w-[180px] px-4 py-3">
                <UInput v-model="exception.reason" placeholder="Motif..." size="sm" class="w-full" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-trash"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="deleteException(exception)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <UButton icon="i-lucide-plus" size="sm" variant="outline" class="mt-4" @click="addNewException">
        Ajouter une exception
      </UButton>
    </div>

    <div class="mt-8 flex justify-end gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
      <UButton variant="outline" @click="cancelChanges">Annuler</UButton>
      <UButton color="primary" @click="saveAllChanges">Enregistrer les modifications</UButton>
    </div>
  </div>
</template>
