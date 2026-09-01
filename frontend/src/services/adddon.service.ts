import api from '../lib/api'
import type { Addon } from '../types/addon'

export const addonService = {
  async getAll(): Promise<Addon[]> {
    const response = await api.get('/addons')

    return response.data.data
  },

  async getBySlug(slug: string): Promise<Addon> {
    const response = await api.get(`/addons/${slug}`)

    return response.data.data
  },
}
