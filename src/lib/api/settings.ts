import { apiRequest } from './client'
import type { SettingResponse, SettingListResponse, SettingUpdate } from './types'

export const settingsApi = {
  // GET /api/v1/settings/ (query branch_id?)
  list: (token?: string, branchId?: number) => {
    const q = branchId != null ? `?branch_id=${branchId}` : ''
    return apiRequest<SettingListResponse>(`/settings/${q}`, { token })
  },

  // GET /api/v1/settings/{key} (query branch_id?)
  get: (key: string, token?: string, branchId?: number) => {
    const q = branchId != null ? `?branch_id=${branchId}` : ''
    return apiRequest<SettingResponse>(`/settings/${encodeURIComponent(key)}${q}`, { token })
  },

  // PUT /api/v1/settings/{key} (query branch_id?; body: value, value_type?)
  update: (
    key: string,
    data: SettingUpdate | { value: string; value_type?: string },
    token?: string,
    branchId?: number
  ) => {
    const q = branchId != null ? `?branch_id=${branchId}` : ''
    return apiRequest<SettingResponse>(`/settings/${encodeURIComponent(key)}${q}`, {
      method: 'PUT',
      body: data,
      token,
    })
  },
}
