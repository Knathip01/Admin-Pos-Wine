import { apiRequest } from './client'
import type { PaginationParams } from './types'

export interface WineProductItem {
  id: number
  code: string
  product_name: string | null
  brands: string | null
  categories_en: string | null
  origins_en: string | null
  countries_en: string | null
  quantity: string | null
  ingredients_text: string | null
  image_url: string | null
  image_small_url: string | null
  alcohol_100g: string | null
  created_at: string
}

export interface WineProductListResponse {
  data: {
    items: WineProductItem[]
    total: number
    page: number
    per_page: number
    pages: number
  }
  meta?: {
    page: number
    per_page: number
    total: number
  }
}

export interface ListWineProductsParams extends PaginationParams {
  search?: string
  brands?: string
  countries?: string
  category?: string
}

export const wineProductsApi = {
  list: (params: ListWineProductsParams = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    if (params.brands) q.set('brands', params.brands)
    if (params.countries) q.set('countries', params.countries)
    if (params.category) q.set('category', params.category)
    return apiRequest<WineProductListResponse>(`/wine-products/?${q}`)
  },

  get: (id: number) =>
    apiRequest<WineProductItem>(`/wine-products/${id}`),
}
