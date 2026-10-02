import { apiRequest } from './client'
import type { PaginationParams } from './types'

export interface ReviewResponse {
  id: number
  product_id: number
  product_name?: string | null
  customer_id?: number | null
  customer_name?: string | null
  rating: number
  title?: string | null
  comment: string
  status: string
  created_at: string
}

export interface ReviewListResponse {
  reviews: ReviewResponse[]
  total: number
  page: number
  per_page: number
}

export interface ReviewModerationRequest {
  status: 'approved' | 'rejected' | 'pending'
  notes?: string | null
}

export interface ListReviewsParams extends PaginationParams {
  product_id?: number
  status?: string
}

export const reviewsApi = {
  list: (params: ListReviewsParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.product_id != null) q.set('product_id', String(params.product_id))
    if (params.status) q.set('status', params.status)
    return apiRequest<ReviewListResponse>(`/reviews/?${q}`, { token })
  },

  get: (reviewId: number, token?: string) =>
    apiRequest<ReviewResponse>(`/reviews/${reviewId}`, { token }),

  moderate: (reviewId: number, data: ReviewModerationRequest, token?: string) =>
    apiRequest<ReviewResponse>(`/reviews/${reviewId}/moderation`, {
      method: 'PUT',
      body: data,
      token,
    }),

  delete: (reviewId: number, token?: string) =>
    apiRequest<void>(`/reviews/${reviewId}`, {
      method: 'DELETE',
      token,
    }),
}
