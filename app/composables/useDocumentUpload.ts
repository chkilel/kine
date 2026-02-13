interface UploadedFile {
  file: File
  title: string
  category: DocumentCategory
  description: string
}

interface UseDocumentUploadOptions {
  patientId: MaybeRefOrGetter<string>
  organizationId: MaybeRefOrGetter<string>
  treatmentPlanId: MaybeRefOrGetter<string>
  fileInputRef: Ref<HTMLInputElement | undefined>
  onSuccess?: () => void
  maxFileSize?: number
  allowedFileTypes?: string[]
}

interface UseDocumentUploadReturn {
  uploadedFiles: Ref<UploadedFile[]>
  documentLoading: Ref<boolean>
  handleFileSelect: (event: Event) => void
  handleDrop: (event: DragEvent) => void
  addFiles: (files: File[]) => void
  removeFile: (index: number) => void
  openFileDialog: () => void
  uploadDocuments: () => Promise<void>
}

export function useDocumentUpload(options: UseDocumentUploadOptions): UseDocumentUploadReturn {
  const {
    patientId,
    organizationId,
    treatmentPlanId,
    fileInputRef,
    onSuccess,
    maxFileSize = MAX_FILE_SIZE,
    allowedFileTypes = ACCEPTED_FILE_TYPES
  } = options

  const toast = useToast()
  const queryCache = useQueryCache()
  const { uploadFile } = useUploads()

  const uploadedFiles = ref<UploadedFile[]>([])
  const documentLoading = ref(false)
  const dragOver = ref(false)

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        message: `Le fichier ${file.name} dépasse la limite de taille (${(maxFileSize / 1024 / 1024).toFixed(0)}MB)`
      }
    }

    if (!file.name.match(new RegExp(`(${allowedFileTypes.join('|')})$`, 'i'))) {
      return {
        valid: false,
        message: `Le fichier ${file.name} n'est pas dans un format accepté. Formats acceptés: ${allowedFileTypes.join(', ')}`
      }
    }

    return { valid: true }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    addFiles(files)
  }

  function handleDrop(event: DragEvent) {
    dragOver.value = false
    if (event.dataTransfer?.files) {
      addFiles(Array.from(event.dataTransfer.files))
    }
  }

  function addFiles(files: File[]) {
    const invalidFiles = files.filter((file) => !validateFile(file).valid)

    if (invalidFiles.length > 0) {
      const messages = invalidFiles.map((file) => validateFile(file).message).join('\n')
      toast.add({
        title: 'Fichiers non valides',
        description: messages,
        color: 'error'
      })
    }

    const validFiles = files.filter((file) => validateFile(file).valid)

    const newFiles = validFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      category: 'other' as DocumentCategory,
      description: ''
    }))

    uploadedFiles.value.push(...newFiles)
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function openFileDialog() {
    fileInputRef.value?.click()
  }

  async function uploadDocuments() {
    const planId = toValue(treatmentPlanId)

    if (!planId) {
      toast.add({
        title: 'Plan de traitement requis',
        description: 'Veuillez sélectionner un plan de traitement pour ajouter des documents.',
        color: 'error'
      })
      return
    }

    if (uploadedFiles.value.length === 0) return

    const pid = toValue(patientId)
    const oid = toValue(organizationId)

    if (!pid || !oid) {
      toast.add({
        title: 'Erreur',
        description: 'Informations patient manquantes',
        color: 'error'
      })
      return
    }

    documentLoading.value = true
    const uploadedDocuments = []

    try {
      for (const uploadedFile of uploadedFiles.value) {
        try {
          const uploadResult = await uploadFile({
            file: uploadedFile.file,
            folder: `orgs/${oid}/docs/${pid}`,
            name: uploadedFile.file.name
          })

          const documentData = {
            organizationId: oid,
            treatmentPlanId: planId,
            fileName: uploadedFile.file.name,
            originalFileName: uploadedFile.file.name,
            mimeType: uploadedFile.file.type,
            fileSize: uploadedFile.file.size,
            storageKey: uploadResult.key,
            category: uploadedFile.category,
            description: uploadedFile.title
          }

          const document = await $fetch(`/api/patients/${pid}/documents`, {
            method: 'POST',
            body: documentData
          })

          if (document) {
            uploadedDocuments.push(document)
          }
        } catch (error) {
          console.error('Error uploading file:', uploadedFile.file.name, error)
          toast.add({
            title: 'Erreur',
            description: `Échec du téléversement de ${uploadedFile.file.name}`,
            color: 'error'
          })
        }
      }

      if (uploadedDocuments.length > 0) {
        uploadedFiles.value = []
        queryCache.invalidateQueries({ key: ['documents', pid] })
        onSuccess?.()

        toast.add({
          title: 'Succès',
          description: `${uploadedDocuments.length} document(s) téléversé(s) avec succès`,
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Error uploading documents:', error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec du téléversement des documents').message,
        color: 'error'
      })
    } finally {
      documentLoading.value = false
    }
  }

  return {
    uploadedFiles,
    documentLoading,
    handleFileSelect,
    handleDrop,
    addFiles,
    removeFile,
    openFileDialog,
    uploadDocuments
  }
}
