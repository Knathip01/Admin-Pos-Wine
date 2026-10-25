import { apiRequest } from './client'
import type { SalesReportResponse, DailySalesSummary, EcommerceDashboardResponse } from './types'

export type { EcommerceDashboardResponse }

export interface SalesReportParams {
  date_from?: string
  date_to?: string
  from_date?: string
  to_date?: string
  group_by?: string
  branch_id?: number
  order_source?: string
}

export interface DailySummaryParams {
  date: string
  branch_id?: number
}

export const reportsApi = {
  // GET /api/v1/reports/sales (reports.sales)
  getSales: (params: SalesReportParams, token?: string) => {
    const q = new URLSearchParams()
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.from_date) q.set('from_date', params.from_date)
    if (params.to_date) q.set('to_date', params.to_date)
    if (params.group_by) q.set('group_by', params.group_by)
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    if (params.order_source) q.set('order_source', params.order_source)
    return apiRequest<SalesReportResponse>(`/reports/sales?${q}`, { token })
  },

  // GET /api/v1/reports/ecommerce/dashboard (reports.read)
  getEcommerceDashboard: (token?: string) =>
    apiRequest<EcommerceDashboardResponse>('/reports/ecommerce/dashboard', { token }),

  // GET /api/v1/reports/daily-summary (reports.read)
  getDailySummary: (params: DailySummaryParams, token?: string) => {
    const q = new URLSearchParams()
    q.set('date', params.date)
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    return apiRequest<DailySalesSummary>(`/reports/daily-summary?${q}`, { token })
  },

  // GET /api/v1/reports/inventory (reports.read)
  getInventory: (params: { branch_id?: number; category_id?: number } = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    if (params.category_id != null) q.set('category_id', String(params.category_id))
    return apiRequest<any>(`/reports/inventory?${q}`, { token })
  },

  // GET /api/v1/reports/financial (reports.read)
  getFinancial: (
    params: { date_from?: string; date_to?: string; from_date?: string; to_date?: string; branch_id?: number },
    token?: string
  ) => {
    const q = new URLSearchParams()
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.from_date) q.set('from_date', params.from_date)
    if (params.to_date) q.set('to_date', params.to_date)
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    return apiRequest<any>(`/reports/financial?${q}`, { token })
  },

  // GET /api/v1/reports/loyalty (reports.read)
  getLoyalty: (params: { from_date: string; to_date: string }, token?: string) => {
    const q = new URLSearchParams()
    q.set('from_date', params.from_date)
    q.set('to_date', params.to_date)
    return apiRequest<any>(`/reports/loyalty?${q}`, { token })
  },
}
