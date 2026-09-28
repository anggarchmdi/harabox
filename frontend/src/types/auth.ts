export type UserRole = 'super_admin' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role?: UserRole
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginRequest {
  email: string
  password: string
  device_name?: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: User
    token: string
  }
}

export interface CreateAdminUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
  is_active?: boolean
}

export interface UpdateAdminUserRequest {
  name?: string
  email?: string
  role?: UserRole
  is_active?: boolean
  password?: string
}

