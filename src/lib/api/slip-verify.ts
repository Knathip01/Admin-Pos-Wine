import { apiRequest } from './client'
import type { SlipVerificationResult } from './types'

export const slipVerifyApi = {
  upload: (orderId: number, file: File | Blob, token?: string) => {
    const formData = new FormData()
    formData.append('order_id', String(orderId))
    formData.append('file', file)
    return apiRequest<SlipVerificationResult>('/slip-verify/upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
      token,
    })
  },

  checkSlip: (orderId: number, file: File | Blob, token?: string) => {
    const formData = new FormData()
    formData.append('order_id', String(orderId))
    formData.append('file', file)
    return apiRequest<SlipVerificationResult>('/slip-verify/checkslip', {
      method: 'POST',
      body: formData,
      isFormData: true,
      token,
    })
  },

  get: (verificationId: number, token?: string) =>
    apiRequest<SlipVerificationResult>(`/slip-verify/${verificationId}`, { token }),

  listByOrder: (orderId: number, token?: string) =>
    apiRequest<SlipVerificationResult[]>(`/slip-verify/order/${orderId}`, { token }),
}
