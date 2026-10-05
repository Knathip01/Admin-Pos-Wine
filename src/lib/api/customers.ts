import { apiRequest } from './client'
import type {
  CustomerResponse,
  CustomerListResponse,
  CustomerCreate,
  CustomerUpdate,
  PaginationParams,
} from './types'

export interface CustomerListParams extends PaginationParams {
  search?: string
}

export const customersApi = {
  list: (params: CustomerListParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    return apiRequest<CustomerListResponse>(`/customers/?${q}`, { token })
  },

  create: (data: CustomerCreate, token?: string) =>
    apiRequest<CustomerResponse>('/customers/', { method: 'POST', body: data, token }),

  get: (id: number, token?: string) =>
    apiRequest<CustomerResponse>(`/customers/${id}`, { token }),

  update: (id: number, data: CustomerUpdate, token?: string) =>
    apiRequest<CustomerResponse>(`/customers/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: number, token?: string) =>
    apiRequest<void>(`/customers/${id}`, { method: 'DELETE', token }),

  getAddresses: (customerId: number, token?: string) =>
    apiRequest<any[]>(`/customer-addresses/customer/${customerId}`, { token }),

  createAddress: (data: any, token?: string) =>
    apiRequest<any>('/customer-addresses/', { method: 'POST', body: data, token }),

  updateAddress: (customerId: number, addressId: number, data: any, token?: string) =>
    apiRequest<any>(`/customer-addresses/customer/${customerId}/${addressId}`, { method: 'PUT', body: data, token }),

  deleteAddress: (customerId: number, addressId: number, token?: string) =>
    apiRequest<void>(`/customer-addresses/customer/${customerId}/${addressId}`, { method: 'DELETE', token }),
}
