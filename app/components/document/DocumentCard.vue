<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'
  import { LazyDocumentViewerModal, LazyAppModalConfirm } from '#components'

  interface Props {
    document: PatientDocument
    patientId: string
    variant?: 'mini' | 'extended'
  }

  const { document: patientDocument, patientId, variant = 'extended' } = defineProps<Props>()

  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)
  const documentViewerModal = overlay.create(LazyDocumentViewerModal)

  const { mutate: updateDocument, isLoading: isUpdating } = useUpdateDocument()
  const { mutate: deleteDocument, isLoading: isDeleting } = useDeleteDocument()
  const { downloadDocument } = useDownloadDocument()

  // Get organization members for uploader name lookup
  const { getTherapistName } = useOrganizationMembers()

  // Computed uploader name
  const uploaderName = computed(() => {
    if (!patientDocument.uploadedById) return 'Inconnu'
    return getTherapistName(patientDocument.uploadedById)
  })

  const isEditing = ref(false)
  const editingDocument = ref<PatientDocument | null>(null)

  // Dropdown menu items for document actions
  const documentActions = computed<DropdownMenuItem[][]>(() => [
    [
      ...(isViewableByBrowser(patientDocument.mimeType)
        ? [
            {
              label: 'Voir',
              icon: 'i-hugeicons-view',
              onSelect: () => documentViewerModal.open({ document: patientDocument, patientId: patientId })
            }
          ]
        : []),
      {
        label: 'Télécharger',
        icon: 'i-hugeicons-download-01',
        onSelect: () => downloadDocument(patientDocument.storageKey, patientDocument.originalFileName)
      },
      {
        label: 'Modifier',
        icon: 'i-hugeicons-pencil-edit-01',
        disabled: isEditing.value,
        onSelect: startEdit
      }
    ],
    [
      {
        label: 'Supprimer',
        icon: 'i-hugeicons-delete-02',
        color: 'error',
        disabled: isDeleting.value,
        onSelect: confirmDelete
      }
    ]
  ])

  // Edit functions
  function startEdit() {
    editingDocument.value = { ...patientDocument }
    isEditing.value = true
  }

  function cancelEdit() {
    isEditing.value = false
    editingDocument.value = null
  }

  async function saveEdit() {
    if (!editingDocument.value) return

    updateDocument({
      patientId,
      documentId: editingDocument.value.id,
      data: {
        description: editingDocument.value.description || undefined,
        category: editingDocument.value.category
      },
      onSuccess: () => {
        cancelEdit()
      }
    })
  }

  // Delete functions
  async function confirmDelete() {
    const confirmed = await confirmModal.open({
      title: 'Supprimer le document',
      message: `Êtes-vous sûr de vouloir supprimer "${patientDocument.originalFileName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-delete-02'
    })

    if (confirmed) {
      deleteDocument({
        patientId,
        documentId: patientDocument.id
      })
    }
  }

  // Keyboard shortcuts
  onKeyStroke('Escape', () => {
    if (isEditing.value) {
      cancelEdit()
    }
  })
</script>

<template>
  <!-- Mini Variant (List Item) -->
  <div
    v-if="variant === 'mini'"
    class="border-default bg-muted gap-4 space-y-2 rounded-md border p-2.5"
    :class="{ 'ring-neutral ring-2 ring-offset-2': isEditing }"
  >
    <!-- Edit Mode -->
    <div v-if="isEditing && editingDocument" class="w-full space-y-3">
      <div class="flex items-center gap-3">
        <UBadge
          :icon="getDocumentIcon(editingDocument.category)"
          :color="getDocumentColor(editingDocument.category)"
          variant="soft"
          size="lg"
          square
        />
        <p class="text-default text-sm font-medium">
          {{ patientDocument.description || patientDocument.originalFileName }}
        </p>
      </div>
      <div class="grid gap-4">
        <UFormField label="Titre descriptif du patientDocument" size="xs">
          <UInput
            v-model="editingDocument.description"
            variant="outline"
            placeholder="Titre descriptif"
            size="sm"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Type de patientDocument" size="xs">
          <USelect
            v-model="editingDocument.category"
            value-key="value"
            variant="outline"
            size="sm"
            :items="DOCUMENT_CATEGORY_OPTIONS"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="flex justify-end gap-2">
        <UButton variant="outline" color="neutral" size="sm" @click="cancelEdit">Annuler</UButton>
        <UButton color="primary" size="sm" :loading="isUpdating" :disabled="isUpdating" @click="saveEdit">
          Enregistrer
        </UButton>
      </div>
    </div>

    <!-- View Mode -->
    <div v-else class="flex items-start gap-4">
      <UBadge
        :icon="getDocumentIcon(patientDocument.category)"
        :color="getDocumentColor(patientDocument.category)"
        variant="soft"
        size="lg"
        square
      />
      <div class="flex min-w-0 grow flex-col space-y-1">
        <span class="text-primary text-[10px] leading-none font-semibold uppercase">
          {{ getDocumentCategoryLabel(patientDocument.category) }}
        </span>

        <span class="text-default text-sm font-medium text-pretty">
          {{ patientDocument.description || patientDocument.originalFileName }}
        </span>

        <div class="mt-1 flex items-center justify-between text-xs">
          <time class="text-muted text-xs">
            {{ formatFrenchDate(patientDocument.createdAt) }}
          </time>
          <ClientOnly>
            <UDropdownMenu size="md" :items="documentActions" :content="{ align: 'end' }">
              <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" size="sm" square />
            </UDropdownMenu>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>

  <!-- Extended Variant (Card) -->
  <UCard v-else :ui="{ body: 'h-full' }" :class="{ 'ring-neutral ring-2 ring-offset-2': isEditing }">
    <!-- Edit Mode -->
    <div v-if="isEditing && editingDocument" class="flex h-full flex-col gap-3">
      <div class="flex items-start gap-3">
        <AppIconBox
          :name="getDocumentIcon(patientDocument.category)"
          :color="getDocumentColor(patientDocument.category)"
          size="xl"
        />
        <div>
          <h3 class="text-default text-sm font-bold">
            {{ patientDocument.description || patientDocument.originalFileName }}
          </h3>
          <p class="text-muted text-xs">{{ formatFrenchDate(patientDocument.createdAt) }}</p>
        </div>
      </div>

      <div class="mt-3 space-y-3">
        <UFormField label="Titre descriptif du patientDocument" size="xs">
          <UInput
            v-model="editingDocument.description"
            variant="outline"
            placeholder="Titre descriptif"
            size="sm"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Type de patientDocument" size="xs">
          <USelect
            v-model="editingDocument.category"
            value-key="value"
            variant="outline"
            size="sm"
            :items="DOCUMENT_CATEGORY_OPTIONS"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="mt-auto flex justify-end gap-2">
        <UButton variant="outline" color="neutral" size="sm" @click="cancelEdit">Annuler</UButton>
        <UButton color="primary" size="sm" :loading="isUpdating" :disabled="isUpdating" @click="saveEdit">
          Enregistrer
        </UButton>
      </div>
    </div>

    <!-- View Mode - Extended Info Grid -->
    <div v-else class="relative flex h-full flex-col gap-5">
      <div class="flex min-w-0 items-start gap-3">
        <AppIconBox
          :name="getDocumentIcon(patientDocument.category)"
          :color="getDocumentColor(patientDocument.category)"
          size="xl"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <!-- Category Badge -->
            <span class="text-primary text-[10px] leading-none font-semibold uppercase">
              {{ getDocumentCategoryLabel(patientDocument.category) }}
            </span>
          </div>
          <!-- Description -->
          <h3 class="text-default truncate text-sm font-bold text-pretty">
            {{ patientDocument.description || patientDocument.originalFileName }}
          </h3>
          <UBadge variant="subtle" color="neutral" size="sm">
            {{ getFileType(patientDocument.mimeType) }}
          </UBadge>
        </div>
      </div>
      <ClientOnly>
        <UDropdownMenu size="md" :items="documentActions" :content="{ align: 'end' }">
          <UButton
            icon="i-hugeicons-more-vertical"
            variant="ghost"
            color="neutral"
            size="md"
            square
            class="absolute -top-3 -right-3"
          />
        </UDropdownMenu>
      </ClientOnly>

      <!-- Metadata Grid -->
      <div class="text-muted mt-auto grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-xs">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-hugeicons-database" class="text-muted/70" />
          <span>{{ formatFileSize(patientDocument.fileSize) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-hugeicons-user" class="text-muted/70" />
          <span class="truncate">{{ uploaderName }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-hugeicons-calendar-03" class="text-muted/70" />
          <span>{{ formatFrenchDate(patientDocument.createdAt) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon name="i-hugeicons-clock-01" class="text-muted/70" />
          <span>
            {{
              new Date(patientDocument.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            }}
          </span>
        </div>
      </div>
    </div>
  </UCard>
</template>
