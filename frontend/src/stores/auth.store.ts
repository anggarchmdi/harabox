import { create } from 'zustand'
import type { User } from '../types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean

  login: (user: User, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  login: (user, token) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))

    set({
      user,
      token,
      isAuthenticated: true,
      isHydrated: true,
    })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  },

  hydrate: () => {
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('auth_user')

    if (!token || !user) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isHydrated: true,
      })

      return
    }

    try {
      const parsedUser = JSON.parse(user) as User

      set({
        token,
        user: parsedUser,
        isAuthenticated: true,
        isHydrated: true,
      })
    } catch {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      })
    }
  },
}))
