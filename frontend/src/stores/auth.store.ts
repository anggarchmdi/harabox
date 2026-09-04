import { create } from 'zustand'
import type { User } from '../types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean

  login: (user: User, token: string, remember?: boolean) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  login: (user, token, remember = true) => {
    if (remember) {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_remember', 'true')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_remember')
    } else {
      sessionStorage.setItem('auth_token', token)
      sessionStorage.setItem('auth_user', JSON.stringify(user))
      sessionStorage.setItem('auth_remember', 'false')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_remember')
    }

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
    localStorage.removeItem('auth_remember')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_remember')

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  },

  hydrate: () => {
    // Check localStorage first (persistent session with "Remember Me"), then sessionStorage
    let token = localStorage.getItem('auth_token')
    let userStr = localStorage.getItem('auth_user')

    if (!token || !userStr) {
      token = sessionStorage.getItem('auth_token')
      userStr = sessionStorage.getItem('auth_user')
    }

    if (!token || !userStr) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isHydrated: true,
      })

      return
    }

    try {
      const parsedUser = JSON.parse(userStr) as User

      set({
        token,
        user: parsedUser,
        isAuthenticated: true,
        isHydrated: true,
      })
    } catch {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_remember')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_remember')

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      })
    }
  },
}))
