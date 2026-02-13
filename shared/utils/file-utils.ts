export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'text/plain': 'Texte',
    'text/html': 'HTML',
    'image/svg+xml': 'SVG',
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    'audio/mpeg': 'MPEG',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX'
  }
  return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Fichier'
}

export function isViewableByBrowser(mimeType: string): boolean {
  const viewableTypes = [
    'application/pdf',
    'text/plain',
    'text/html',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ]
  return viewableTypes.includes(mimeType)
}
