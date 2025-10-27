import { AwsClient } from 'aws4fetch'
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

  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto'
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

export function getR2Endpoint(event: H3Event) {
  const config = useRuntimeConfig(event)
  const r2Url = config.r2Url
  if (!r2Url) {
    throw new Error('R2 URL is not configured. Please set R2_URL in .env')
  }
  return r2Url.replace(/\/$/, '') // Remove trailing slash if present
}