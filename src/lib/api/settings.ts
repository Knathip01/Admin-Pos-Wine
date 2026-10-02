import { apiRequest } from './client'
import type { SettingResponse, SettingListResponse, SettingUpdate } from './types'

export const settingsApi = {
  list: (token?: string) =>
    apiRequest<SettingListResponse>('/settings/', { token }),

  get: (key: string, token?: string) =>
    apiRequest<SettingResponse>(`/settings/${encodeURIComponent(key)}`, { token }),

  update: (key: string, data: SettingUpdate, token?: string) =>
    apiRequest<SettingResponse>(`/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: data,
      token,
    }),
}
