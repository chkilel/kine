import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { defineEventHandler } from 'h3'
import z from 'zod'
import { getR2Client, getR2BucketName } from '~~/server/utils/r2'

const schema = z.object({
  keys: z.union([z.array(z.string()).min(1), z.string()]).transform((val) => (Array.isArray(val) ? val : [val])),
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

  const { keys, expiresIn } = result.data

  const client = getR2Client(event)
  const bucket = getR2BucketName(event)

  const urls: Record<string, string | null> = {}
  const errors: Record<string, string> = {}

  try {
    await Promise.all(
      keys.map(async (k) => {
        const command = new GetObjectCommand({ Bucket: bucket, Key: k })
        try {
          const url = await getSignedUrl(client, command, { expiresIn })
          urls[k] = url
        } catch (err: any) {
          errors[k] = err?.message || String(err)
          urls[k] = null
        }
      })
    )

    return {
      urls,
      errors: Object.keys(errors).length ? errors : undefined
    }
  } catch (err: any) {
    console.log('Failed to generate signed URLs in GET /api/r2/signed-url', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate signed URLs',
      data: {
        message: err.message
      }
    })
  }
})
