import api from '../lib/api'
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '../types/products'

export interface ProductPagination {
  current_page: number
  data: Product[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

interface ProductListResponse {
  success: boolean
  message: string
  data: ProductPagination
}

export interface ProductFilters {
  page?: number
  search?: string
  category_id?: number
  is_active?: boolean | null
  per_page?: number
}

export const productService = {
  // PUBLIC
  async getAll(): Promise<Product[]> {
    const response = await api.get('/products')

    return response.data.data
  },

  async getBySlug(slug: string): Promise<Product> {
    const response = await api.get(`/products/${slug}`)

    return response.data.data
  },

  // ADMIN
  async getAdminAll(
    filters: ProductFilters = {},
  ): Promise<ProductPagination> {
    const params = new URLSearchParams()

    if (filters.page) {
      params.set('page', String(filters.page))
    }

    if (filters.search) {
      params.set('search', filters.search)
    }

    if (filters.category_id) {
      params.set(
        'category_id',
        String(filters.category_id),
      )
    }

    if (filters.is_active !== null &&
        filters.is_active !== undefined) {
      params.set(
        'is_active',
        filters.is_active ? '1' : '0',
      )
    }

    if (filters.per_page) {
      params.set(
        'per_page',
        String(filters.per_page),
      )
    }

    const queryString = params.toString()

    const url = queryString
      ? `/admin/products?${queryString}`
      : '/admin/products'

    const response =
      await api.get<ProductListResponse>(url)

    return response.data.data
  },

  async getAdminById(id: number): Promise<Product> {
    const response = await api.get(
      `/admin/products/${id}`,
    )

    return response.data.data
  },

  async create(
    data: CreateProductRequest,
  ): Promise<Product> {
    const response = await api.post(
      '/admin/products',
      data,
    )

    return response.data.data
  },

  async update(
    id: number,
    data: UpdateProductRequest,
  ): Promise<Product> {
    const response = await api.put(
      `/admin/products/${id}`,
      data,
    )

    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/products/${id}`)
  },
}
