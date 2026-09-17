import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

import PageLoader from '../components/ui/PageLoader'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  )

  const isHydrated = useAuthStore(
    (state) => state.isHydrated,
  )

  const location = useLocation()

  // Jangan redirect sebelum auth selesai di-hydrate
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C0B09]">
        <PageLoader
          isLoading={true}
          text="Memverifikasi Sesi..."
          subtext="Mempersiapkan akses Pawon Hara Admin"
          minDuration={500}
        />
      </div>
    )
  }

  // Setelah hydrate selesai, baru cek authentication
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/hc-admin"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}
