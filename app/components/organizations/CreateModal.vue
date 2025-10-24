<script setup lang="ts">
  const { title = 'Créer une organisation' } = defineProps<{ title?: string }>()
  const emit = defineEmits<{ close: [value?: any] }>()

  const toast = useToast()
  const { uploadFile } = useUploads()

  // ✅ Unified reactive form state
  const form = reactive({
    name: '',
    slug: '',
    logo: '',
    logoFile: null as File | null,
    metadata: {} as Record<string, any>
  })

  const isCreating = ref(false)

  // ✅ Auto-generate slug from name
  watch(
    () => form.name,
    (newName, oldName) => {
      if (newName != oldName) {
        form.slug = slugify(newName)
      }
    }
  )

  // ✅ Create organization
  async function createOrganization() {
    isCreating.value = true

    try {
      // Upload logo if provided
      if (form.logoFile) {
        const result = await uploadFile({
          file: form.logoFile,
          folder: 'org-logos',
          name: `${form.slug}-logo`
        })
        form.logo = result.key
      }

      const { error } = await authClient.organization.create({
        name: form.name,
        slug: form.slug,
        logo: form.logo || undefined,
        metadata: form.metadata || undefined,
        keepCurrentActiveOrganization: false
      })

      if (error) {
        toast.add({
          title: 'Erreur',
          description: error.message || "Échec de la création de l'organisation",
          color: 'error'
        })
      } else {
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

  // ✅ Check if slug is available
  async function checkSlugAvailability() {
    if (!form.slug) return

    try {
      const { data, error } = await authClient.organization.checkSlug({
        slug: form.slug
      })

      if (error) {
        toast.add({
          title: 'Erreur',
          description: error.message || 'Échec de la vérification du slug',
          color: 'error'
        })
      } else if (data?.status === false) {
        toast.add({
          title: 'Slug déjà utilisé',
          description: 'Ce slug est déjà pris, choisissez-en un autre.',
          color: 'warning'
        })
      }
    } catch {
      // Ignore network errors here
    }
  }

  // Debounce slug check
  const debouncedSlugCheck = useDebounceFn(checkSlugAvailability, 500)
  watch(() => form.slug, debouncedSlugCheck)

  function handleCancel() {
    emit('close')
  }
</script>

<template>
  <UModal :model-value="true" :title="title" @update:model-value="!$event && handleCancel()">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Nom" description="Le nom de votre organisation">
          <UInput v-model="form.name" placeholder="Acme Corporation" :disabled="isCreating" required class="w-full" />
        </UFormField>

        <UFormField label="Slug" description="Identifiant unique de votre organisation">
          <UInput v-model="form.slug" placeholder="acme-corporation" :disabled="isCreating" required class="w-full" />
        </UFormField>

        <UFormField label="Logo" description="Image du logo (optionnel)">
          <UFileUpload
            v-model="form.logoFile"
            accept="image/*"
            :disabled="isCreating"
            variant="button"
            label="Choisir le logo"
            class="aspect-square h-32"
          />
        </UFormField>

        <UFormField label="Métadonnées" description="Format JSON (optionnel)">
          <UTextarea
            :model-value="JSON.stringify(form.metadata, null, 2)"
            placeholder='{"industrie": "technologie", "taille": "startup"}'
            :disabled="isCreating"
            @update:model-value="
              (val: string) => {
                try {
                  form.metadata = JSON.parse(val || '{}')
                } catch {}
              }
            "
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Annuler" color="neutral" variant="outline" :disabled="isCreating" @click="handleCancel" />
        <UButton
          label="Créer une organisation"
          :loading="isCreating"
          :disabled="!form.name || !form.slug || isCreating"
          @click="createOrganization"
        />
      </div>
    </template>
  </UModal>
</template>
