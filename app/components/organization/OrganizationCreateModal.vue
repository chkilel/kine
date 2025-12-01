<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types'
  import type { FormError } from '@nuxt/ui'

  const { title = 'Créer une organisation' } = defineProps<{ title?: string }>()
  const emit = defineEmits<{ close: [value?: any] }>()

  const toast = useToast()
  const { uploadFile } = useUploads()
  const { createOrganization, checkSlug } = useOrganization()

  // ✅ Unified reactive form state
  const form = reactive({
    name: '',
    slug: '',
    logo: '',
    logoFile: undefined as File | undefined,
    metadata: {} as Record<string, any>,
    metadataText: ''
  })

  const isCreating = ref(false)
  // Cache for slug availability to avoid redundant checks
  const lastCheckedSlug = ref<string>('')
  const lastAvailability = ref<boolean | null>(null)

  // ✅ Form-level validation
  const validate = async (state: any): Promise<FormError[]> => {
    const errors: FormError[] = []

    // Slug availability
    const slug = state?.slug?.trim?.() ?? state?.slug
    if (slug) {
      let available: boolean | null

      if (slug !== lastCheckedSlug.value) {
        available = await checkSlugAvailability(slug)
        lastCheckedSlug.value = slug
        lastAvailability.value = available
      } else {
        available = lastAvailability.value
      }

      if (!available) {
        errors.push({ name: 'slug', message: 'Ce slug est déjà pris' })
      }
    }

    return errors
  }

  // ✅ Auto-generate slug from name
  watch(
    () => form.name,
    (newName, oldName) => {
      if (newName != oldName) {
        form.slug = slugify(newName)
      }
    }
  )

  // Mettre à jour l’objet metadata lorsqu’on édite le texte JSON
  watch(
    () => form.metadataText,
    (val) => {
      try {
        form.metadata = val ? JSON.parse(val) : {}
      } catch {
        // ignore parse errors; schema handles validation
      }
    }
  )

  // ✅ Create organization via UForm submit
  async function onSubmit(event: FormSubmitEvent<OrganizationInsertSchema>) {
    isCreating.value = true

    try {
      // Upload logo if provided
      if (event.data.logoFile) {
        const result = await uploadFile({
          file: event.data.logoFile,
          folder: 'org-logos',
          name: `${event.data.slug}-logo`
        })
        event.data.logo = result.key
      }

      const metadataObj =
        event.data.metadataText && event.data.metadataText.trim() ? JSON.parse(event.data.metadataText) : undefined

      const { error } = await createOrganization({
        name: event.data.name,
        slug: event.data.slug,
        logo: event.data.logo || undefined,
        metadata: metadataObj || undefined,
        keepCurrentActiveOrganization: false
      })

      if (error) {
        toast.add({
          title: 'Erreur',
          description: error.message || "Échec de la création de l'organisation",
          color: 'error'
        })
      } else {
        emit('close')
        toast.add({
          title: 'Succès',
          description: 'Organisation créée avec succès',
          color: 'success'
        })
      }
    } catch {
      toast.add({
        title: 'Erreur',
        description: "Une erreur inattendue s'est produite",
        color: 'error'
      })
    } finally {
      isCreating.value = false
    }
  }

  // ✅ Check slug availability (used in form validation)
  async function checkSlugAvailability(slug: string): Promise<boolean | null> {
    if (!slug) return null
    try {
      const { data, error } = await checkSlug({ slug })
      if (error) {
        return null
      }
      return !!data?.status
    } catch {
      return null
    }
  }

  function handleCancel() {
    emit('close')
  }
</script>

<template>
  <UModal :title="title">
    <template #body>
      <UForm
        id="create-org-form"
        :schema="organizationInsertSchema"
        :state="form"
        :validate="validate"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <UFormField name="name" label="Nom" description="Le nom de votre organisation">
            <UInput v-model="form.name" placeholder="Acme Corporation" :disabled="isCreating" required class="w-full" />
          </UFormField>

          <UFormField name="slug" label="Slug" description="Identifiant unique de votre organisation">
            <UInput v-model="form.slug" placeholder="acme-corporation" :disabled="isCreating" required class="w-full" />
          </UFormField>

          <UFormField name="logoFile" label="Logo" description="Image du logo (optionnel)">
            <UFileUpload
              v-model="form.logoFile"
              accept="image/*"
              :disabled="isCreating"
              variant="button"
              label="Choisir le logo"
              class="aspect-square h-32"
            />
          </UFormField>

          <UFormField name="metadataText" label="Métadonnées" description="Format JSON (optionnel)">
            <UTextarea
              v-model="form.metadataText"
              placeholder='{"industrie": "technologie", "taille": "startup"}'
              :disabled="isCreating"
            />
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Annuler" color="neutral" variant="outline" :disabled="isCreating" @click="handleCancel" />
        <UButton
          label="Créer une organisation"
          :loading="isCreating"
          :disabled="isCreating"
          type="submit"
          form="create-org-form"
        />
      </div>
    </template>
  </UModal>
</template>
