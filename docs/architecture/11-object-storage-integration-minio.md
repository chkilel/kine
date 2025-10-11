# 11) Object Storage Integration (MinIO)
- Dev environment: MinIO via docker-compose exposed on 9000/9001.
- Use S3-compatible SDK; store only non-PHI or ensure encrypted storage and signed URL access when PHI involved.
- Bucket: kine-attachments; lifecycle policies in staging/prod to be defined.