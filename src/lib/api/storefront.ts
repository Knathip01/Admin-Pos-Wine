import { apiRequest } from './client'
import type { PaginationParams } from './types'

export interface StorefrontWineDetail {
  type?: string | null
  country?: string | null
  region?: string | null
  alcohol?: string | null
  volume?: string | null
}

export interface StorefrontProduct {
  id: number
  sku: string
  name: string
  description?: string | null
  price: string | number
  unit?: string | null
  image_url?: string | null
  is_demo?: boolean
  wine?: StorefrontWineDetail | null
}

export interface StorefrontProductListResponse {
  items: StorefrontProduct[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface StorefrontListParams extends PaginationParams {
  type?: 'red' | 'white' | 'sparkling' | 'rose' | 'dessert' | string
  country?: string
  search?: string
  sort?: 'name' | 'price' | '-price' | string
}

export const storefrontApi = {
  // Public storefront products list (gated by STOREFRONT_CATALOG_ENABLED flag)
  listProducts: (params: StorefrontListParams = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.type) q.set('type', params.type)
    if (params.country) q.set('country', params.country)
    if (params.search) q.set('search', params.search)
    if (params.sort) q.set('sort', params.sort)
    return apiRequest<StorefrontProductListResponse>(`/storefront/products?${q}`)
  },

  // Public single storefront product
  getProduct: (productId: number) =>
    apiRequest<StorefrontProduct>(`/storefront/products/${productId}`),
}
