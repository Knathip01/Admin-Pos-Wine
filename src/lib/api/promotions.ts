import { apiRequest } from './client'
import type {
  WebPromotionCreate,
  WebPromotionUpdate,
  PromotionItem,
  WebPromotionListResponse,
  WebPromotionMutationResponse,
} from './types'

export const promotionsApi = {
  // Public list
  list: (featured?: boolean, token?: string) => {
    const q = featured != null ? `?featured=${featured}` : ''
    return apiRequest<WebPromotionListResponse>(`/api/promotions${q}`, { token })
  },

  // Admin create
  create: (data: WebPromotionCreate, token?: string) =>
    apiRequest<WebPromotionMutationResponse>('/api/admin/promotions', {
      method: 'POST',
      body: data,
      token,
    }),

  // Admin update
  update: (data: WebPromotionUpdate, token?: string) =>
    apiRequest<WebPromotionMutationResponse>('/api/admin/promotions', {
      method: 'PUT',
      body: data,
      token,
    }),

  // Admin delete
  delete: (id: string, token?: string) =>
    apiRequest<{ success: boolean; message?: string }>(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    }),

  // Admin bulk update
  bulk: (promotions: PromotionItem[], token?: string) =>
    apiRequest<{ success: boolean; message?: string }>('/api/admin/promotions/bulk', {
      method: 'POST',
      body: promotions,
      token,
    }),
}
