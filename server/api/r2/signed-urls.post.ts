import { defineEventHandler, getQuery } from 'h3'
import z from 'zod'
import { getR2Client, getR2BucketName, getR2Endpoint } from '~~/server/utils/r2'

const schema = z.object({
  keys: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      // Convert single string to array
      return Array.isArray(val) ? val : [val]
    })
    .refine((arr) => arr.length > 0, {
      message: 'At least one key is required'
    }),
  expiresIn: z.coerce.number().int().positive().max(3600).default(300)
})

export default defineEventHandler(async (event) => {
  const result = await getValidatedQuery(event, schema.safeParse)

  console.log('keys result', result)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
      data: result.error.issues.flat()
    })
  }

  // TODO: expiresIn is not used yet
  const { keys, expiresIn } = result.data

  const client = getR2Client(event)
  const bucket = getR2BucketName(event)
  const endpoint = getR2Endpoint(event)

  const urls: Record<string, string | null> = {}
  const errors: Record<string, string> = {}

  try {
    await Promise.all(
      keys.map(async (k) => {
        try {
          // Create a presigned URL using aws4fetch
          const url = new URL(`/${bucket}/${k}`, endpoint)

          // Create a request that will be signed
          const request = new Request(url.toString(), {
            method: 'GET'
          })

          // Sign the request
          const signedRequest = await client.sign(request, {
            aws: { signQuery: true }
          })

          // The signed URL is in the signed request
          urls[k] = signedRequest.url
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
    console.log('Failed to generate signed URLs in POST /api/r2/signed-urls', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate signed URLs',
      data: {
        message: err.message
      }
    })
  }
})
