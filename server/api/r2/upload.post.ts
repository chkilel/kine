import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { defineEventHandler } from 'h3'
import z from 'zod'
import { getR2Client, getR2BucketName } from '~~/server/utils/r2'

const schema = z.object({
  key: z.string(),
  contentType: z.string().default('application/octet-stream'),
  expiresIn: z.coerce.number().int().positive().max(3600).default(300)
})

export default defineEventHandler(async (event) => {
  try {
    const result = await readValidatedBody(event, schema.safeParse)

    if (!result.success) {
      throw createError({
        statusCode: 400,
        message: 'Corps de requête invalide',
        data: result.error.issues.flat()
      })
    }

    const { key, contentType, expiresIn } = result.data

    const client = getR2Client(event)
    const bucket = getR2BucketName(event)

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })

    const signedUrl = await getSignedUrl(client, command, { expiresIn })
    return { url: signedUrl }
  } catch (error: unknown) {
    handleApiError(error, "Échec de la génération de l'URL signée")
  }
})
