import { apiRequest } from './client'
import type { LoginRequest, RefreshTokenRequest, TokenResponse, UserProfileResponse } from './types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<TokenResponse>('/auth/login', { method: 'POST', body: data }),

  refresh: (data: RefreshTokenRequest) =>
    apiRequest<TokenResponse>('/auth/refresh', { method: 'POST', body: data }),

  logout: (token: string) =>
    apiRequest<Record<string, unknown>>('/auth/logout', { method: 'POST', token }),

  me: (token: string) =>
    apiRequest<UserProfileResponse>('/auth/me', { token }),
}
