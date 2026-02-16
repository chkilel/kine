import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { H3Event } from 'h3'

export function getR2Client(event: H3Event) {
  const { r2AccountId, r2AccessKey, r2SecretAccessKey, r2Url } = useRuntimeConfig(event)

  if (!r2AccountId || !r2AccessKey || !r2SecretAccessKey || !r2Url) {
    throw new Error(
      'R2 credentials are not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_ACCESS_KEY, R2_URL in .env'
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: r2Url,
    credentials: {
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretAccessKey
    }
  })
}

export function getR2BucketName(event: H3Event) {
  const { r2BucketName } = useRuntimeConfig(event)
  if (!r2BucketName) {
    throw new Error('R2 bucket name is not configured. Please set R2_BUCKET_NAME in .env')
  }
  return r2BucketName
}

export async function deleteR2File(event: H3Event, storageKey: string) {
  const client = getR2Client(event)
  const bucket = getR2BucketName(event)

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: storageKey
  })

  try {
    await client.send(command)
  } catch (error) {
    console.error('Error deleting R2 file:', error)
    throw error
  }
}
