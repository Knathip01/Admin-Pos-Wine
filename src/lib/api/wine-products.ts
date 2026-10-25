import { apiRequest } from './client'
import type { PaginationParams, WineProductItem, WineProductListResponse } from './types'

export type { WineProductItem, WineProductListResponse }

export interface ListWineProductsParams extends PaginationParams {
  search?: string
  brands?: string
  countries?: string
  category?: string
}

export const wineProductsApi = {
  // GET /api/v1/wine-products/ (public, no auth required)
  list: async (params: ListWineProductsParams = {}): Promise<WineProductListResponse> => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    if (params.brands) q.set('brands', params.brands)
    if (params.countries) q.set('countries', params.countries)
    if (params.category) q.set('category', params.category)

    const raw = await apiRequest<any>(`/wine-products/?${q}`)
    // Handle both unwrapped payload and enveloped shape safely
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items,
        total: raw.total ?? raw.items.length,
        page: raw.page ?? (params.page || 1),
        per_page: raw.per_page ?? (params.per_page || 20),
        pages: raw.pages ?? 1,
      }
    }
    if (raw?.data && Array.isArray(raw.data.items)) {
      return {
        items: raw.data.items,
        total: raw.data.total ?? raw.data.items.length,
        page: raw.data.page ?? (params.page || 1),
        per_page: raw.data.per_page ?? (params.per_page || 20),
        pages: raw.data.pages ?? 1,
      }
    }
    if (Array.isArray(raw)) {
      return {
        items: raw,
        total: raw.length,
        page: params.page || 1,
        per_page: params.per_page || raw.length,
        pages: 1,
      }
    }
    return {
      items: [],
      total: 0,
      page: params.page || 1,
      per_page: params.per_page || 20,
      pages: 0,
    }
  },

  // GET /api/v1/wine-products/{wine_product_id} (public, no auth required)
  get: (id: number) =>
    apiRequest<WineProductItem>(`/wine-products/${id}`),
}
