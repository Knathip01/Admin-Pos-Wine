import { apiRequest } from './client'
import type { AuditLogResponse, AuditLogListResponse, PaginationParams } from './types'

export interface ListAuditLogsParams extends PaginationParams {
  user_id?: number
  action?: string
  entity_type?: string
  entity_id?: number
  date_from?: string
  date_to?: string
}

export const auditApi = {
  list: (params: ListAuditLogsParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.user_id != null) q.set('user_id', String(params.user_id))
    if (params.action) q.set('action', params.action)
    if (params.entity_type) q.set('entity_type', params.entity_type)
    if (params.entity_id != null) q.set('entity_id', String(params.entity_id))
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    return apiRequest<AuditLogListResponse>(`/audit/?${q}`, { token })
  },

  get: (logId: number, token?: string) =>
    apiRequest<AuditLogResponse>(`/audit/${logId}`, { token }),
}
