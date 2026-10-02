import { apiRequest } from './client'
import type { OrderCreate, OrderStatusUpdate, OrderResponse, OrderListResponse, PaginationParams } from './types'

interface ListOrdersParams extends PaginationParams { status?: string; date_from?: string; date_to?: string; customer_id?: number; user_id?: number }

export const ordersApi = {
  list: (params: ListOrdersParams = {}, token?: string, branchId?: number) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.status) q.set('status', params.status)
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.customer_id) q.set('customer_id', String(params.customer_id))
    if (params.user_id) q.set('user_id', String(params.user_id))
    return apiRequest<OrderListResponse>(`/orders/?${q}`, { token, branchId })
  },
  create: (data: OrderCreate, token?: string, branchId?: number) =>
    apiRequest<OrderResponse>('/orders/', { method: 'POST', body: data, token, branchId }),
  get: (id: number, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${id}`, { token }),
  updateStatus: (id: number, data: OrderStatusUpdate, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${id}/status`, { method: 'PUT', body: data, token }),
  complete: (id: number, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${id}/complete`, { method: 'PUT', token }),
}
