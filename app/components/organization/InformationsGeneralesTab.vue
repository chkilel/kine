<script setup lang="ts">
  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const form = reactive({
    name: '',
    slug: '',
    type: '',
    description: '',
    contact: {
      email: '',
      website: '',
      phones: [] as PhoneEntry[]
    },
    address: {
      street: '',
      postalCode: '',
      city: '',
      sector: '',
      country: ''
    },
    legalRepresentative: {
      name: '',
      title: '',
      email: '',
      phone: '',
      idNumber: ''
    }
  })

  watchEffect(() => {
    if (organization.value) {
      console.log('🚀 >>> ', 'WATCH organization.value', ': ', organization.value)

      form.name = organization.value.name || ''
      form.slug = organization.value.slug || ''
      form.type = organization.value.type || ''
      form.description = organization.value.description || ''
      form.contact.email = organization.value.contact?.email || ''
      form.contact.website = organization.value.contact?.website || ''
      form.contact.phones = organization.value.contact?.phones || []
      console.log(
        '🚀 >>> ',
        'organization.value.contact',
        ': ',
        organization.value.contact,
        typeof organization.value.contact
      )

      Object.assign(
        form.address,
        organization.value.address || {
          street: '',
          postalCode: '',
          city: '',
          sector: '',
          country: ''
        }
      )
      Object.assign(
        form.legalRepresentative,
        organization.value.legalRepresentative || {
          name: '',
          title: '',
          email: '',
          phone: '',
          idNumber: ''
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
        name: form.name,
        slug: form.slug,
        type: form.type,
        description: form.description,
        contact: form.contact,
        address: form.address,
        legalRepresentative: form.legalRepresentative
      }

      const result = updateOrganizationSchema.safeParse(formData)

      console.log('🚀 >>> ', 'RESULT', ': ', result)

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
        description: 'Les informations générales ont été mises à jour',
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

  function addPhone() {
    form.contact.phones = [...form.contact.phones, { id: crypto.randomUUID(), category: 'clinic', number: '' }]
  }

  function removePhone(index: number) {
    form.contact.phones.splice(index, 1)
  }

  defineExpose({
    handleSave
  })
</script>

<template>
  <div v-if="isPending" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
  </div>
  <div v-else class="columns-1 gap-6 pt-6 md:columns-2">
    <AppCard variant="outline" title="Identité de l'établissement" class="mb-6 break-inside-avoid">
      <div class="flex flex-col gap-y-4">
        <UFormField label="Nom de l'établissement">
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Identifiant/Slug">
            <UInput v-model="form.slug" class="w-full" disabled />
          </UFormField>
          <UFormField label="Type d'établissement">
            <USelect v-model="form.type" :items="ORGANIZATION_TYPE_OPTIONS" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Description/Activités">
          <UTextarea
            v-model="form.description"
            placeholder="Brève description des activités de la clinique..."
            :rows="4"
            class="w-full"
          />
        </UFormField>
      </div>
    </AppCard>

    <AppCard variant="outline" title="Localisation" class="mb-6 break-inside-avoid">
      <div class="flex flex-col gap-y-4">
        <UFormField label="Adresse complète">
          <UTextarea v-model="form.address.street" :rows="3" class="w-full" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Code postal">
            <UInput v-model="form.address.postalCode" class="w-full" />
          </UFormField>
          <UFormField label="Ville">
            <UInput v-model="form.address.city" class="w-full" />
          </UFormField>
        </div>
        <div>
          <UFormField label="Quartier/Secteur">
            <UInput v-model="form.address.sector" placeholder="Ex: Centre-ville" class="w-full" />
          </UFormField>
        </div>
        <div
          class="bg-elevated border-border group relative mt-2 h-32 w-full cursor-pointer overflow-hidden rounded-xl border"
        >
          <div class="absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/10" />
          <div
            class="bg-default/90 text-highlighted border-border absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur"
          >
            <UIcon name="i-lucide-map" class="size-3.5" />
            <span>Voir sur la carte</span>
          </div>
        </div>
      </div>
    </AppCard>

    <AppCard variant="outline" title="Coordonnées" class="mb-4 break-inside-avoid">
      <div class="flex flex-col gap-y-4">
        <UFormField label="Email général">
          <UInput v-model="form.contact.email" type="email" icon="i-lucide-mail" class="w-full" />
        </UFormField>
        <UFormField label="Numéros de téléphone" :ui="{ container: 'grid gap-y-2' }">
          <div v-for="(phone, index) in form.contact.phones" :key="phone.id" class="flex items-center gap-2">
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
          </div>
          <UButton
            label="Ajouter un numéro"
            icon="i-lucide-plus"
            color="primary"
            variant="ghost"
            class="mt-1 w-fit"
            @click="addPhone"
          />
        </UFormField>
        <UFormField label="Site web">
          <UFieldGroup class="w-full">
            <UBadge color="neutral" variant="outline" size="lg" label="https://" />
            <UInput
              v-model="form.contact.website"
              placeholder="www.example.com"
              type="url"
              trailing-icon="i-lucide-globe"
              class="w-full"
            />
          </UFieldGroup>
        </UFormField>
      </div>
    </AppCard>
    <AppCard variant="outline" title="Responsable légal" class="mb-6 break-inside-avoid">
      <div class="flex flex-col gap-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Nom complet">
            <UInput v-model="form.legalRepresentative.name" class="w-full" />
          </UFormField>
          <UFormField label="Titre/Profession">
            <UInput v-model="form.legalRepresentative.title" class="w-full" />
          </UFormField>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Email professionnel">
            <UInput v-model="form.legalRepresentative.email" icon="i-lucide-mail" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Tél. professionnel">
            <UInput v-model="form.legalRepresentative.phone" icon="i-lucide-phone" type="tel" class="w-full" />
          </UFormField>
        </div>
        <div>
          <UFormField label="CNI / CNIE (Optionnel)">
            <UInput v-model="form.legalRepresentative.idNumber" icon="i-lucide-id-card" class="w-full" />
          </UFormField>
        </div>
      </div>
    </AppCard>
    <div
      class="bg-elevated/50 border-border mb-4 flex break-inside-avoid flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
    >
      <UIcon name="i-lucide-check-circle" class="text-muted size-16" />
      <div>
        <p class="text-highlighted text-sm font-bold">Toutes les informations sont à jour</p>
        <p class="text-muted mt-2 text-xs">
          Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
        </p>
      </div>
    </div>
  </div>
</template>
