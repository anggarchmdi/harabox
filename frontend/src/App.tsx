import { useEffect } from 'react'
import { useAuthStore } from './stores/auth.store'
import { useThemeStore } from './stores/theme.store'
import AppRoutes from './routes'
import ScrollToTop from './components/ui/ScrollToTop'

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const logout = useAuthStore((state) => state.logout)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)

  useEffect(() => {
    hydrate()
    hydrateTheme()

    const handleLogout = () => {
      logout()
    }

    window.addEventListener('admin:logout', handleLogout)

    return () => {
      window.removeEventListener('admin:logout', handleLogout)
    }
  }, [hydrate, hydrateTheme, logout])

  return (
    <>
      <ScrollToTop />
      <AppRoutes />
    </>
  )
}
