import api from '../lib/api'
import type { LoginRequest, LoginResponse } from '../types/auth'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      '/admin/login',
      credentials,
    )

    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/admin/logout')
  },

  async me(): Promise<LoginResponse['data']['user']> {
    const response = await api.get<{
      success: boolean
      message: string
      data: LoginResponse['data']['user']
    }>('/admin/me')

    return response.data.data
  },
}
