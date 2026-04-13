/**
 * Réponse de succès avec données et message optionnels
 */
export function successResponse<T>(
  data: T,
  message: string = 'Opération réussie'
): { success: true; message: string; data: T } {
  return {
    success: true,
    message,
    data
  }
}

/**
 * Réponse de liste avec métadonnées de pagination (si paginée)
 */

export function listResponse<T>(data: T[], pagination?: any): { data: T[]; pagination?: any } {
  return {
    data,
    ...(pagination && { pagination })
  }
}

/**
 * Réponse de suppression
 */
export interface DeletedResponse {
  success: true
  message: string
}
export function deletedResponse(message: string = 'Ressource supprimée avec succès'): {
  success: true
  message: string
} {
  return {
    success: true,
    message
  }
}
