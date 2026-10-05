import { apiRequest } from './client'
import type { SalesReportResponse, DailySalesSummary } from './types'

export interface SalesReportParams {
  date_from: string
  date_to: string
  branch_id?: number
}

export interface DailySummaryParams {
  date: string
  branch_id?: number
}

export interface EcommerceDashboardResponse {
  sales_today: number
  sales_this_month: number
  pending_orders_count: number
  pending_slips_count: number
  total_members: number
  recent_orders: any[]
  top_selling_wines: any[]
}

export const reportsApi = {
  getSales: (params: SalesReportParams, token?: string) => {
    const q = new URLSearchParams()
    q.set('date_from', params.date_from)
    q.set('date_to', params.date_to)
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    return apiRequest<SalesReportResponse>(`/reports/sales?${q}`, { token })
  },

  getDailySummary: (params: DailySummaryParams, token?: string) => {
    const q = new URLSearchParams()
    q.set('date', params.date)
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    return apiRequest<DailySalesSummary>(`/reports/daily-summary?${q}`, { token })
  },

  getEcommerceDashboard: (token?: string) =>
    apiRequest<EcommerceDashboardResponse>('/reports/ecommerce/dashboard', { token }),
}
