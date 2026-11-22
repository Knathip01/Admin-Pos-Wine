import { apiRequest } from './client'
import type { LoginRequest, RefreshTokenRequest, TokenResponse, UserProfileResponse } from './types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<TokenResponse>('/auth/login', { method: 'POST', body: data }),

  refresh: (data: RefreshTokenRequest) =>
    apiRequest<TokenResponse>('/auth/refresh', { method: 'POST', body: data }),

  logout: (token: string) =>
    apiRequest<Record<string, unknown>>('/auth/logout', { method: 'POST', token }),

  changePassword: (data: { old_password: string; new_password: string }, token: string) =>
    apiRequest<{ message: string }>('/auth/change-password', { method: 'POST', body: data, token }),

  register: (data: { username: string; email: string; password: string; display_name: string; phone?: string | null }) =>
    apiRequest<any>('/auth/register', { method: 'POST', body: data }),

  exchangeLineCode: (code: string) =>
    apiRequest<{
      access_token: string
      token_type: string
      expires_in: number
      audience: 'customer'
    }>('/auth/exchange', { method: 'POST', body: { code } }),

  me: (token: string) =>
    apiRequest<UserProfileResponse>('/auth/me', { token }),
}
