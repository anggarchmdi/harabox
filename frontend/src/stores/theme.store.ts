import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  hydrateTheme: () => void
}

const STORAGE_KEY = 'pawon_hara_theme'

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const body = document.body

  if (theme === 'dark') {
    root.classList.remove('light')
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
    root.style.backgroundColor = '#1C0B09'
    body.style.backgroundColor = '#1C0B09'
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
    root.style.backgroundColor = '#FBF7F2'
    body.style.backgroundColor = '#FBF7F2'
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  hydrateTheme: () => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialTheme: Theme = saved === 'light' || saved === 'dark' ? saved : 'dark'

    applyThemeToDom(initialTheme)
    set({ theme: initialTheme })
  },

  toggleTheme: () => {
    const nextTheme: Theme = get().theme === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    }
    applyThemeToDom(nextTheme)
    set({ theme: nextTheme })
  },

  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme)
    }
    applyThemeToDom(theme)
    set({ theme })
  },
}))
