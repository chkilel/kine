import { defineEventHandler, readBody } from 'h3'
import z from 'zod'
import { getR2Client, getR2BucketName, getR2Endpoint } from '~~/server/utils/r2'

const schema = z.object({
  key: z.string(),
  contentType: z.string().default('application/octet-stream'),
  expiresIn: z.coerce.number().int().positive().max(3600).default(300)
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, schema.safeParse)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.issues.flat()
    })
  }

  const { key, contentType, expiresIn } = result.data

  const client = getR2Client(event)
  const bucket = getR2BucketName(event)
  const endpoint = getR2Endpoint(event)

  try {
    // Create a presigned URL using aws4fetch
    const url = new URL(`/${bucket}/${key}`, endpoint)
    
    // Create a request that will be signed
    const request = new Request(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      }
    })

    // Sign the request
    const signedRequest = await client.sign(request, {
      aws: { signQuery: true }
    })

    // The signed URL is in the signed request
    const signedUrl = signedRequest.url
    
    return { url: signedUrl }
  } catch (err: any) {
    console.log('Failed to generate signed URL in POST /api/r2/blob', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate signed URL',
      data: {
        message: err.message
      }
    })
  }
})
