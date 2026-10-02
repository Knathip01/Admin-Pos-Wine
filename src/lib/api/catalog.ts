import { apiRequest } from './client'
import type {
  CategoryCreate, CategoryUpdate, CategoryResponse,
  ProductCreate, ProductUpdate, ProductResponse,
  SupplierCreate, SupplierUpdate, SupplierResponse,
  SupplierProductCreate, SupplierProductUpdate, SupplierProductResponse,
  PaginationParams
} from './types'

interface ListProductsParams extends PaginationParams { search?: string; category_id?: number; is_active?: boolean }
interface ListSuppliersParams extends PaginationParams { search?: string }

export const catalogApi = {
  // Categories
  listCategories: (token?: string) =>
    apiRequest<CategoryResponse[]>('/catalog/categories', { token }),
  createCategory: (data: CategoryCreate, token?: string) =>
    apiRequest<CategoryResponse>('/catalog/categories', { method: 'POST', body: data, token }),
  updateCategory: (id: number, data: CategoryUpdate, token?: string) =>
    apiRequest<CategoryResponse>(`/catalog/categories/${id}`, { method: 'PUT', body: data, token }),
  deleteCategory: (id: number, token?: string) =>
    apiRequest<void>(`/catalog/categories/${id}`, { method: 'DELETE', token }),

  // Products
  listProducts: (params: ListProductsParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    if (params.category_id != null) q.set('category_id', String(params.category_id))
    if (params.is_active != null) q.set('is_active', String(params.is_active))
    return apiRequest<ProductResponse[]>(`/catalog/products?${q}`, { token })
  },
  createProduct: (data: ProductCreate, token?: string) =>
    apiRequest<ProductResponse>('/catalog/products', { method: 'POST', body: data, token }),
  getProduct: (id: number, token?: string) =>
    apiRequest<ProductResponse>(`/catalog/products/${id}`, { token }),
  updateProduct: (id: number, data: ProductUpdate, token?: string) =>
    apiRequest<ProductResponse>(`/catalog/products/${id}`, { method: 'PUT', body: data, token }),
  deleteProduct: (id: number, token?: string) =>
    apiRequest<void>(`/catalog/products/${id}`, { method: 'DELETE', token }),

  // Suppliers
  listSuppliers: (params: ListSuppliersParams = {}, token?: string) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.per_page) q.set('per_page', String(params.per_page))
    if (params.search) q.set('search', params.search)
    return apiRequest<SupplierResponse[]>(`/catalog/suppliers?${q}`, { token })
  },
  createSupplier: (data: SupplierCreate, token?: string) =>
    apiRequest<SupplierResponse>('/catalog/suppliers', { method: 'POST', body: data, token }),
  getSupplier: (id: number, token?: string) =>
    apiRequest<SupplierResponse>(`/catalog/suppliers/${id}`, { token }),
  updateSupplier: (id: number, data: SupplierUpdate, token?: string) =>
    apiRequest<SupplierResponse>(`/catalog/suppliers/${id}`, { method: 'PUT', body: data, token }),
  deleteSupplier: (id: number, token?: string) =>
    apiRequest<void>(`/catalog/suppliers/${id}`, { method: 'DELETE', token }),

  // Supplier Products
  listSupplierProducts: (supplierId: number, token?: string) =>
    apiRequest<SupplierProductResponse[]>(`/catalog/suppliers/${supplierId}/products`, { token }),
  createSupplierProduct: (supplierId: number, data: SupplierProductCreate, token?: string) =>
    apiRequest<SupplierProductResponse>(`/catalog/suppliers/${supplierId}/products`, { method: 'POST', body: data, token }),
  updateSupplierProduct: (supplierId: number, spId: number, data: SupplierProductUpdate, token?: string) =>
    apiRequest<SupplierProductResponse>(`/catalog/suppliers/${supplierId}/products/${spId}`, { method: 'PUT', body: data, token }),
  deleteSupplierProduct: (supplierId: number, spId: number, token?: string) =>
    apiRequest<void>(`/catalog/suppliers/${supplierId}/products/${spId}`, { method: 'DELETE', token }),
}
