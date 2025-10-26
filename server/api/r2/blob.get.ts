import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { defineEventHandler, getQuery } from 'h3'
import z from 'zod'
import { getR2Client, getR2BucketName } from '~~/server/utils/r2'

const schema = z.object({
  key: z.string(),
  expiresIn: z.coerce.number().int().positive().max(3600).default(300)
})

export default defineEventHandler(async (event) => {
  const result = await getValidatedQuery(event, schema.safeParse)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
      data: result.error.issues.flat()
    })
  }

  const { key, expiresIn } = result.data

  const client = getR2Client(event)
  const bucket = getR2BucketName(event)

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })

    const signedUrl = await getSignedUrl(client, command, { expiresIn })

    return { url: signedUrl }
  } catch (err: any) {
    console.log('Failed to generate signed URL in GET /api/r2/blob', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate signed URL',
      data: {
        message: err.message
      }
    })
  }
})
