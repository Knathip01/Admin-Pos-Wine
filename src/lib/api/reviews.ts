import { apiRequest } from './client'
import type {
  ReviewResponse,
  ReviewListResponse,
  ReviewCreate,
  ReviewModerationRequest,
  PaginationParams,
} from './types'

export type { ReviewResponse, ReviewListResponse, ReviewCreate, ReviewModerationRequest }

export interface ListReviewsParams extends PaginationParams {
  product_id?: number
  status?: string
}

export const reviewsApi = {
  // GET /api/v1/reviews/
  list: (params: ListReviewsParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.product_id != null) q.set('product_id', String(params.product_id))
    if (params.status) q.set('status', params.status)
    return apiRequest<ReviewListResponse>(`/reviews/?${q}`, { token })
  },

  // GET /api/v1/reviews/{review_id}
  get: (reviewId: number, token?: string) =>
    apiRequest<ReviewResponse>(`/reviews/${reviewId}`, { token }),

  // POST /api/v1/reviews/
  create: (data: ReviewCreate, token?: string) =>
    apiRequest<ReviewResponse>('/reviews/', {
      method: 'POST',
      body: data,
      token,
    }),

  // PATCH /api/v1/reviews/{review_id}/moderation (body: status pending|approved|rejected|hidden)
  moderate: (reviewId: number, data: ReviewModerationRequest, token?: string) =>
    apiRequest<ReviewResponse>(`/reviews/${reviewId}/moderation`, {
      method: 'PATCH',
      body: data,
      token,
    }),

  // Soft moderation fallback helper to hide a review (replaces unsupported DELETE)
  delete: (reviewId: number, token?: string) =>
    apiRequest<ReviewResponse>(`/reviews/${reviewId}/moderation`, {
      method: 'PATCH',
      body: { status: 'hidden' },
      token,
    }),
}
