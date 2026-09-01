import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import LogoProfile from '../assets/hachi.webp'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import LogoImg from '../assets/Logo.webp'

const menus = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Orders',
    to: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Products',
    to: '/admin/products',
    icon: Package,
  },
  {
    label: 'Categories',
    to: '/admin/categories',
    icon: Tags,
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const [loading, setLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)

      await authService.logout()
    } catch {
      // Tetap logout dari frontend
    } finally {
      logout()

      toast.success('Logout berhasil')

      navigate('/hc-admin', {
        replace: true,
      })

      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white lg:flex lg:flex-col">

        {/* Logo */}
        <div className="flex h-20 items-center border-b border-gray-100 px-6">
          <img
            src={LogoImg}
            alt="HaraBox"
            className="w-28"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menus.map((menu) => {
            const Icon = menu.icon

            return (
              <NavLink
                key={menu.to}
                to={menu.to}
                end={menu.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} />
                <span>{menu.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-100 px-4 py-4">
          <p className="text-xs text-gray-400">
            HaraBox Admin
          </p>
          <p className="mt-1 text-xs text-gray-300">
            © 2026 HaraBox
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 bg-white/90 px-6 backdrop-blur sm:px-8">

          <div>
            <p className="text-sm text-gray-400">
              Admin Panel
            </p>

            <h2 className="font-semibold text-gray-900">
              HaraBox
            </h2>
          </div>

          {/* Admin profile */}
          <div className="relative">

            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  Admin
                </p>

                <p className="text-xs text-gray-400">
                  Administrator
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-red-600">
                <img src={LogoProfile} className='w-10' alt="" />
              </div>

              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  profileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

                {/* Profile */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Admin
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Administrator
                  </p>
                </div>

                {/* Profile */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-50"
                  onClick={() => setProfileOpen(false)}
                >
                  <User size={17} />
                  <span>Profile</span>
                </button>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut size={17} />

                  <span>
                    {loading
                      ? 'Logging out...'
                      : 'Logout'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6 sm:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
