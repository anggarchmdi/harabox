import { create } from 'zustand'
import AOS from 'aos'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  isSwitching: boolean
  targetTheme: Theme | null
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  hydrateTheme: () => void
  finishSwitching: () => void
}

const STORAGE_KEY = 'pawon_hara_theme'

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const body = document.body

  if (theme === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
    root.style.backgroundColor = '#FBF7F2'
    body.style.backgroundColor = '#FBF7F2'
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
    root.style.backgroundColor = '#1C0B09'
    body.style.backgroundColor = '#1C0B09'
  }
}

function refreshAOS() {
  if (typeof window === 'undefined') return
  try {
    AOS.refreshHard()
    AOS.refresh()
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
  } catch {
    window.dispatchEvent(new Event('scroll'))
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  isSwitching: false,
  targetTheme: null,

  hydrateTheme: () => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialTheme: Theme = saved === 'light' || saved === 'dark' ? saved : 'light'

    applyThemeToDom(initialTheme)
    set({ theme: initialTheme })
    setTimeout(refreshAOS, 200)
  },

  toggleTheme: () => {
    if (get().isSwitching) return
    const currentTheme = get().theme
    const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'

    // 1. Show switching loader with the upcoming target theme
    set({ isSwitching: true, targetTheme: nextTheme })

    // 2. Switch theme in DOM and persist under the loader
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, nextTheme)
      }
      applyThemeToDom(nextTheme)
      set({ theme: nextTheme })
      refreshAOS()
    }, 180)

    // 3. Keep loader up smoothly, then end switching so loader fades out
    setTimeout(() => {
      set({ isSwitching: false, targetTheme: null })
      refreshAOS()
      // Safety refresh after fade-out transition completes
      setTimeout(refreshAOS, 350)
    }, 650)
  },

  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme)
    }
    applyThemeToDom(theme)
    set({ theme })
    setTimeout(refreshAOS, 100)
  },

  finishSwitching: () => {
    set({ isSwitching: false, targetTheme: null })
    refreshAOS()
  },
}))
