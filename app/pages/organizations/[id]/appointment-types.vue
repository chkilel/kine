<script setup lang="ts">
  import { v7 as uuidv7 } from 'uuid'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { LazyAppModalConfirm } from '#components'
  import type { OrgAppointmentTypeItem } from '~~/shared/types/org.types'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const appointmentTypes = ref<OrgAppointmentTypeItem[]>([])

  const defaultTypes = (org?: Organization): OrgAppointmentTypeItem[] => {
    return org?.appointmentTypes ?? []
  }

  watch(
    organization,
    (org) => {
      if (!org) return
      appointmentTypes.value = defaultTypes(org)
    },
    { immediate: true }
  )

  const updateOrganization = useUpdateOrganization()
  const toast = useToast()
  const isSaving = computed(() => updateOrganization.isLoading.value)

  function onSubmit() {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        appointmentTypes: appointmentTypes.value
      }
    })
  }

  function handleCancel() {
    if (organization.value) {
      appointmentTypes.value = defaultTypes(organization.value)
      toast.add({
        title: 'Annulation',
        description: 'Modifications annulées',
        color: 'neutral'
      })
    }
  }

  // ─── Add / Edit form ──────────────────────────────────────────
  const itemTypeSchema = orgAppointmentTypeItemSchema.omit({ id: true })
  type ItemTypeForm = Omit<OrgAppointmentTypeItem, 'id'>

  const isAdding = ref(false)
  const editingIndex = ref<number | null>(null)
  const isEditing = computed(() => editingIndex.value !== null)
  const addButtonLabel = computed(() => (isEditing.value ? 'Mettre à jour le type' : 'Ajouter le type'))

  const formState = reactive<ItemTypeForm>({
    code: '',
    title: '',
    isDefault: false
  })

  function transformCode(value: string): string {
    return value
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '')
  }

  function onItemSubmit(_event: FormSubmitEvent<ItemTypeForm>) {
    if (!appointmentTypes.value) appointmentTypes.value = []

    const itemData: OrgAppointmentTypeItem = {
      id: editingIndex.value !== null ? appointmentTypes.value[editingIndex.value]!.id : uuidv7(),
      code: transformCode(formState.code),
      title: formState.title.trim(),
      isDefault: formState.isDefault
    }

    if (editingIndex.value !== null) {
      appointmentTypes.value[editingIndex.value] = itemData
    } else {
      appointmentTypes.value.push(itemData)
    }

    resetForm()
  }

  function startEditItem(index: number) {
    const item = appointmentTypes.value?.[index]
    if (!item) return

    editingIndex.value = index
    formState.code = item.code
    formState.title = item.title
    formState.isDefault = item.isDefault
    isAdding.value = true
  }

  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)

  async function removeItem(index: number) {
    const item = appointmentTypes.value?.[index]
    if (!item || item.isDefault) return

    const confirmed = await confirmModal.open({
      title: 'Supprimer le type',
      message: `Voulez-vous vraiment supprimer « ${item.title} » (${item.code}) ?`,
      confirmText: 'Supprimer',
      confirmColor: 'error',
      icon: 'i-hugeicons-delete-02'
    })

    if (!confirmed) return

    appointmentTypes.value.splice(index, 1)
    onSubmit()
  }

  function resetForm() {
    editingIndex.value = null
    formState.code = ''
    formState.title = ''
    formState.isDefault = false
    isAdding.value = false
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="isPending" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
    </div>

    <template v-else>
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <AppCard variant="outline" title="À propos des types de rendez-vous">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Configurez les types de rendez-vous disponibles dans votre cabinet. Les types par défaut ne peuvent pas
              être supprimés, mais leur titre peut être modifié.
            </p>
            <div class="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border p-4">
              <UIcon name="i-lucide-info" class="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p class="text-primary text-sm font-bold">Format des codes</p>
                <p class="text-muted mt-1 text-xs">
                  Les codes doivent être en majuscules avec des underscores (ex: ACUPUNCTURE, BILAN_VENTILATOIRE).
                </p>
              </div>
            </div>
          </div>
        </AppCard>

        <div
          class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
        >
          <UIcon
            :name="isSaving ? 'i-lucide-loader-2' : 'i-hugeicons-calendar-03'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Types configurés' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>
      </div>

      <div class="flex w-full flex-col gap-6">
        <AppCard title="Types de rendez-vous">
          <template #actions>
            <UButton
              v-if="appointmentTypes?.length && !isAdding"
              icon="i-hugeicons-add-01"
              color="primary"
              variant="subtle"
              size="sm"
              @click="isAdding = true"
            />
          </template>
          <div class="space-y-2">
            <div v-if="appointmentTypes?.length" class="divide-default space-y-2 divide-y">
              <div
                v-for="(item, index) in appointmentTypes"
                :key="item.id"
                class="bg-muted hover:border-default flex items-start gap-4 rounded-md border border-transparent p-2 transition-colors hover:shadow-sm"
              >
                <AppIconBox
                  name="i-hugeicons-calendar-03"
                  color="primary"
                  variant="soft"
                  size="xl"
                  class="rounded-md"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{{ item.title }}</p>
                    <UBadge v-if="item.isDefault" variant="subtle" color="primary" size="xs">Par défaut</UBadge>
                  </div>
                  <div class="text-muted flex items-center justify-between gap-4 text-xs">
                    <span class="font-mono">{{ item.code }}</span>
                    <div class="flex items-center gap-2">
                      <UButton
                        icon="i-hugeicons-edit-04"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        square
                        @click="startEditItem(index)"
                      />
                      <UButton
                        icon="i-hugeicons-delete-02"
                        variant="ghost"
                        color="error"
                        size="sm"
                        square
                        :disabled="item.isDefault"
                        @click="removeItem(index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="isAdding" class="border-accented space-y-3 rounded-md border p-4">
              <div class="flex items-center justify-between">
                <h4 class="font-medium">
                  {{ isEditing ? 'Modifier le type' : 'Ajouter un type' }}
                </h4>
                <UButton
                  icon="i-hugeicons-cancel-01"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                  @click="resetForm"
                />
              </div>
              <UForm
                :state="formState"
                :schema="itemTypeSchema"
                :validateOn="['input']"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
                @submit="onItemSubmit"
              >
                <UFormField label="Code" name="code" required>
                  <UInput
                    :model-value="formState.code"
                    placeholder="ACUPUNCTURE"
                    class="w-full"
                    @update:model-value="(val: string) => (formState.code = transformCode(val))"
                  />
                </UFormField>
                <UFormField label="Titre" name="title" required>
                  <UInput v-model="formState.title" placeholder="Acupuncture" class="w-full" />
                </UFormField>
                <div class="col-span-1 flex gap-2 md:col-span-2">
                  <UButton :label="addButtonLabel" color="primary" variant="subtle" size="sm" type="submit" />
                  <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="resetForm" />
                </div>
              </UForm>
            </div>

            <UEmpty
              v-if="!appointmentTypes?.length && !isAdding"
              variant="naked"
              size="sm"
              icon="i-hugeicons-calendar-03"
              title="Aucun type configuré"
              description="Ajoutez un type pour définir les types de rendez-vous disponibles."
              :actions="[
                {
                  icon: 'i-hugeicons-add-01',
                  label: 'Ajouter un type',
                  variant: 'subtle',
                  onClick(event) {
                    event.stopPropagation()
                    isAdding = true
                  }
                }
              ]"
            />
          </div>
        </AppCard>
      </div>

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
            :disabled="isSaving || appointmentTypes.length === 0"
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
  </div>
</template>
