import api from '../lib/api'
import type { Packages } from '../types/packages'

export const packageService = {
  async getAll(): Promise<Packages[]> {
    const response = await api.get('/packages')

    return response.data.data
  },

  async getBySlug(slug: string): Promise<Packages> {
    const response = await api.get(`/packages/${slug}`)

    return response.data.data
  },
}
