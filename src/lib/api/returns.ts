import { apiRequest } from './client'
import type { ReturnCreate, ReturnResponse, ReturnListResponse, PaginationParams } from './types'

export const returnsApi = {
  list: (params: PaginationParams = {}, token?: string, branchId?: number) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    return apiRequest<ReturnListResponse>(`/returns/?${q}`, { token, branchId })
  },
  create: (data: ReturnCreate, token?: string, branchId?: number) =>
    apiRequest<ReturnResponse>('/returns/', { method: 'POST', body: data, token, branchId }),
  get: (id: number, token?: string) =>
    apiRequest<ReturnResponse>(`/returns/${id}`, { token }),
  process: (id: number, token?: string) =>
    apiRequest<ReturnResponse>(`/returns/${id}/process`, { method: 'PUT', token }),
}
