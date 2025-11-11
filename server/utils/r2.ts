import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { H3Event } from 'h3'

export function getR2Client(event: H3Event) {
  const config = useRuntimeConfig(event)
  const accountId = config.r2AccountId
  const accessKeyId = config.r2AccessKey
  const secretAccessKey = config.r2SecretAccessKey
  const r2Url = config.r2Url

  if (!accountId || !accessKeyId || !secretAccessKey || !r2Url) {
    throw new Error(
      'R2 credentials are not configured. Please set R2_ACCOUNT_ID, R2_ACCESSKEY, R2_SECRETACCESSKEY, R2_URL in .env'
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: r2Url,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  })
}

export function getR2BucketName(event: H3Event) {
  const config = useRuntimeConfig(event)
  const bucket = config.r2BucketName
  if (!bucket) {
    throw new Error('R2 bucket name is not configured. Please set R2_BUCKET_NAME in .env')
  }
  return bucket
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
