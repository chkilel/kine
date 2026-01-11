<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{
    room?: Room
  }>()

  const emit = defineEmits<{ close: [value?: any] }>()

  const { mutate: createRoom, isLoading: isCreating } = useCreateRoom()
  const { mutate: updateRoom, isLoading: isUpdating } = useUpdateRoom()

  const isLoading = computed(() => isCreating.value || isUpdating.value)

  const searchEquipment = ref('')

  const equipmentList = [
    'Table de traction',
    'Table électrique',
    "Vélo d'appartement",
    'Tapis roulant',
    'Électrothérapie (TENS)',
    'Ultrasons',
    'Ondes de choc',
    'Espalier',
    'Autre...'
  ] as const

  const filteredEquipment = computed(() => {
    if (!searchEquipment.value) return equipmentList
    return equipmentList.filter((e) => e.toLowerCase().includes(searchEquipment.value.toLowerCase()))
  })

  const isEditMode = computed(() => !!props.room)

  const modalTitle = computed(() => (isEditMode.value ? 'Modifier la salle' : 'Ajouter une nouvelle salle'))

  const submitButtonText = computed(() => (isEditMode.value ? 'Enregistrer les modifications' : 'Ajouter la salle'))

  const formState = reactive({
    name: '',
    description: '',
    capacity: 1,
    surface: '',
    isAccessible: true,
    equipment: [] as (typeof equipmentList)[number][]
  })

  const formRef = useTemplateRef<HTMLFormElement>('roomFormRef')

  watch(
    () => props.room,
    (room) => {
      if (room) {
        formState.name = room.name
        formState.description = room.description || ''
        formState.capacity = room.capacity
        formState.surface = room.area ? String(room.area) : ''
        formState.isAccessible = room.prm === 1
        formState.equipment = (room.equipment || []) as (typeof equipmentList)[number][]
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  async function handleSubmit(event: FormSubmitEvent<typeof formState>) {
    const roomData = {
      name: event.data.name,
      description: event.data.description,
      capacity: event.data.capacity,
      area: event.data.surface ? Number(event.data.surface) : undefined,
      prm: event.data.isAccessible,
      equipment: event.data.equipment
    }

    if (isEditMode.value && props.room) {
      updateRoom({
        roomId: props.room.id,
        roomData,
        onSuccess() {
          emit('close')
          resetForm()
        }
      })
    } else {
      createRoom({
        roomData,
        onSuccess() {
          emit('close')
          resetForm()
        }
      })
    }
  }

  function resetForm() {
    Object.assign(formState, {
      name: '',
      description: '',
      capacity: 1,
      surface: '',
      isAccessible: true,
      equipment: [] as string[]
    })
    searchEquipment.value = ''
  }

  function handleCancel() {
    resetForm()
    emit('close')
  }

  function submitButton() {
    formRef.value?.submit()
  }
</script>

<template>
  <USlideover
    :dismissible="false"
    :title="modalTitle"
    :description="
      isEditMode
        ? 'Modifiez les détails et les équipements de la salle de soin.'
        : 'Configurez les détails et les équipements de votre nouvelle salle de soin.'
    "
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated'
    }"
    @close="handleCancel"
  >
    <template #body>
      <UForm ref="roomFormRef" :state="formState" class="space-y-6" @submit="handleSubmit">
        <div class="space-y-6">
          <AppCard title="Informations Générales" variant="outline">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Nom de la salle" name="name" required class="md:col-span-2">
                <UInput
                  v-model="formState.name"
                  placeholder="Ex: Salle de traitement 1"
                  :disabled="isLoading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Description / Usage" name="description" class="md:col-span-2">
                <UTextarea
                  v-model="formState.description"
                  placeholder="Brève description de l'usage principal de la salle..."
                  :rows="3"
                  :disabled="isLoading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Capacité maximale (patients)" name="capacity">
                <UInput
                  v-model="formState.capacity"
                  type="number"
                  min="1"
                  icon="i-lucide-users"
                  :disabled="isLoading"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Surface (m²)" name="surface">
                <UInput
                  v-model="formState.surface"
                  type="number"
                  placeholder="20"
                  icon="i-lucide-ruler-dimension-line"
                  :disabled="isLoading"
                  class="w-full"
                />
              </UFormField>

              <div class="bg-info-50 border-info-200 rounded-md border p-4 md:col-span-2">
                <USwitch
                  v-model="formState.isAccessible"
                  :disabled="isLoading"
                  :ui="{
                    root: 'flex-row-reverse justify-between w-full items-center',
                    wrapper: ' flex-1'
                  }"
                >
                  <template #label>
                    <div class="flex w-full flex-1 items-center gap-4">
                      <UIcon name="i-lucide-accessibility" class="text-info size-10" />
                      <div>
                        <p class="text-toned text-base font-bold">Accessibilité PMR</p>
                        <p class="text-muted text-sm">
                          Cette salle est-elle adaptée aux personnes à mobilité réduite ?
                        </p>
                      </div>
                    </div>
                  </template>
                </USwitch>
              </div>
            </div>
          </AppCard>

          <AppCard title="Équipements Disponibles" variant="outline">
            <div class="space-y-4">
              <p class="text-muted text-sm">Sélectionnez les équipements fixes présents dans cette salle.</p>

              <UInput
                v-model="searchEquipment"
                placeholder="Rechercher un équipement..."
                icon="i-lucide-search"
                :disabled="isLoading"
                class="w-full"
              />

              <UCheckboxGroup
                v-model="formState.equipment"
                :items="[...filteredEquipment]"
                variant="card"
                color="primary"
                :disabled="isLoading"
                :ui="{ fieldset: 'grid grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2' }"
              />
            </div>
          </AppCard>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton variant="outline" color="neutral" size="lg" :disabled="isLoading" @click="handleCancel">
          Annuler
        </UButton>
        <UButton
          type="submit"
          @click="submitButton"
          color="primary"
          size="lg"
          :loading="isLoading"
          :disabled="isLoading"
        >
          {{ submitButtonText }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
