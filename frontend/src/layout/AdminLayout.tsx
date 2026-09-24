import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Boxes,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Moon,
  Package,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  Tags,
  X,
} from 'lucide-react'

import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { useThemeStore } from '../stores/theme.store'
import { dashboardService } from '../services/dashboard.service'
import LogoProfile from '../assets/hachi.webp'

interface MenuItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  badgeKey?: 'pending_orders' | 'active_products'
  end?: boolean
}

const mainMenus: MenuItem[] = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Pesanan Masuk',
    to: '/admin/orders',
    icon: ShoppingCart,
    badgeKey: 'pending_orders',
    end: true,
  },
  {
    label: 'Rekap Pesanan',
    to: '/admin/orders/recap',
    icon: FileSpreadsheet,
    end: true,
  },
  {
    label: 'Katalog Produk',
    to: '/admin/products',
    icon: Package,
    badgeKey: 'active_products',
  },
  {
    label: 'Kategori Menu',
    to: '/admin/categories',
    icon: Tags,
  },
  {
    label: 'Testimoni Pelanggan',
    to: '/admin/testimonials',
    icon: MessageSquareQuote,
  },
  {
    label: 'Kapasitas & Pengaturan',
    to: '/admin/settings',
    icon: SlidersHorizontal,
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // State untuk expand / collapse desktop sidebar dengan persistence localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true'
    }
    return false
  })

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin_sidebar_collapsed', String(next))
      return next
    })
  }

  // Polling data dashboard untuk monitoring badge di sidebar & navbar
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.get,
    refetchInterval: 30_000,
  })

  const pendingOrdersCount = dashboardData?.summary?.pending_orders ?? 0
  const activeProductsCount = dashboardData?.summary?.active_products ?? 0

  // Tutup mobile drawer saat berpindah halaman
  useEffect(() => {
    setMobileSidebarOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  // Deteksi judul halaman aktif
  const pageTitle = useMemo(() => {
    const path = location.pathname
    if (path === '/admin') return 'Dashboard Monitoring'
    if (path.startsWith('/admin/orders/recap')) return 'Rekapitulasi Data Pesanan'
    if (path.startsWith('/admin/orders')) return 'Manajemen Pesanan'
    if (path === '/admin/products/create') return 'Tambah Menu Katering'
    if (path.includes('/admin/products/') && path.includes('/edit')) return 'Edit Menu Katering'
    if (path.startsWith('/admin/products')) return 'Katalog Produk Katering'
    if (path.startsWith('/admin/categories')) return 'Kategori Menu'
    if (path.startsWith('/admin/addons')) return 'Kelola Add-on & Kustomisasi'
    if (path.startsWith('/admin/testimonials')) return 'Manajemen Testimoni & Ulasan'
    return 'Admin Panel'
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      setLoading(true)
      await authService.logout()
    } catch {
      // Tetap logout dari frontend jika network error
    } finally {
      logout()
      toast.success('Berhasil logout dari panel admin.')
      navigate('/hc-admin', { replace: true })
      setLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-clip font-sans transition-colors duration-300 ${
        isDark
          ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
          : 'bg-[#FBF7F2] text-stone-900 selection:bg-[#F59E0B] selection:text-[#2B120E]'
      }`}
    >
      {/* =====================================================
          DESKTOP SIDEBAR (EXPAND / COLLAPSE)
      ====================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 hidden flex-col border-r z-30 lg:flex transition-all duration-300 ease-in-out ${
          isDark
            ? 'border-[#60241E]/80 bg-[#240E0C] shadow-[1px_0_16px_rgba(0,0,0,0.4)]'
            : 'border-stone-200/80 bg-white shadow-[1px_0_12px_rgba(0,0,0,0.02)]'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Floating Expand/Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
          title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
          className={`absolute -right-3.5 top-7 hidden lg:flex h-7 w-7 items-center justify-center rounded-full border shadow-xs transition-all z-40 focus:outline-none cursor-pointer ${
            isDark
              ? 'bg-[#2D120F] border-[#60241E] text-stone-300 hover:text-white hover:bg-[#381612] focus:ring-2 focus:ring-[#F59E0B]/30'
              : 'bg-white border-stone-200 text-stone-500 hover:text-stone-950 hover:bg-stone-50 focus:ring-2 focus:ring-red-500/20'
          }`}
        >
          <ChevronLeft
            size={14}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Brand / Logo Header */}
        <div
          className={`flex h-20 items-center border-b transition-all duration-300 ${
            isDark ? 'border-[#60241E]/60' : 'border-stone-100'
          } ${isCollapsed ? 'justify-center px-2' : 'justify-between px-6'}`}
        >
          {isCollapsed ? (
            <Link
              to="/admin"
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#60241E] via-[#95271D] to-[#E77B49] text-amber-300 shadow-md ring-2 ring-[#F59E0B]/30 transition hover:scale-105"
              title="Pawon Hara Admin"
            >
              <span className="font-dhaksinarga text-base font-bold tracking-wider">PH</span>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                Pawon Hara Admin
              </div>
            </Link>
          ) : (
            <>
              <Link to="/admin" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#60241E] via-[#95271D] to-[#E77B49] text-amber-300 shadow-md ring-2 ring-[#F59E0B]/30">
                  <span className="font-dhaksinarga text-base font-bold tracking-wider">PH</span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-dhaksinarga tracking-wide text-xl font-bold leading-none ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    Pawon Hara
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mt-0.5">
                    Admin Panel
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-[#1C0B09] border border-[#60241E] text-amber-300'
                      : 'bg-stone-100 border border-stone-200/80 text-stone-600'
                  }`}
                >
                  Admin
                </span>
              </div>
            </>
          )}
        </div>

        {/* Live Status Pill */}
        {isCollapsed ? (
          <div
            className={`py-3 border-b flex justify-center group relative cursor-help ${
              isDark ? 'bg-[#1C0B09]/40 border-[#60241E]/50' : 'bg-stone-50/60 border-stone-100'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
              Sistem Katering Online
            </div>
          </div>
        ) : (
          <div
            className={`px-6 py-3 border-b ${
              isDark ? 'bg-[#1C0B09]/40 border-[#60241E]/50' : 'bg-stone-50/60 border-stone-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                Sistem Katering Online (Aktif)
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {/* Main Menus */}
          <div>
            {!isCollapsed && (
              <p
                className={`px-3 text-[10px] font-bold uppercase tracking-[0.18em] mb-2 ${
                  isDark ? 'text-amber-200/50' : 'text-stone-400'
                }`}
              >
                Menu Utama
              </p>
            )}

            <nav className="space-y-1">
              {mainMenus.map((menu) => {
                const Icon = menu.icon
                const isPendingBadge = menu.badgeKey === 'pending_orders' && pendingOrdersCount > 0
                const isActiveProductBadge = menu.badgeKey === 'active_products' && activeProductsCount > 0

                return (
                  <div key={menu.to} className="relative group">
                    <NavLink
                      to={menu.to}
                      end={menu.end ?? menu.to === '/admin'}
                      className={({ isActive }) =>
                        `group relative flex items-center rounded-xl transition-all ${
                          isCollapsed
                            ? 'h-11 w-11 mx-auto justify-center'
                            : 'justify-between px-3.5 py-2.5 text-xs sm:text-sm font-semibold'
                        } ${
                          isActive
                            ? isDark
                              ? 'bg-gradient-to-r from-[#95271D] to-[#60241E] text-white shadow-md border border-[#F59E0B]/30'
                              : 'bg-stone-900 text-white shadow-xs'
                            : isDark
                              ? 'text-stone-300 hover:bg-[#2D120F] hover:text-white'
                              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`flex items-center ${isCollapsed ? 'justify-center relative' : 'gap-3'}`}>
                            <Icon
                              size={isCollapsed ? 19 : 17}
                              strokeWidth={isActive ? 2.2 : 1.8}
                              className={`transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : isDark
                                    ? 'text-amber-200/50 group-hover:text-amber-300'
                                    : 'text-stone-400 group-hover:text-stone-900'
                              }`}
                            />

                            {!isCollapsed && <span>{menu.label}</span>}

                            {/* Collapsed Badge Dot / Number Counter */}
                            {isCollapsed && isPendingBadge && (
                              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                {pendingOrdersCount}
                              </span>
                            )}
                          </div>

                          {/* Expanded Badges */}
                          {!isCollapsed && isPendingBadge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? 'bg-amber-400 text-stone-950'
                                  : isDark
                                    ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {pendingOrdersCount} baru
                            </span>
                          )}

                          {!isCollapsed && isActiveProductBadge && !isPendingBadge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isActive
                                  ? 'bg-white/20 text-stone-100'
                                  : isDark
                                    ? 'text-stone-400'
                                    : 'text-stone-400'
                              }`}
                            >
                              {activeProductsCount} menu
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>

                    {/* Floating Tooltip saat Collapsed */}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                        <span>{menu.label}</span>
                        {isPendingBadge && (
                          <span className="rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                            {pendingOrdersCount} baru
                          </span>
                        )}
                        {isActiveProductBadge && !isPendingBadge && (
                          <span className="rounded-full bg-stone-800 px-1.5 py-0.2 text-[10px] font-medium text-stone-300">
                            {activeProductsCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Quick External Links */}
          <div>
            {!isCollapsed && (
              <p
                className={`px-3 text-[10px] font-bold uppercase tracking-[0.18em] mb-2 ${
                  isDark ? 'text-amber-200/50' : 'text-stone-400'
                }`}
              >
                Akses Publik
              </p>
            )}
            <div className="space-y-1">
              <div className="relative group">
                <Link
                  to="/menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center rounded-xl text-xs font-medium transition ${
                    isCollapsed
                      ? 'h-10 w-10 mx-auto justify-center'
                      : 'justify-between px-3.5 py-2'
                  } ${
                    isDark
                      ? 'text-stone-300 hover:bg-[#2D120F] hover:text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Boxes
                      size={isCollapsed ? 17 : 16}
                      className={isDark ? 'text-amber-200/50 group-hover:text-amber-300' : 'text-stone-400 group-hover:text-stone-900'}
                    />
                    {!isCollapsed && <span>Buka Menu Publik</span>}
                  </div>
                  {!isCollapsed && (
                    <ExternalLink
                      size={13}
                      className={isDark ? 'text-amber-200/50 group-hover:text-amber-300' : 'text-stone-400 group-hover:text-stone-900'}
                    />
                  )}
                </Link>

                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                    <span>Buka Menu Publik</span>
                    <ExternalLink size={12} className="text-stone-400" />
                  </div>
                )}
              </div>

              <div className="relative group">
                <Link
                  to="/cara-pesan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center rounded-xl text-xs font-medium transition ${
                    isCollapsed
                      ? 'h-10 w-10 mx-auto justify-center'
                      : 'justify-between px-3.5 py-2'
                  } ${
                    isDark
                      ? 'text-stone-300 hover:bg-[#2D120F] hover:text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <HelpCircle
                      size={isCollapsed ? 17 : 16}
                      className={isDark ? 'text-amber-200/50 group-hover:text-amber-300' : 'text-stone-400 group-hover:text-stone-900'}
                    />
                    {!isCollapsed && <span>Panduan Cara Pesan</span>}
                  </div>
                  {!isCollapsed && (
                    <ExternalLink
                      size={13}
                      className={isDark ? 'text-amber-200/50 group-hover:text-amber-300' : 'text-stone-400 group-hover:text-stone-900'}
                    />
                  )}
                </Link>

                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                    <span>Panduan Cara Pesan</span>
                    <ExternalLink size={12} className="text-stone-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE DRAWER SIDEBAR
      ====================================================== */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <aside
            className={`fixed inset-y-0 left-0 w-72 flex-col border-r shadow-2xl flex z-10 ${
              isDark ? 'bg-[#240E0C] border-[#60241E] text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div
              className={`flex h-20 items-center justify-between border-b px-6 ${
                isDark ? 'border-[#60241E]/60' : 'border-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#60241E] via-[#95271D] to-[#E77B49] text-amber-300 shadow-md ring-2 ring-[#F59E0B]/30">
                  <span className="font-dhaksinarga text-base font-bold tracking-wider">PH</span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-dhaksinarga tracking-wide text-xl font-bold leading-none ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    Pawon Hara
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mt-0.5">
                    Admin Panel
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className={`rounded-lg p-2 transition ${
                  isDark
                    ? 'text-stone-400 hover:bg-[#2D120F] hover:text-stone-200'
                    : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
                }`}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
              <p
                className={`px-3 text-[10px] font-bold uppercase tracking-[0.18em] ${
                  isDark ? 'text-amber-200/50' : 'text-stone-400'
                }`}
              >
                Menu Utama
              </p>
              <nav className="space-y-1">
                {mainMenus.map((menu) => {
                  const Icon = menu.icon
                  const isPendingBadge = menu.badgeKey === 'pending_orders' && pendingOrdersCount > 0

                  return (
                    <NavLink
                      key={menu.to}
                      to={menu.to}
                      end={menu.end ?? menu.to === '/admin'}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                          isActive
                            ? isDark
                              ? 'bg-gradient-to-r from-[#95271D] to-[#60241E] text-white shadow-md border border-[#F59E0B]/30'
                              : 'bg-stone-900 text-white shadow-xs'
                            : isDark
                              ? 'text-stone-300 hover:bg-[#2D120F] hover:text-white'
                              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{menu.label}</span>
                      </div>

                      {isPendingBadge && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              <div
                className={`pt-4 border-t space-y-2 ${
                  isDark ? 'border-[#60241E]/60' : 'border-stone-100'
                }`}
              >
                {/* Mobile Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-amber-300 hover:bg-[#2D120F]'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun size={15} className="text-[#F59E0B]" /> : <Moon size={15} className="text-[#D97706]" />}
                    <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                    {isDark ? 'Gelap' : 'Terang'}
                  </span>
                </button>

                <Link
                  to="/menu"
                  target="_blank"
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl ${
                    isDark ? 'text-stone-300 hover:bg-[#2D120F]' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>Buka Menu Publik</span>
                  <ExternalLink size={14} />
                </Link>
                <Link
                  to="/cara-pesan"
                  target="_blank"
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl ${
                    isDark ? 'text-stone-300 hover:bg-[#2D120F]' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>Panduan Cara Pesan</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            <div
              className={`border-t p-4 ${
                isDark ? 'border-[#60241E]/60' : 'border-stone-100'
              }`}
            >
              <button
                type="button"
                onClick={handleLogout}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  isDark
                    ? 'bg-[#1C0B09] border border-[#60241E] text-red-400 hover:bg-red-950/30'
                    : 'bg-stone-100 text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={16} />
                <span>Logout Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          MAIN CONTENT AREA (WITH SMOOTH OFFSET FOR FIXED SIDEBAR)
      ====================================================== */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* =====================================================
            TOP NAVBAR (STICKY BLUR HEADER)
        ====================================================== */}
        <header
          className={`sticky top-0 z-20 flex h-20 items-center justify-between border-b px-4 backdrop-blur-md sm:px-8 transition-colors duration-300 ${
            isDark
              ? 'border-[#60241E]/80 bg-[#1C0B09]/90 text-white'
              : 'border-stone-200/80 bg-white/90 text-stone-900'
          }`}
        >
          {/* Left: Mobile Toggle, Desktop Collapse Toggle & Dynamic Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden cursor-pointer ${
                isDark
                  ? 'border-[#60241E] text-stone-200 hover:bg-[#240E0C]'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              aria-label="Buka Menu Sidebar"
            >
              <Menu size={18} />
            </button>
            <div>
              <div
                className={`flex items-center gap-1.5 text-[11px] font-medium ${
                  isDark ? 'text-amber-200/50' : 'text-stone-400'
                }`}
              >
                <span>Pawon Hara</span>
                <span>/</span>
                <span className={isDark ? 'text-amber-200/70' : 'text-stone-600'}>
                  Admin Control
                </span>
              </div>
              <h2
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                {pageTitle}
              </h2>
            </div>
          </div>

          {/* Right: Quick Alert Pills, Theme Switcher & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pending Orders Notification Pill */}
            {pendingOrdersCount > 0 && (
              <Link
                to="/admin/orders"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs transition ${
                  isDark
                    ? 'border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/50'
                    : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                title="Pesanan baru yang menunggu konfirmasi"
              >
                <ShoppingCart size={13} />
                <span>{pendingOrdersCount} Pesanan Baru</span>
              </Link>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              title={isDark ? 'Mode Terang (Coklat Terang)' : 'Mode Gelap (Coklat Tua)'}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs ${
                isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-[#F59E0B] hover:border-[#F59E0B] hover:bg-[#2D120F]'
                  : 'border-stone-200 bg-white text-[#D97706] hover:border-[#D97706] hover:bg-[#FAF0E4]'
              }`}
            >
              <span className="transition-transform duration-300 group-hover:rotate-45">
                {isDark ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
              </span>
            </button>

            {/* Quick Visit Website */}
            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs transition ${
                isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>Website</span>
              <ExternalLink size={13} className={isDark ? 'text-amber-200/50' : 'text-stone-400'} />
            </Link>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 rounded-xl border p-1.5 pl-3 transition shadow-2xs cursor-pointer ${
                  isDark
                    ? 'border-[#60241E] bg-[#240E0C] hover:bg-[#2D120F]'
                    : 'border-stone-200/80 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="hidden text-right sm:block">
                  <p
                    className={`text-xs font-bold truncate max-w-[130px] ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}
                  >
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] font-medium text-emerald-500">Online</p>
                </div>

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border overflow-hidden ${
                    isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-stone-100 border-stone-200'
                  }`}
                >
                  <img src={LogoProfile} className="h-6 w-6 object-cover" alt="Profile" />
                </div>

                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 mr-1 ${
                    isDark ? 'text-stone-400' : 'text-stone-400'
                  } ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Profile Menu Dropdown */}
              {profileOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                    isDark
                      ? 'border-[#60241E] bg-[#240E0C] text-white shadow-black/60'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <div
                    className={`border-b px-4 py-3 ${
                      isDark ? 'border-[#60241E]/60 bg-[#1C0B09]' : 'border-stone-100 bg-stone-50/80'
                    }`}
                  >
                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-stone-950'}`}>
                      {user?.name || 'Administrator'}
                    </p>
                    <p className={`text-[11px] truncate ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>
                      {user?.email || 'admin@harabox.com'}
                    </p>
                    <div
                      className={`mt-2 flex items-center gap-1.5 text-[10px] font-semibold rounded-md px-2 py-0.5 ${
                        isDark
                          ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/50'
                          : 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                      }`}
                    >
                      <ShieldCheck size={12} />
                      <span>Hak Akses Super Admin</span>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isDark
                          ? 'text-stone-200 hover:bg-[#2D120F] hover:text-white'
                          : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                      }`}
                    >
                      <LayoutDashboard size={14} className={isDark ? 'text-stone-400' : 'text-stone-400'} />
                      <span>Dashboard Utama</span>
                    </Link>

                    <Link
                      to="/menu"
                      target="_blank"
                      onClick={() => setProfileOpen(false)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isDark
                          ? 'text-stone-200 hover:bg-[#2D120F] hover:text-white'
                          : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                      }`}
                    >
                      <ExternalLink size={14} className={isDark ? 'text-stone-400' : 'text-stone-400'} />
                      <span>Lihat Menu Publik</span>
                    </Link>

                    <div
                      className={`my-1 border-t ${
                        isDark ? 'border-[#60241E]/60' : 'border-stone-100'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loading}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition disabled:opacity-50 cursor-pointer ${
                        isDark ? 'hover:bg-red-950/30' : 'hover:bg-red-50'
                      }`}
                    >
                      <LogOut size={14} />
                      <span>{loading ? 'Sedang Logout...' : 'Logout Keluar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="w-full max-w-full overflow-x-clip">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
