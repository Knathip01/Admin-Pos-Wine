import { apiRequest } from './client'
import type { PaginationParams } from './types'

export interface RegisterResponse {
  id: number
  branch_id: number
  name: string
  code?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface RegisterCreate {
  branch_id: number
  name: string
  code?: string | null
  is_active?: boolean
}

export interface RegisterUpdate {
  name?: string
  code?: string | null
  is_active?: boolean
}

export const registersApi = {
  // GET /api/v1/registers/
  list: (params: PaginationParams & { branch_id?: number } = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.branch_id != null) q.set('branch_id', String(params.branch_id))
    return apiRequest<RegisterResponse[]>(`/registers/?${q}`, { token })
  },

  // POST /api/v1/registers/
  create: (data: RegisterCreate, token?: string) =>
    apiRequest<RegisterResponse>('/registers/', {
      method: 'POST',
      body: data,
      token,
    }),

  // PUT /api/v1/registers/{register_id}
  update: (registerId: number, data: RegisterUpdate, token?: string) =>
    apiRequest<RegisterResponse>(`/registers/${registerId}`, {
      method: 'PUT',
      body: data,
      token,
    }),
}
