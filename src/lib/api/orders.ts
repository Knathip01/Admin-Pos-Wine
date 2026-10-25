import { apiRequest } from './client'
import type {
  OrderCreate,
  OrderStatusUpdate,
  OrderResponse,
  OrderListResponse,
  ReceiptResponse,
  CheckoutRequest,
  CheckoutResponse,
  PaginationParams,
  ItemStatus
} from './types'

export interface ListOrdersParams extends PaginationParams {
  status?: string
  date_from?: string
  date_to?: string
  customer_id?: number
  user_id?: number
}

export const ordersApi = {
  // 5.2 List Orders — GET /api/v1/orders/
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

  // 5.1 Create Order — POST /api/v1/orders/
  create: (data: OrderCreate, token?: string, branchId?: number) =>
    apiRequest<OrderResponse>('/orders/', { method: 'POST', body: data, token, branchId }),

  // 5.3 Get Order — GET /api/v1/orders/{reference} (numeric id or order_number string)
  get: (reference: number | string, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${encodeURIComponent(String(reference))}`, { token }),

  // 5.4 Receipt — GET /api/v1/orders/{reference}/receipt
  receipt: (reference: number | string, token?: string) =>
    apiRequest<ReceiptResponse>(`/orders/${encodeURIComponent(String(reference))}/receipt`, { token }),

  // 5.5 Update Status — PUT /api/v1/orders/{order_id}/status
  updateStatus: (id: number, data: OrderStatusUpdate, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${id}/status`, { method: 'PUT', body: data, token }),

  // 5.6 Cancel Order — POST /api/v1/orders/{order_id}/cancel (Restores stock)
  cancel: (id: number, reason?: string, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: reason ? { reason } : {},
      token,
    }),

  // 5.7 Complete Order — PUT /api/v1/orders/{order_id}/complete
  complete: (id: number, token?: string) =>
    apiRequest<OrderResponse>(`/orders/${id}/complete`, { method: 'PUT', token }),

  // 5.8 Update Tracking — PUT /api/v1/orders/{order_id}/tracking
  updateTracking: (
    id: number,
    data: { tracking_number: string; fulfillment_status?: string },
    token?: string
  ) =>
    apiRequest<OrderResponse>(`/orders/${id}/tracking`, { method: 'PUT', body: data, token }),

  // 5.9 Public Tracking Lookup — GET /api/v1/orders/track/{tracking_or_ref} (No auth required)
  track: (trackingOrRef: string) =>
    apiRequest<{
      order_number: string
      status: string
      fulfillment_status: string
      tracking_number: string | null
      created_at: string
      completed_at: string | null
    }>(`/orders/track/${encodeURIComponent(trackingOrRef)}`),

  // 9. Checkout & Payment — POST /api/v1/orders/{order_id}/checkout
  checkout: (id: number, data: CheckoutRequest, token?: string) =>
    apiRequest<CheckoutResponse>(`/orders/${id}/checkout`, { method: 'POST', body: data, token }),

  // 5.10 Station Queues (KDS)
  kitchenQueue: (
    params: PaginationParams & { item_status?: ItemStatus } = {},
    token?: string,
    branchId?: number
  ) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.item_status) q.set('item_status', params.item_status)
    return apiRequest<any>(`/orders/station/kitchen?${q}`, { token, branchId })
  },

  barQueue: (
    params: PaginationParams & { item_status?: ItemStatus } = {},
    token?: string,
    branchId?: number
  ) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.item_status) q.set('item_status', params.item_status)
    return apiRequest<any>(`/orders/station/bar?${q}`, { token, branchId })
  },

  updateStationItemStatus: (
    orderId: number,
    runId: number,
    data: { item_status: ItemStatus | string; notes?: string },
    token?: string
  ) =>
    apiRequest<any>(`/orders/${orderId}/station-items/${runId}/status`, {
      method: 'PATCH',
      body: data,
      token,
    }),
}
