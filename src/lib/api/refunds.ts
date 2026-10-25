import { apiRequest } from './client'
import type { RefundResponse, RefundListResponse, RefundCreate, PaginationParams } from './types'

export type { RefundCreate }

interface ListRefundsParams extends PaginationParams {
  date_from?: string
  date_to?: string
}

export const refundsApi = {
  // GET /api/v1/refunds/
  list: (params: ListRefundsParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    return apiRequest<RefundListResponse>(`/refunds/?${q}`, { token })
  },

  // GET /api/v1/refunds/{refund_id}
  get: (id: number, token?: string) =>
    apiRequest<RefundResponse>(`/refunds/${id}`, { token }),

  // POST /api/v1/refunds/ (201; body: order_id, refund_amount, refund_method, reason?, external_reference?)
  create: (data: RefundCreate, token?: string) =>
    apiRequest<RefundResponse>('/refunds/', {
      method: 'POST',
      body: data,
      token,
    }),
}
