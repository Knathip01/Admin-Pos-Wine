import { apiRequest } from './client'
import type {
  UserCreate, UserUpdate, UserResponse, UserListResponse, UserRoleAssign,
  PaginationParams
} from './types'

interface ListUsersParams extends PaginationParams { search?: string; status?: string }

export const usersApi = {
  list: (params: ListUsersParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    if (params.status) q.set('status', params.status)
    return apiRequest<UserListResponse>(`/users/?${q}`, { token })
  },
  create: (data: UserCreate, token?: string) =>
    apiRequest<UserResponse>('/users/', { method: 'POST', body: data, token }),
  get: (id: number, token?: string) =>
    apiRequest<UserResponse>(`/users/${id}`, { token }),
  update: (id: number, data: UserUpdate, token?: string) =>
    apiRequest<UserResponse>(`/users/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) =>
    apiRequest<void>(`/users/${id}`, { method: 'DELETE', token }),
  assignRole: (userId: number, data: UserRoleAssign, token?: string) =>
    apiRequest<UserRoleAssign>(`/users/${userId}/roles`, { method: 'POST', body: data, token }),
  removeRole: (userId: number, roleId: number, branchId: number, token?: string) =>
    apiRequest<void>(`/users/${userId}/roles/${roleId}/${branchId}`, { method: 'DELETE', token }),
}
