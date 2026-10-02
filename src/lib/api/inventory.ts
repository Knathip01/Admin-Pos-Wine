import { apiRequest } from './client'
import type {
  InventoryBalanceResponse, InventoryAdjustmentRequest,
  InventoryLotResponse, StockMovementResponse, LowStockReportResponse,
  PaginationParams
} from './types'

interface ListBalancesParams extends PaginationParams { branch_id?: number; search?: string; low_stock_only?: boolean }
interface ListMovementsParams extends PaginationParams { branch_id: number; product_id: number; movement_type?: string; date_from?: string; date_to?: string }

export const inventoryApi = {
  listBalances: (params: ListBalancesParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    if (params.low_stock_only) q.set('low_stock_only', 'true')
    return apiRequest<InventoryBalanceResponse[]>(`/inventory/balances?${q}`, { token })
  },
  getBalance: (branchId: number, productId: number, token?: string) =>
    apiRequest<InventoryBalanceResponse>(`/inventory/balances/${branchId}/${productId}`, { token }),
  adjust: (data: InventoryAdjustmentRequest, token?: string) =>
    apiRequest<unknown>('/inventory/adjust', { method: 'POST', body: data, token }),
  listLots: (branchId: number, productId: number, token?: string) => {
    const q = new URLSearchParams({ branch_id: String(branchId), product_id: String(productId) })
    return apiRequest<InventoryLotResponse[]>(`/inventory/lots?${q}`, { token })
  },
  listMovements: (params: ListMovementsParams, token?: string) => {
    const q = new URLSearchParams({ branch_id: String(params.branch_id), product_id: String(params.product_id) })
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.movement_type) q.set('movement_type', params.movement_type)
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    return apiRequest<StockMovementResponse[]>(`/inventory/movements?${q}`, { token })
  },
  getLowStock: (threshold: number | undefined, token?: string) => {
    const q = threshold != null ? `?threshold=${threshold}` : ''
    return apiRequest<LowStockReportResponse[]>(`/inventory/low-stock${q}`, { token })
  },
}
