import { apiRequest } from './client'

export interface CustomerAddress {
  id: number
  customer_id: number
  recipient_name: string
  phone: string
  address_line1: string
  address_line2?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null
  is_default?: boolean
  created_at: string
  updated_at?: string
}

export interface CustomerAddressCreate {
  customer_id: number
  recipient_name: string
  phone: string
  address_line1: string
  address_line2?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null
  is_default?: boolean
}

export interface CustomerAddressUpdate {
  recipient_name?: string
  phone?: string
  address_line1?: string
  address_line2?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postal_code?: string | null
  is_default?: boolean
}

export const customerAddressesApi = {
  listByCustomer: (customerId: number, token?: string) =>
    apiRequest<CustomerAddress[]>(`/customer-addresses/customer/${customerId}`, { token }),

  get: (customerId: number, addressId: number, token?: string) =>
    apiRequest<CustomerAddress>(`/customer-addresses/customer/${customerId}/${addressId}`, { token }),

  create: (data: CustomerAddressCreate, token?: string) =>
    apiRequest<CustomerAddress>('/customer-addresses/', {
      method: 'POST',
      body: data,
      token,
    }),

  update: (customerId: number, addressId: number, data: CustomerAddressUpdate, token?: string) =>
    apiRequest<CustomerAddress>(`/customer-addresses/customer/${customerId}/${addressId}`, {
      method: 'PUT',
      body: data,
      token,
    }),

  delete: (customerId: number, addressId: number, token?: string) =>
    apiRequest<void>(`/customer-addresses/customer/${customerId}/${addressId}`, {
      method: 'DELETE',
      token,
    }),
}
