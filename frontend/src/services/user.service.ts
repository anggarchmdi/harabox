import api from '../lib/api'
import type {
  User,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from '../types/auth'

export interface UserListParams {
  search?: string
  role?: string
  status?: string
}

export const userService = {
  async list(params?: UserListParams): Promise<User[]> {
    const response = await api.get<{
      success: boolean
      data: User[]
    }>('/admin/users', { params })
    return response.data.data
  },

  async create(data: CreateAdminUserRequest): Promise<User> {
    const response = await api.post<{
      success: boolean
      message: string
      data: User
    }>('/admin/users', data)
    return response.data.data
  },

  async get(id: number): Promise<User> {
    const response = await api.get<{
      success: boolean
      data: User
    }>(`/admin/users/${id}`)
    return response.data.data
  },

  async update(id: number, data: UpdateAdminUserRequest): Promise<User> {
    const response = await api.put<{
      success: boolean
      message: string
      data: User
    }>(`/admin/users/${id}`, data)
    return response.data.data
  },

  async toggleStatus(id: number): Promise<User> {
    const response = await api.patch<{
      success: boolean
      message: string
      data: User
    }>(`/admin/users/${id}/toggle-status`)
    return response.data.data
  },

  async resetPassword(id: number, password: string): Promise<string> {
    const response = await api.patch<{
      success: boolean
      message: string
    }>(`/admin/users/${id}/reset-password`, { password })
    return response.data.message
  },

  async delete(id: number): Promise<string> {
    const response = await api.delete<{
      success: boolean
      message: string
    }>(`/admin/users/${id}`)
    return response.data.message
  },
}
