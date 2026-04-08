/**
 * Réponse de succès avec données et message optionnels
 */
export interface SuccessResponse<T> {
  success: true
  message: string
  data: T
}
export function successResponse<T>(data: T, message: string = 'Opération réussie'): SuccessResponse<T> {
  return {
    success: true,
    message,
    data
  }
}

/**
 * Réponse de liste avec métadonnées de pagination (si paginée)
 */

export interface ListResponse<T> {
  data: T[]
  pagination?: any
}
export function listResponse<T>(data: T[], pagination?: any): ListResponse<T> {
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
export function deletedResponse(message: string = 'Ressource supprimée avec succès'): DeletedResponse {
  return {
    success: true,
    message
  }
}
