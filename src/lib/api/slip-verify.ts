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

  list: (params: { status?: string; limit?: number } = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.status) q.set('status', params.status)
    if (params.limit) q.set('limit', String(params.limit))
    return apiRequest<{ items: SlipVerificationResult[]; total: number }>(`/slip-verify/list?${q}`, { token })
  },

  approve: (verificationId: number, note?: string, token?: string) =>
    apiRequest<SlipVerificationResult>(`/slip-verify/${verificationId}/approve`, {
      method: 'POST',
      body: note ? { note } : {},
      token,
    }),

  reject: (verificationId: number, note?: string, token?: string) =>
    apiRequest<SlipVerificationResult>(`/slip-verify/${verificationId}/reject`, {
      method: 'POST',
      body: note ? { note } : {},
      token,
    }),
}
