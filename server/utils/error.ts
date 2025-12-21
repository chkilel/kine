// Helper: Centralized error handling for API routes
export function handleApiError(
  error: unknown,
  fallbackMessage: string = 'Erreur interne du serveur',
  logMessage: boolean = true
) {
  if (logMessage) console.log('⛔️ >>>', fallbackMessage, ': ', error)

  // Re-throw HTTP errors (from createError) with fallback
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const httpError = error as { statusCode: number; statusMessage?: string; data?: any }
    throw createError({
      statusCode: httpError.statusCode,
      statusMessage: httpError.statusMessage || fallbackMessage,
      data: httpError.data
    })
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données invalides',
      data: (error as any).errors
    })
  }

  // Handle database errors
  if (error && typeof error === 'object' && 'code' in error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur de base de données',
      data: { code: (error as any).code }
    })
  }

  // Generic error with fallback
  throw createError({
    statusCode: 500,
    statusMessage: fallbackMessage
  })
}
