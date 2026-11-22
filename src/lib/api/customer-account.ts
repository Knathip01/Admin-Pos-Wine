import { apiRequest } from './client'

export interface CustomerAccountProfile {
  id: number
  first_name: string
  last_name?: string | null
  phone?: string | null
  email?: string | null
  line_user_id?: string | null
  loyalty_points_balance?: number
  created_at: string
}

export const customerAccountApi = {
  // GET /api/v1/customer/me (Customer token required)
  getMe: (customerToken: string) =>
    apiRequest<CustomerAccountProfile>('/customer/me', { token: customerToken }),

  // POST /api/v1/auth/exchange (Exchange LINE login one-time code for customer token)
  exchangeCode: (code: string) =>
    apiRequest<{
      access_token: string
      token_type: string
      expires_in: number
      audience: 'customer'
    }>('/auth/exchange', {
      method: 'POST',
      body: { code },
    }),
}
