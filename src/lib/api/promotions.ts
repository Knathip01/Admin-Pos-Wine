import { apiRequest } from './client'
import type {
  WebPromotionCreate,
  WebPromotionUpdate,
  PromotionItem,
  WebPromotionListResponse,
  WebPromotionMutationResponse,
} from './types'

// Helper to ensure StrictBool fields for FastAPI backend
function sanitizePromotionPayload<T extends Record<string, any>>(payload: T): T {
  const clean: any = { ...payload }
  if ('isFeatured' in clean) clean.isFeatured = Boolean(clean.isFeatured)
  if ('is_featured' in clean) clean.is_featured = Boolean(clean.is_featured)
  if ('isActive' in clean) clean.isActive = Boolean(clean.isActive)
  if ('is_active' in clean) clean.is_active = Boolean(clean.is_active)
  return clean as T
}

export const promotionsApi = {
  // Public list — GET /api/promotions (prefix: /api, RAW response)
  list: (featured?: boolean, token?: string) => {
    const q = featured != null ? `?featured=${featured}` : ''
    return apiRequest<WebPromotionListResponse>(`/api/promotions${q}`, { token })
  },

  // Admin create — POST /api/admin/promotions
  create: (data: WebPromotionCreate, token?: string) =>
    apiRequest<WebPromotionMutationResponse>('/api/admin/promotions', {
      method: 'POST',
      body: sanitizePromotionPayload(data),
      token,
    }),

  // Admin update — PUT /api/admin/promotions
  update: (data: WebPromotionUpdate, token?: string) =>
    apiRequest<WebPromotionMutationResponse>('/api/admin/promotions', {
      method: 'PUT',
      body: sanitizePromotionPayload(data),
      token,
    }),

  // Admin delete — DELETE /api/admin/promotions?id={id}
  delete: (id: string, token?: string) =>
    apiRequest<{ success: boolean; message?: string }>(
      `/api/admin/promotions?id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        token,
      }
    ),

  // Admin bulk update — PUT /api/admin/promotions/bulk
  bulk: (promotions: PromotionItem[], token?: string) =>
    apiRequest<{ success: boolean; count?: number; message?: string }>(
      '/api/admin/promotions/bulk',
      {
        method: 'PUT',
        body: promotions.map(sanitizePromotionPayload),
        token,
      }
    ),
}
