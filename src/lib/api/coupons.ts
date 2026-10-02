import { apiRequest } from './client'
import type { CouponCreate, CouponValidate, CouponValidationResult, CouponResponse, CouponListResponse, PaginationParams } from './types'

export const couponsApi = {
  list: (params: PaginationParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    return apiRequest<CouponListResponse>(`/coupons/?${q}`, { token })
  },
  create: (data: CouponCreate, token?: string) =>
    apiRequest<CouponResponse>('/coupons/', { method: 'POST', body: data, token }),
  get: (id: number, token?: string) =>
    apiRequest<CouponResponse>(`/coupons/${id}`, { token }),
  delete: (id: number, token?: string) =>
    apiRequest<void>(`/coupons/${id}`, { method: 'DELETE', token }),
  validate: (data: CouponValidate, token?: string) =>
    apiRequest<CouponValidationResult>('/coupons/validate', { method: 'POST', body: data, token }),
}
