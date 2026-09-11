import api from '../lib/api'
import type { AddonGroup } from '../types/addon'

export const addonGroupService = {
  async getAll(activeOnly = false): Promise<AddonGroup[]> {
    const response = await api.get<{
      success: boolean
      message: string
      data: AddonGroup[]
    }>(`/admin/addon-groups${activeOnly ? '?active_only=1' : ''}`)

    return response.data.data
  },

  async getById(id: number): Promise<AddonGroup> {
    const response = await api.get<{
      success: boolean
      message: string
      data: AddonGroup
    }>(`/admin/addon-groups/${id}`)

    return response.data.data
  },

  async create(data: {
    name: string
    description?: string | null
    is_required?: boolean
    min_selection: number
    max_selection: number
    is_active?: boolean
  }): Promise<AddonGroup> {
    const response = await api.post<{
      success: boolean
      message: string
      data: AddonGroup
    }>('/admin/addon-groups', data)

    return response.data.data
  },

  async update(
    id: number,
    data: Partial<{
      name: string
      description: string | null
      is_required: boolean
      min_selection: number
      max_selection: number
      is_active: boolean
    }>,
  ): Promise<AddonGroup> {
    const response = await api.put<{
      success: boolean
      message: string
      data: AddonGroup
    }>(`/admin/addon-groups/${id}`, data)

    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/admin/addon-groups/${id}`)
  },
}
