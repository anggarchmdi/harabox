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

interface PublicProductListResponse {
  success: boolean
  message: string
  data: Product[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface ProductResponse {
  success: boolean
  message: string
  data: Product
}

interface AdminProductListResponse {
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
  // =====================================================
  // PUBLIC
  // =====================================================

  async getAll(): Promise<Product[]> {
    const response =
      await api.get<PublicProductListResponse>(
        '/products?per_page=50',
      )

    return response.data.data
  },

  async getBySlug(slug: string): Promise<Product> {
    const response =
      await api.get<ProductResponse>(
        `/products/${slug}`,
      )

    return response.data.data
  },

  // =====================================================
  // ADMIN
  // =====================================================

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

    if (
      filters.is_active !== null &&
      filters.is_active !== undefined
    ) {
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
      await api.get<AdminProductListResponse>(url)

    return response.data.data
  },

  async getAdminById(
    id: number,
  ): Promise<Product> {
    const response =
      await api.get<ProductResponse>(
        `/admin/products/${id}`,
      )

    return response.data.data
  },

  async create(
    data: CreateProductRequest,
  ): Promise<Product> {
    const formData = new FormData()

    formData.append(
      'category_id',
      String(data.category_id),
    )

    formData.append('name', data.name)

    if (data.description) {
      formData.append(
        'description',
        data.description,
      )
    }

    formData.append(
      'price',
      String(data.price),
    )

    formData.append(
      'minimum_order',
      String(data.minimum_order),
    )

    if (data.image) {
      formData.append('image', data.image)
    }

    formData.append(
      'is_active',
      data.is_active ? '1' : '0',
    )

    const response =
      await api.post<ProductResponse>(
        '/admin/products',
        formData,
      )

    return response.data.data
  },

  async update(
    id: number,
    data: UpdateProductRequest,
  ): Promise<Product> {
    const formData = new FormData()

    if (data.category_id !== undefined) {
      formData.append(
        'category_id',
        String(data.category_id),
      )
    }

    if (data.name !== undefined) {
      formData.append(
        'name',
        data.name,
      )
    }

    if (data.description !== undefined) {
      formData.append(
        'description',
        data.description,
      )
    }

    if (data.price !== undefined) {
      formData.append(
        'price',
        String(data.price),
      )
    }

    if (data.minimum_order !== undefined) {
      formData.append(
        'minimum_order',
        String(data.minimum_order),
      )
    }

    if (data.image) {
      formData.append(
        'image',
        data.image,
      )
    }

    if (data.is_active !== undefined) {
      formData.append(
        'is_active',
        data.is_active ? '1' : '0',
      )
    }

    formData.append('_method', 'PUT')

    const response =
      await api.post<ProductResponse>(
        `/admin/products/${id}`,
        formData,
      )

    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/products/${id}`)
  },
}
