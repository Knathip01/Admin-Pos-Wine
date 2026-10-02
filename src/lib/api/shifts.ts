import { apiRequest } from './client'
import type {
  ShiftOpen,
  ShiftClose,
  CashMovementCreate,
  ShiftCashMovementResponse,
  ShiftResponse,
  ShiftListResponse,
  XReport,
  PaginationParams,
} from './types'

export interface ListShiftsParams extends PaginationParams {
  branch_id?: number
  status?: string
  date_from?: string
  date_to?: string
}

export const shiftsApi = {
  open: (data: ShiftOpen, token?: string) =>
    apiRequest<ShiftResponse>('/shifts/open', { method: 'POST', body: data, token }),

  close: (shiftId: number, data: ShiftClose, token?: string) =>
    apiRequest<ShiftResponse>(`/shifts/${shiftId}/close`, { method: 'PUT', body: data, token }),

  addCashMovement: (shiftId: number, data: CashMovementCreate, token?: string) =>
    apiRequest<ShiftCashMovementResponse>(`/shifts/${shiftId}/cash-movements`, {
      method: 'POST',
      body: data,
      token,
    }),

  list: (params: ListShiftsParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    if (params.status) q.set('status', params.status)
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    return apiRequest<ShiftListResponse>(`/shifts/?${q}`, { token })
  },

  getXReport: (shiftId: number, token?: string) =>
    apiRequest<XReport>(`/shifts/${shiftId}/x-report`, { token }),
}
