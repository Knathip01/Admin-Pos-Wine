import { apiRequest } from './client'
import type { PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse, PurchaseReceivingCreate, PurchaseReceivingResponse, PaginationParams } from './types'

interface ListPOParams extends PaginationParams { status?: string; supplier_id?: number; date_from?: string; date_to?: string }

export const purchasesApi = {
  list: (params: ListPOParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.status) q.set('status', params.status)
    if (params.supplier_id) q.set('supplier_id', String(params.supplier_id))
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    return apiRequest<PurchaseOrderResponse[]>(`/purchases?${q}`, { token })
  },
  create: (data: PurchaseOrderCreate, token?: string) =>
    apiRequest<PurchaseOrderResponse>('/purchases', { method: 'POST', body: data, token }),
  get: (id: number, token?: string) =>
    apiRequest<PurchaseOrderResponse>(`/purchases/${id}`, { token }),
  update: (id: number, data: PurchaseOrderUpdate, token?: string) =>
    apiRequest<PurchaseOrderResponse>(`/purchases/${id}`, { method: 'PUT', body: data, token }),
  approve: (id: number, token?: string) =>
    apiRequest<PurchaseOrderResponse>(`/purchases/${id}/approve`, { method: 'POST', token }),
  receive: (id: number, data: PurchaseReceivingCreate, token?: string) =>
    apiRequest<PurchaseReceivingResponse>(`/purchases/${id}/receive`, { method: 'POST', body: data, token }),
  cancel: (id: number, token?: string) =>
    apiRequest<PurchaseOrderResponse>(`/purchases/${id}/cancel`, { method: 'POST', token }),
}
