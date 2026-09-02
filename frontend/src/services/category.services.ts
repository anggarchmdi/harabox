import api from '../lib/api'
import type { Category } from '../types/category'

interface CategoryResponse {
  success: boolean
  message: string
  data: {
    data: Category[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export const categoryService = {
  async getAdminAll(page = 1): Promise<CategoryResponse['data']> {
    const response = await api.get<CategoryResponse>(
      `/admin/categories?page=${page}`,
    )

    return response.data.data
  },

  async getAdminById(id: number): Promise<Category> {
    const response = await api.get<{
      success: boolean
      message: string
      data: Category
    }>(`/admin/categories/${id}`)

    return response.data.data
  },

  async create(data: {
    name: string
    slug?: string
    description?: string
  }) {
    const response = await api.post('/admin/categories', data)

    return response.data
  },

  async update(
    id: number,
    data: {
      name?: string
      slug?: string
      description?: string | null
    },
  ) {
    const response = await api.put(
      `/admin/categories/${id}`,
      data,
    )

    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(
      `/admin/categories/${id}`,
    )

    return response.data
  },
}
