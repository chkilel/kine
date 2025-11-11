import { createError } from 'h3'

export type UploadResult = {
  key: string
}

export function useUploads() {
  // ------------------ Helpers ------------------ //

  async function getPresignUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const { url } = await $fetch<{ url: string }>('/api/r2/signed-url', { params: { key, expiresIn } })
      return url
    } catch (err: any) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get presigned GET URL',
        data: { details: err?.message }
      })
    }
  }

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
        statusMessage: 'Failed to get presigned PUT URL',
        data: { details: err?.message }
      })
    }
  }

  // ------------------ Main Upload ------------------ //

  async function uploadFile(options: {
    file: File
    folder?: string
    name?: string
    expiresIn?: number
  }): Promise<UploadResult> {
    const { file, folder, name, expiresIn } = options
    const key = generateKey({ folder, name, file })

    try {
      // 1- Get presigned PUT URL
      const putUrl = await putPresignUrl(key, file.type, expiresIn)

      // 2- Upload file to S3/R2
      const res = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw createError({
          statusCode: res.status,
          statusMessage: 'Upload failed',
          data: { statusText: res.statusText, body: text }
        })
      }

      return { key }
    } catch (err: any) {
      // Rethrow to let the caller handle UI (toast, modal, etc)
      throw err
    }
  }

  return { getPresignUrl, putPresignUrl, uploadFile }
}

// ----------------- Utils ---------------- //
function generateKey(options: { folder?: string; name?: string; file: File }) {
  const { folder, name, file } = options
  const baseName = slugify(name ?? file.name)
  const prefix = folder ? folder.replace(/\/$/, '') + '/' : ''
  return `${prefix}${Date.now()}-${baseName}`
}
