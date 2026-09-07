import { useEffect } from 'react'
import { useAuthStore } from './stores/auth.store'
import AppRoutes from './routes'
import ScrollToTop from './components/ui/ScrollToTop'

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    hydrate()

    const handleLogout = () => {
      logout()
    }

    window.addEventListener('admin:logout', handleLogout)

    return () => {
      window.removeEventListener('admin:logout', handleLogout)
    }
  }, [hydrate, logout])

  return (
    <>
      <ScrollToTop />
      <AppRoutes />
    </>
  )
}
