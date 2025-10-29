import { PutObjectCommand } from '@aws-sdk/client-s3'
import { defineEventHandler, readMultipartFormData } from 'h3'
import { getR2Client, getR2BucketName } from '~~/server/utils/r2'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const file = formData.find((item) => item.name === 'file')

    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file found in upload'
      })
    }

    // Generate unique filename
    const fileExtension = file.filename?.split('.').pop() || ''
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const storageKey = `documents/${uniqueFileName}`

    // Upload to R2
    const client = getR2Client(event)
    const bucket = getR2BucketName(event)

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: file.data,
      ContentType: file.type || 'application/octet-stream'
    })

    await client.send(command)

    return {
      fileName: uniqueFileName,
      originalName: file.filename || 'unknown',
      storageKey: storageKey,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.data.length
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload file'
    })
  }
})
