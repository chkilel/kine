// Helper: Parse and normalize errors for frontend
export function parseError(
  error: unknown,
  fallbackMessage: string = 'Une erreur est survenue',
  logMessage: boolean = true
) {
  if (logMessage) console.log('⛔️ >>>', fallbackMessage, ': ', error)

  // Handle Nuxt HTTP errors (from $fetch or useFetch)
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const httpError = error as {
      statusCode: number
      statusMessage?: string
      message?: string
      data?: any
    }

    // Priorité: data.data.message > data.message > message > statusMessage > fallback
    const message =
      httpError.data?.data?.message ||
      httpError.data?.message ||
      httpError.message ||
      httpError.statusMessage ||
      fallbackMessage

    return {
      statusCode: httpError.statusCode,
      message,
      data: httpError.data?.data || httpError.data
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    return {
      statusCode: 400,
      message: 'Données invalides',
      data: (error as any).errors
    }
  }

  // Handle fetch errors
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      statusCode: 500,
      message: (error as { message: string }).message || fallbackMessage,
      data: null
    }
  }

  // Generic error with fallback
  return {
    statusCode: 500,
    message: fallbackMessage,
    data: null
  }
}
