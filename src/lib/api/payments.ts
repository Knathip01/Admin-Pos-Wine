import { apiRequest } from './client'
import type { PaymentCreate, PaymentRefundRequest, PaymentResponse } from './types'

export const paymentsApi = {
  create: (data: PaymentCreate, token?: string) =>
    apiRequest<PaymentResponse>('/payments/', { method: 'POST', body: data, token }),
  listByOrder: (orderId: number, token?: string) =>
    apiRequest<PaymentResponse[]>(`/payments/${orderId}`, { token }),
  refund: (orderId: number, data: PaymentRefundRequest, token?: string) =>
    apiRequest<PaymentResponse>(`/payments/${orderId}/refund`, { method: 'POST', body: data, token }),
}
