// =================================================================================================
// Shared Types
// =================================================================================================

// UI Related Types
export type UIColor = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'primary' | 'secondary'
export type UIVariant = 'solid' | 'outline' | 'soft' | 'subtle'

export type WithOnSuccess<T> = T & {
  onSuccess?: (data?: any) => void
  onError?: (error?: unknown) => void
}
