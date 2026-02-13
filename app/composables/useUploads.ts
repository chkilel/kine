import { createSharedComposable } from '@vueuse/core'

/**
 * Upload composable for handling file uploads to R2/S3
 * @returns Upload methods for file operations
 */
const _useUploads = () => {
  const toast = useToast()

  /**
   * Get presigned URL for downloading a file
   * @param key - The file key to get the URL for
   * @param expiresIn - Optional expiration time in seconds
   * @returns Presigned download URL
   */
  async function getPresignUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const { urls, errors } = await $fetch<{ urls: Record<string, string | null>; errors?: Record<string, string> }>(
        '/api/r2/signed-url',
        { params: { keys: key, expiresIn } }
      )

      if (errors && errors[key]) {
        throw createError({
          statusCode: 500,
          statusMessage: "Échec de la récupération de l'URL de téléchargement",
          data: { details: errors[key] }
        })
      }

      const url = urls[key]
      if (!url) {
        throw createError({
          statusCode: 500,
          statusMessage: "Échec de la récupération de l'URL de téléchargement",
          data: { details: 'Aucune URL retournée pour cette clé' }
        })
      }

      return url
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: parseError(err, "Échec de la récupération de l'URL de téléchargement").message,
        data: { details: parseError(err).message }
      })
    }
  }

  /**
   * Get presigned URL for uploading a file
   * @param key - The file key to upload
   * @param contentType - Optional MIME type of the file
   * @param expiresIn - Optional expiration time in seconds
   * @returns Presigned upload URL
   */
  async function putPresignUrl(key: string, contentType?: string, expiresIn?: number): Promise<string> {
    try {
      const { url } = await $fetch<{ url: string }>('/api/r2/upload', {
        method: 'POST',
        body: { key, contentType, expiresIn }
      })
      return url
    } catch (err: any) {
      throw createError({
        statusCode: 500,
        statusMessage: parseError(err, "Échec de la récupération de l'URL de téléversement").message,
        data: { details: parseError(err).message }
      })
    }
  }

  /**
   * Upload a file to R2/S3
   * @param options - Upload options including file, folder, name, and expiration
   * @returns Upload result with file key
   */
  async function uploadFile(options: {
    file: File
    folder?: string
    name?: string
    expiresIn?: number
  }): Promise<{ key: string }> {
    const { file, folder, name, expiresIn } = options
    const key = generateKey({ folder, name, file })

    try {
      const putUrl = await putPresignUrl(key, file.type, expiresIn)

      const res = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw createError({
          statusCode: res.status,
          statusMessage: 'Échec du téléversement',
          data: { statusText: res.statusText, body: text }
        })
      }

      return { key }
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de téléverser le fichier').message,
        color: 'error'
      })
      throw error
    }
  }

  return { getPresignUrl, putPresignUrl, uploadFile }
}

/**
 * Generate a unique key for file upload
 * @param options - Options including folder, name, and file
 * @returns Generated file key
 */
function generateKey(options: { folder?: string; name?: string; file: File }) {
  const { folder, name, file } = options
  const baseName = slugify(name ?? file.name)
  const prefix = folder ? `${folder.replace(/\/$/, '')}/` : ''
  return `${prefix}${Date.now()}-${baseName}`
}

export const useUploads = createSharedComposable(_useUploads)
