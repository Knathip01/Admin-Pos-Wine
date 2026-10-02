import { apiRequest } from './client'
import type { RoleCreate, RoleUpdate, RoleResponse, RoleListResponse, PermissionResponse, PaginationParams } from './types'

export const rolesApi = {
  list: (params: PaginationParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    return apiRequest<RoleListResponse>(`/roles/?${q}`, { token })
  },
  create: (data: RoleCreate, token?: string) =>
    apiRequest<RoleResponse>('/roles/', { method: 'POST', body: data, token }),
  get: (id: number, token?: string) => apiRequest<RoleResponse>(`/roles/${id}`, { token }),
  update: (id: number, data: RoleUpdate, token?: string) =>
    apiRequest<RoleResponse>(`/roles/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) =>
    apiRequest<void>(`/roles/${id}`, { method: 'DELETE', token }),
  listPermissions: (token?: string) =>
    apiRequest<PermissionResponse[]>('/roles/permissions/all', { token }),
}
