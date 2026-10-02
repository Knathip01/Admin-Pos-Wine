import { apiRequest } from './client'
import type {
  LoyaltyPointsEarn,
  LoyaltyPointsRedeem,
  LoyaltyBalanceResponse,
  LoyaltyTransactionResponse,
  LoyaltyTransactionListResponse,
  PaginationParams,
} from './types'

export const loyaltyApi = {
  earn: (data: LoyaltyPointsEarn, token?: string) =>
    apiRequest<LoyaltyTransactionResponse>('/loyalty/earn', {
      method: 'POST',
      body: data,
      token,
    }),

  redeem: (data: LoyaltyPointsRedeem, token?: string) =>
    apiRequest<LoyaltyTransactionResponse>('/loyalty/redeem', {
      method: 'POST',
      body: data,
      token,
    }),

  getBalance: (customerId: number, token?: string) =>
    apiRequest<LoyaltyBalanceResponse>(`/loyalty/balance/${customerId}`, { token }),

  listTransactions: (customerId: number, params: PaginationParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    return apiRequest<LoyaltyTransactionListResponse>(
      `/loyalty/transactions/${customerId}?${q}`,
      { token }
    )
  },
}
