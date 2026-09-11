import api from '../lib/api'
import type { Addon } from '../types/addon'

export const addonService = {
  // Public
  async getAll(): Promise<Addon[]> {
    const response = await api.get('/addons')
    return response.data.data
  },

  async getBySlug(slug: string): Promise<Addon> {
    const response = await api.get(`/addons/${slug}`)
    return response.data.data
  },

  // Admin
  async getAdminAll(): Promise<Addon[]> {
    const response = await api.get<{
      success: boolean
      message: string
      data: Addon[]
    }>('/admin/addons?all=1')
    return response.data.data
  },

  async create(data: {
    addon_group_id?: number | null
    name: string
    price: number
    description?: string | null
    is_active?: boolean
  }): Promise<Addon> {
    const response = await api.post<{
      success: boolean
      message: string
      data: Addon
    }>('/admin/addons', data)
    return response.data.data
  },

  async update(
    id: number,
    data: Partial<{
      addon_group_id: number | null
      name: string
      price: number
      description: string | null
      is_active: boolean
    }>,
  ): Promise<Addon> {
    const response = await api.put<{
      success: boolean
      message: string
      data: Addon
    }>(`/admin/addons/${id}`, data)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/addons/${id}`)
  },
}
