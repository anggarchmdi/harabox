import api from '../lib/api'
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '../types/products'

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await api.get('/products')

    return response.data.data
  },

  async getBySlug(slug: string): Promise<Product> {
    const response = await api.get(`/products/${slug}`)

    return response.data.data
  },

  async getAdminAll(): Promise<Product[]> {
    const response = await api.get('/admin/products')

    return response.data.data
  },

  async getAdminById(id: number): Promise<Product> {
    const response = await api.get(`/admin/products/${id}`)

    return response.data.data
  },

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await api.post('/admin/products', data)

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
