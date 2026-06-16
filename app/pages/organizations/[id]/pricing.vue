<script setup lang="ts">
  import { v7 as uuidv7 } from 'uuid'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const priceItems = ref<PriceItem[]>([])

  const defaultPriceItems = (org?: Organization): PriceItem[] => {
    return (org?.pricing?.priceItems || []).map((item) => ({
      ...item,
      rateCent: {
        clinic: item.rateCent.clinic ? centsToCurrency(item.rateCent.clinic) : 100,
        home: item.rateCent.home ? centsToCurrency(item.rateCent.home) : 100,
        telehealth: item.rateCent.telehealth ? centsToCurrency(item.rateCent.telehealth) : 100
      }
    }))
  }

  watch(
    organization,
    (org) => {
      if (!org) return
      priceItems.value = defaultPriceItems(org)
    },
    { immediate: true }
  )

  const updateOrganization = useUpdateOrganization()
  const toast = useToast()
  const isSaving = computed(() => updateOrganization.isLoading.value)
  const formState = computed(() => ({
    priceItems: priceItems.value.map((item) => ({
      ...item,
      rateCent: {
        clinic: item.rateCent.clinic,
        home: item.rateCent.home,
        telehealth: item.rateCent.telehealth
      }
    })),
    packages: organization.value?.pricing?.packages ?? []
  }))

  function onSubmit() {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: {
        pricing: formState.value
      }
    })
  }

  function handleCancel() {
    if (organization.value) {
      priceItems.value = defaultPriceItems(organization.value)
      toast.add({
        title: 'Annulation',
        description: 'Modifications annulées',
        color: 'neutral'
      })
    }
  }

  const priceItemFormSchema = priceItemSchema.omit({ id: true })

  const isAdding = ref(false)
  const editingIndex = ref<number | null>(null)

  const priceItemFormState = reactive<Omit<PriceItem, 'id'>>({
    code: '',
    description: '',
    rateCent: { clinic: 100, home: 100, telehealth: 100 },
    isDefault: false
  })

  const isEditing = computed(() => editingIndex.value !== null)

  const addButtonLabel = computed(() => (isEditing.value ? 'Mettre à jour le tarif' : 'Ajouter le tarif'))

  function onPriceItemSubmit({ data }: FormSubmitEvent<Omit<PriceItem, 'id'>>) {
    if (!priceItems.value) priceItems.value = []

    if (data.isDefault) {
      priceItems.value.forEach((item) => {
        item.isDefault = false
      })
    }

    const itemData: PriceItem = {
      id: editingIndex.value !== null ? priceItems.value[editingIndex.value]!.id : uuidv7(),
      code: data.code.trim().toUpperCase(),
      description: data.description.trim(),
      rateCent: data.rateCent,
      isDefault: data.isDefault
    }

    if (editingIndex.value !== null) {
      priceItems.value[editingIndex.value] = itemData
    } else {
      priceItems.value.push(itemData)
    }

    resetPriceItemForm()
  }

  function startEditItem(index: number) {
    const item = priceItems.value?.[index]
    if (!item) return

    editingIndex.value = index
    priceItemFormState.code = item.code
    priceItemFormState.description = item.description
    priceItemFormState.rateCent = { ...item.rateCent }
    priceItemFormState.isDefault = item.isDefault
    isAdding.value = true
  }

  function removeItem(index: number) {
    if (!priceItems.value || priceItems.value.length <= 1) return

    const wasDefault = priceItems.value[index]?.isDefault
    priceItems.value.splice(index, 1)

    if (wasDefault && priceItems.value.length > 0) {
      priceItems.value[0]!.isDefault = true
    }
  }

  function resetPriceItemForm() {
    editingIndex.value = null
    priceItemFormState.code = ''
    priceItemFormState.description = ''
    priceItemFormState.rateCent = { clinic: 100, home: 100, telehealth: 100 }
    priceItemFormState.isDefault = false
    isAdding.value = false
  }

  function setAsDefault(index: number) {
    if (!priceItems.value) return
    priceItems.value.forEach((item, i) => {
      item.isDefault = i === index
    })
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="isPending" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
    </div>

    <template v-else>
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <AppCard variant="outline" title="À propos des tarifs">
          <div class="flex flex-col gap-y-4">
            <p class="text-muted text-sm">
              Les tarifs configurés ici sont les tarifs par défaut pour votre organisation. Pour configurer les règles
              de réservation (fenêtre de réservation, délai d'annulation, rappels), rendez-vous sur la page
              <NuxtLink :to="`/organizations/${route.params.id}/scheduling`" class="text-primary underline">
                Planification
              </NuxtLink>
              .
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

        <div
          class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
        >
          <UIcon
            :name="isSaving ? 'i-lucide-loader-2' : 'i-hugeicons-dollar-circle'"
            :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
          />
          <div>
            <p class="text-highlighted text-sm font-bold">
              {{ isSaving ? 'Enregistrement en cours…' : 'Tarifs à jour' }}
            </p>
            <p class="text-muted mt-2 text-xs">
              Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
            </p>
          </div>
        </div>
      </div>

      <div class="flex w-full flex-col gap-6">
        <AppCard title="Tarifs">
          <template #actions>
            <UButton
              v-if="priceItems?.length && !isAdding"
              icon="i-hugeicons-add-01"
              color="primary"
              variant="subtle"
              size="sm"
              @click="isAdding = true"
            />
          </template>
          <div class="space-y-2">
            <div v-if="priceItems?.length" class="divide-default space-y-2 divide-y">
              <div
                v-for="(item, index) in priceItems"
                :key="item.id"
                class="bg-muted hover:border-default flex items-start gap-4 rounded-md border border-transparent p-2 transition-colors hover:shadow-sm"
              >
                <AppIconBox
                  name="i-hugeicons-dollar-circle"
                  color="primary"
                  variant="soft"
                  size="xl"
                  class="rounded-md"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{{ item.description }}</p>
                    <UBadge v-if="item.isDefault" variant="subtle" color="primary" size="xs">Par défaut</UBadge>
                  </div>
                  <div class="text-muted flex items-center justify-between gap-4 text-xs">
                    <span class="font-mono">{{ item.code }}</span>
                    <div class="flex items-center gap-2">
                      <UButton
                        v-if="!item.isDefault"
                        icon="i-hugeicons-star"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        square
                        title="Définir par défaut"
                        @click="setAsDefault(index)"
                      />
                      <AppIconBox
                        v-else
                        name="i-hugeicons-star"
                        color="primary"
                        variant="solid"
                        size="md"
                        title="Tarif par défaut"
                      />
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
                        :disabled="priceItems.length <= 1"
                        @click="removeItem(index)"
                      />
                    </div>
                  </div>

                  <div class="text-muted flex gap-4 text-xs max-sm:mt-4">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-hugeicons-hospital-01" class="size-3.5" />
                      {{ item.rateCent.clinic.toFixed(2) }} Dh
                    </span>
                    <span class="flex items-center gap-1">
                      <UIcon name="i-hugeicons-home-03" class="size-3.5" />
                      {{ item.rateCent.home.toFixed(2) }} Dh
                    </span>
                    <span class="flex items-center gap-1">
                      <UIcon name="i-hugeicons-video-02" class="size-3.5" />
                      {{ item.rateCent.telehealth.toFixed(2) }} Dh
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="isAdding" class="border-accented space-y-3 rounded-md border p-4">
              <div class="flex items-center justify-between">
                <h4 class="font-medium">
                  {{ isEditing ? 'Modifier le tarif' : 'Ajouter un tarif' }}
                </h4>
                <UButton
                  icon="i-hugeicons-cancel-01"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                  @click="resetPriceItemForm"
                />
              </div>
              <UForm
                ref="priceItemForm"
                :state="priceItemFormState"
                :schema="priceItemFormSchema"
                :validateOn="['input']"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
                @submit="onPriceItemSubmit"
              >
                <UFormField label="Code" name="code" required>
                  <UInput
                    v-model="priceItemFormState.code"
                    placeholder="MASSAGE_30"
                    class="w-full"
                    :disabled="isEditing && priceItemFormState.code === RESERVED_PRICE_ITEM_CODE"
                  />
                </UFormField>
                <UFormField label="Description" name="description" required>
                  <UInput v-model="priceItemFormState.description" placeholder="Massage de 30 minutes" class="w-full" />
                </UFormField>
                <UFormField label="Cabinet (MAD)" name="rateCent.clinic" required>
                  <UInput v-model.number="priceItemFormState.rateCent.clinic" type="number" class="w-full" />
                </UFormField>
                <UFormField label="Domicile (MAD)" name="rateCent.home" required>
                  <UInput v-model.number="priceItemFormState.rateCent.home" type="number" class="w-full" />
                </UFormField>
                <UFormField label="Téléconsultation (MAD)" name="rateCent.telehealth" required>
                  <UInput v-model.number="priceItemFormState.rateCent.telehealth" type="number" class="w-full" />
                </UFormField>
                <UFormField label="Tarif par défaut" name="isDefault">
                  <UCheckbox v-model="priceItemFormState.isDefault" label="Définir comme tarif par défaut" />
                </UFormField>
                <div class="col-span-1 flex gap-2 md:col-span-2">
                  <UButton :label="addButtonLabel" color="primary" variant="subtle" size="sm" type="submit" />
                  <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="resetPriceItemForm" />
                </div>
              </UForm>
            </div>

            <UEmpty
              v-if="!priceItems?.length && !isAdding"
              variant="naked"
              size="sm"
              icon="i-hugeicons-dollar-circle"
              title="Aucun tarif configuré"
              description="Ajoutez un tarif pour définir les prix de vos séances."
              :actions="[
                {
                  icon: 'i-hugeicons-add-01',
                  label: 'Ajouter un tarif',
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
            :disabled="isSaving || priceItems.length === 0"
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
  </div>
</template>
