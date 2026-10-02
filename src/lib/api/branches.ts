import { apiRequest } from './client'
import type { BranchCreate, BranchUpdate, BranchResponse, BranchListResponse } from './types'

export const branchesApi = {
  list: (token?: string) => apiRequest<BranchListResponse>('/branches/', { token }),
  create: (data: BranchCreate, token?: string) =>
    apiRequest<BranchResponse>('/branches/', { method: 'POST', body: data, token }),
  get: (id: number, token?: string) => apiRequest<BranchResponse>(`/branches/${id}`, { token }),
  update: (id: number, data: BranchUpdate, token?: string) =>
    apiRequest<BranchResponse>(`/branches/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) =>
    apiRequest<void>(`/branches/${id}`, { method: 'DELETE', token }),
}
