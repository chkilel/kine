<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const toast = useToast()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    name: org?.name ?? '',
    slug: org?.slug ?? '',
    type: org?.type ?? 'clinic',
    description: org?.description,
    contact: {
      email: org?.contact?.email ?? '',
      website: org?.contact?.website ?? '',
      phones: org?.contact?.phones ?? []
    },
    address: {
      street: org?.address?.street ?? '',
      postalCode: org?.address?.postalCode ?? '',
      city: org?.address?.city ?? '',
      sector: org?.address?.sector ?? '',
      country: org?.address?.country ?? ''
    },
    legalRepresentative: {
      name: org?.legalRepresentative?.name ?? '',
      title: org?.legalRepresentative?.title ?? '',
      email: org?.legalRepresentative?.email ?? '',
      phone: org?.legalRepresentative?.phone ?? '',
      idNumber: org?.legalRepresentative?.idNumber ?? ''
    }
  })

  const state = reactive<OrgGenerales>(defaultForm())

  watch(
    organization,
    (org) => {
      if (!org) return

      Object.assign(state, defaultForm(org))
    },
    { immediate: true }
  )

  const updateOrganization = useUpdateOrganization()
  const isSaving = computed(() => updateOrganization.isLoading.value)
  const form = useTemplateRef('form')

  function onSubmit(event: FormSubmitEvent<OrgGenerales>) {
    const organizationId = route.params.id as string

    updateOrganization.mutate({ organizationId, organizationData: event.data })
  }

  function handleCancel() {
    if (organization.value) {
      Object.assign(state, defaultForm(organization.value))
      toast.add({
        title: 'Annulation',
        description: 'Modifications annulées',
        color: 'neutral'
      })
    }
  }

  function addPhone() {
    state.contact!.phones = [...state.contact!.phones, { id: crypto.randomUUID(), category: 'clinic', number: '' }]
  }

  function removePhone(index: number) {
    state.contact!.phones = state.contact!.phones.filter((_, i) => i !== index)
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
      :schema="orgGeneralesSchema"
      class="columns-1 gap-6 pt-6 md:columns-2"
      @submit="onSubmit"
    >
      <!-- Identité -->
      <AppCard variant="outline" title="Identité de l'établissement" class="mb-6 break-inside-avoid">
        <div class="flex flex-col gap-y-4">
          <UFormField label="Nom de l'établissement" name="name">
            <UInput v-model="state.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Identifiant/Slug" name="slug">
              <UInput v-model="state.slug" class="w-full" disabled />
            </UFormField>
            <UFormField label="Type d'établissement" name="type">
              <USelect v-model="state.type" :items="ORGANIZATION_TYPE_OPTIONS" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Description/Activités" name="description">
            <UTextarea
              v-model="state.description"
              placeholder="Brève description des activités de la clinique..."
              :rows="4"
              class="w-full"
            />
          </UFormField>
        </div>
      </AppCard>

      <!-- Responsable légal -->
      <AppCard variant="outline" title="Responsable légal" class="mb-6 break-inside-avoid">
        <div class="flex flex-col gap-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Nom complet" name="legalRepresentative.name">
              <UInput v-model="state.legalRepresentative.name" class="w-full" />
            </UFormField>
            <UFormField label="Titre/Profession" name="legalRepresentative.title">
              <UInput v-model="state.legalRepresentative.title" class="w-full" />
            </UFormField>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Email professionnel" name="legalRepresentative.email">
              <UInput v-model="state.legalRepresentative.email" icon="i-lucide-mail" type="email" class="w-full" />
            </UFormField>
            <UFormField label="Tél. professionnel" name="legalRepresentative.phone">
              <UInput v-model="state.legalRepresentative.phone" icon="i-lucide-phone" type="tel" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="CNI / CNIE (Optionnel)" name="legalRepresentative.idNumber">
            <UInput v-model="state.legalRepresentative.idNumber" icon="i-lucide-id-card" class="w-full" />
          </UFormField>
        </div>
      </AppCard>

      <!-- Status card -->
      <div
        class="bg-elevated/50 border-border mb-4 flex break-inside-avoid flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon
          :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-check-circle'"
          :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
        />
        <div>
          <p class="text-highlighted text-sm font-bold">
            {{ isSaving ? 'Enregistrement en cours…' : 'Toutes les informations sont à jour' }}
          </p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>

      <!-- Localisation & Coordonnées -->
      <AppCard variant="outline" title="Coordonnées" class="mb-4 break-inside-avoid">
        <div class="flex flex-col gap-y-4">
          <UFormField label="Email général" name="contact.email">
            <UInput v-model="state.contact.email" type="email" icon="i-lucide-mail" class="w-full" />
          </UFormField>

          <UFormField label="Numéros de téléphone" :ui="{ container: 'grid gap-y-2' }">
            <TransitionGroup name="phone-list" tag="div" class="grid gap-y-2">
              <div v-for="(phone, index) in state.contact.phones" :key="phone.id" class="flex items-center gap-2">
                <UFormField :name="`contact.phones.${index}.number`" class="w-full">
                  <UFieldGroup class="w-full">
                    <USelect v-model="phone.category" :items="PHONE_CATEGORIES_OPTIONS" class="w-28" />
                    <UInput v-model="phone.number" class="flex-1" />
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="subtle"
                      size="sm"
                      square
                      @click="removePhone(index)"
                    />
                  </UFieldGroup>
                </UFormField>
              </div>
            </TransitionGroup>
            <UButton
              label="Ajouter un numéro"
              icon="i-lucide-plus"
              color="primary"
              variant="ghost"
              class="mt-1 w-fit"
              @click="addPhone"
            />
          </UFormField>

          <UFormField label="Site web" name="contact.website">
            <UFieldGroup class="w-full">
              <UBadge color="neutral" variant="outline" size="lg" label="https://" />
              <UInput
                v-model="state.contact.website"
                placeholder="www.example.com"
                trailing-icon="i-lucide-globe"
                class="w-full"
              />
            </UFieldGroup>
          </UFormField>

          <UFormField label="Adresse complète" name="address.street">
            <UTextarea v-model="state.address.street" :rows="3" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Code postal" name="address.postalCode">
              <UInput v-model="state.address.postalCode" class="w-full" />
            </UFormField>
            <UFormField label="Ville" name="address.city">
              <UInput v-model="state.address.city" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Quartier/Secteur" name="address.sector">
            <UInput v-model="state.address.sector" placeholder="Ex: Centre-ville" class="w-full" />
          </UFormField>
        </div>
      </AppCard>
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

<style scoped>
  .phone-list-enter-active,
  .phone-list-leave-active {
    transition: all 0.2s ease;
  }
  .phone-list-enter-from,
  .phone-list-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
