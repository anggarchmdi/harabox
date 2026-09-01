import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-600" />

          <p className="mt-4 text-sm text-gray-500">
            Memuat...
          </p>
        </div>
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
