import { apiRequest } from './client'
import type { StockTransferCreate, TransferShipItems, TransferReceiveItems, StockTransferResponse, StockTransferListResponse, PaginationParams } from './types'

interface ListTransfersParams extends PaginationParams { source_branch_id?: number; dest_branch_id?: number; status?: string }

export const transfersApi = {
  list: (params: ListTransfersParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.source_branch_id) q.set('source_branch_id', String(params.source_branch_id))
    if (params.dest_branch_id) q.set('dest_branch_id', String(params.dest_branch_id))
    if (params.status) q.set('status', params.status)
    return apiRequest<StockTransferListResponse>(`/transfers/?${q}`, { token })
  },
  create: (data: StockTransferCreate, token?: string, branchId?: number) =>
    apiRequest<StockTransferResponse>('/transfers/', { method: 'POST', body: data, token, branchId }),
  get: (id: number, token?: string) =>
    apiRequest<StockTransferResponse>(`/transfers/${id}`, { token }),
  approve: (id: number, token?: string) =>
    apiRequest<StockTransferResponse>(`/transfers/${id}/approve`, { method: 'PUT', token }),
  ship: (id: number, data: TransferShipItems, token?: string) =>
    apiRequest<StockTransferResponse>(`/transfers/${id}/ship`, { method: 'PUT', body: data, token }),
  receive: (id: number, data: TransferReceiveItems, token?: string) =>
    apiRequest<StockTransferResponse>(`/transfers/${id}/receive`, { method: 'PUT', body: data, token }),
  cancel: (id: number, token?: string) =>
    apiRequest<StockTransferResponse>(`/transfers/${id}/cancel`, { method: 'PUT', token }),
}
