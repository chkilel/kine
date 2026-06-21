<script setup lang="ts">
  const props = defineProps<{ treatmentPlan: TreatmentPlan }>()

  const { data: documents } = useDocumentsList(
    () => props.treatmentPlan.patientId,
    () => props.treatmentPlan.id
  )

  const hasDocuments = computed(() => !!documents.value?.length)
  const fileInputRef = ref<HTMLInputElement>()

  const { uploadedFiles, documentLoading, handleFileSelect, removeFile, openFileDialog, uploadDocuments } =
    useDocumentUpload({
      patientId: () => props.treatmentPlan.patientId,
      organizationId: () => props.treatmentPlan.organizationId,
      treatmentPlanId: () => props.treatmentPlan.id,
      fileInputRef
    })
</script>

<template>
  <UCard
    :ui="{
      root: 'divide-transparent',
      body: 'p-0 sm:p-0'
    }"
  >
    <UCollapsible :default-open="true">
      <UButton
        color="primary"
        variant="ghost"
        size="sm"
        class="group p-4 sm:px-6 sm:py-4"
        :ui="{
          base: 'hover:rounded-b-none items-end',
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
        }"
        trailing-icon="i-lucide-chevron-down"
        block
      >
        <h3 class="text-toned text-[13px] font-semibold tracking-wide uppercase">Documents du plan</h3>
      </UButton>

      <template #content>
        <div class="border-default space-y-5 border-t">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            :accept="ACCEPTED_FILE_TYPES.join(',')"
            @change="handleFileSelect"
          />

          <div class="space-y-4">
            <!-- Staged Files -->
            <div v-if="uploadedFiles.length > 0" class="bg-muted">
              <div
                v-for="(uploadedFile, index) in uploadedFiles"
                :key="index"
                class="border-default space-y-3 border-b p-3"
              >
                <div class="flex w-full items-start gap-10">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{{ uploadedFile.file.name }}</p>
                    <p class="text-muted mt-1 text-xs">
                      Taille: {{ (uploadedFile.file.size / 1024 / 1024).toFixed(2) }} MB
                    </p>
                  </div>
                  <UButton
                    icon="i-hugeicons-delete-02"
                    variant="ghost"
                    color="error"
                    size="sm"
                    square
                    @click="removeFile(index)"
                  />
                </div>

                <div class="grid gap-4">
                  <UFormField label="Titre descriptif du document" size="xs">
                    <UInput
                      v-model="uploadedFile.title"
                      variant="outline"
                      placeholder="Titre descriptif"
                      size="sm"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Type de document" size="xs">
                    <USelect
                      v-model="uploadedFile.category"
                      value-key="value"
                      variant="outline"
                      size="sm"
                      :items="DOCUMENT_CATEGORY_OPTIONS"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>

              <!-- Upload Button -->
              <div v-if="uploadedFiles.length > 0" class="flex justify-end p-3">
                <UButton
                  icon="i-hugeicons-upload-01"
                  color="primary"
                  size="sm"
                  :loading="documentLoading"
                  :disabled="documentLoading || uploadedFiles.length === 0"
                  @click="uploadDocuments"
                >
                  Téléverser {{ uploadedFiles.length }} document(s)
                </UButton>
              </div>
            </div>

            <!-- Existing Documents -->
            <div>
              <UEmpty
                v-if="!hasDocuments"
                icon="i-hugeicons-file-add"
                size="xs"
                variant="naked"
                title="Aucun document"
                description="Aucun document n’est associé à ce plan de traitement."
                :actions="[
                  {
                    label: 'Ajouter un document',
                    icon: 'i-hugeicons-plus-sign',
                    color: 'primary',
                    onClick: openFileDialog
                  }
                ]"
              />

              <DocumentCard
                v-for="doc in documents"
                :key="doc.id"
                :document="doc"
                :patient-id="treatmentPlan.patientId"
                variant="mini"
              />
            </div>
          </div>

          <div v-if="hasDocuments" class="flex w-full justify-end p-4 pt-0">
            <UButton
              label="Document"
              icon="i-hugeicons-plus-sign"
              color="primary"
              variant="soft"
              size="sm"
              @click="openFileDialog"
            />
          </div>
        </div>
      </template>
    </UCollapsible>
  </UCard>
</template>
