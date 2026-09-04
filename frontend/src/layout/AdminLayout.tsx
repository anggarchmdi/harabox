import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Boxes,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ShoppingCart,
  Tags,
  X,
} from 'lucide-react'

import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { dashboardService } from '../services/dashboard.service'
import LogoProfile from '../assets/hachi.webp'
import LogoImg from '../assets/Logo.webp'

interface MenuItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  badgeKey?: 'pending_orders' | 'active_products'
}

const mainMenus: MenuItem[] = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Pesanan Masuk',
    to: '/admin/orders',
    icon: ShoppingCart,
    badgeKey: 'pending_orders',
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
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

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
    if (path.startsWith('/admin/orders')) return 'Manajemen Pesanan'
    if (path === '/admin/products/create') return 'Tambah Menu Katering'
    if (path.includes('/admin/products/') && path.includes('/edit')) return 'Edit Menu Katering'
    if (path.startsWith('/admin/products')) return 'Katalog Produk Katering'
    if (path.startsWith('/admin/categories')) return 'Kategori Menu'
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
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 selection:bg-zinc-950 selection:text-white">
      {/* =====================================================
          DESKTOP SIDEBAR (EXPAND / COLLAPSE WITH SLIDE TRANSITION)
      ====================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 hidden flex-col border-r border-zinc-200/80 bg-white shadow-[1px_0_12px_rgba(0,0,0,0.02)] z-30 lg:flex transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Floating Expand/Collapse Toggle Button pada border kanan sidebar */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
          title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
          className="absolute -right-3.5 top-7 hidden lg:flex h-7 w-7 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 hover:scale-110 active:scale-95 transition-all z-40 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
        >
          <ChevronLeft
            size={14}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Brand / Logo Header */}
        <div
          className={`flex h-20 items-center border-b border-zinc-100 transition-all duration-300 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-6'
          }`}
        >
          {isCollapsed ? (
            <Link
              to="/admin"
              className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md transition hover:scale-105"
              title="Hara Chicken - Ke Dashboard"
            >
              <span className="font-extrabold text-sm tracking-tighter text-amber-400">H</span>
              <span className="font-extrabold text-sm tracking-tighter text-white">C</span>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                Hara Chicken Admin
              </div>
            </Link>
          ) : (
            <>
              <Link to="/admin" className="flex items-center gap-3">
                <img src={LogoImg} alt="Hara Chicken" className="w-28 object-contain" />
              </Link>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 text-[10px] font-black uppercase text-zinc-600">
                  Admin
                </span>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="Perkecil Sidebar"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Live Status Pill */}
        {isCollapsed ? (
          <div className="py-3.5 bg-zinc-50/60 border-b border-zinc-100 flex justify-center group relative cursor-help">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
              Sistem Katering Online (Aktif)
            </div>
          </div>
        ) : (
          <div className="px-6 py-3.5 bg-zinc-50/60 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-zinc-600">
                Sistem Katering Online
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {/* Main Menus */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-2 transition-opacity">
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
                      end={menu.to === '/admin'}
                      className={({ isActive }) =>
                        `group relative flex items-center rounded-2xl transition-all ${
                          isCollapsed
                            ? 'h-12 w-12 mx-auto justify-center'
                            : 'justify-between px-3.5 py-3 text-xs sm:text-sm font-bold'
                        } ${
                          isActive
                            ? 'bg-zinc-950 text-white shadow-md shadow-zinc-950/20'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`flex items-center ${isCollapsed ? 'justify-center relative' : 'gap-3'}`}>
                            <Icon
                              size={isCollapsed ? 20 : 18}
                              strokeWidth={isActive ? 2.5 : 2}
                              className={`transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'text-zinc-400 group-hover:text-zinc-900'
                              }`}
                            />

                            {!isCollapsed && <span>{menu.label}</span>}

                            {/* Collapsed Badge Dot / Number Counter */}
                            {isCollapsed && isPendingBadge && (
                              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                                {pendingOrdersCount}
                              </span>
                            )}
                          </div>

                          {/* Expanded Badges */}
                          {!isCollapsed && isPendingBadge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                isActive
                                  ? 'bg-amber-400 text-zinc-950'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse'
                              }`}
                            >
                              {pendingOrdersCount} baru
                            </span>
                          )}

                          {!isCollapsed && isActiveProductBadge && !isPendingBadge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isActive ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-400'
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
                      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white shadow-xl z-50 whitespace-nowrap">
                        <span>{menu.label}</span>
                        {isPendingBadge && (
                          <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-zinc-950">
                            {pendingOrdersCount} baru
                          </span>
                        )}
                        {isActiveProductBadge && !isPendingBadge && (
                          <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-300">
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

          {/* Divider in Collapsed Mode */}
          {isCollapsed ? (
            <div className="mx-auto my-2 h-px w-8 bg-zinc-200/60" />
          ) : null}

          {/* Quick External Links */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 mb-2">
                Akses Cepat Website
              </p>
            )}
            <div className="space-y-1">
              <div className="relative group">
                <Link
                  to="/menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center rounded-2xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition ${
                    isCollapsed
                      ? 'h-11 w-11 mx-auto justify-center'
                      : 'justify-between px-3.5 py-2.5'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Boxes size={isCollapsed ? 18 : 16} className="text-zinc-400 group-hover:text-zinc-900" />
                    {!isCollapsed && <span>Buka Menu Publik</span>}
                  </div>
                  {!isCollapsed && (
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                  )}
                </Link>

                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white shadow-xl z-50 whitespace-nowrap">
                    <span>Buka Menu Publik</span>
                    <ExternalLink size={12} className="text-zinc-400" />
                  </div>
                )}
              </div>

              <div className="relative group">
                <Link
                  to="/cara-pesan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center rounded-2xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition ${
                    isCollapsed
                      ? 'h-11 w-11 mx-auto justify-center'
                      : 'justify-between px-3.5 py-2.5'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <HelpCircle size={isCollapsed ? 18 : 16} className="text-zinc-400 group-hover:text-zinc-900" />
                    {!isCollapsed && <span>Panduan Cara Pesan</span>}
                  </div>
                  {!isCollapsed && (
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-zinc-900" />
                  )}
                </Link>

                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white shadow-xl z-50 whitespace-nowrap">
                    <span>Panduan Cara Pesan</span>
                    <ExternalLink size={12} className="text-zinc-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer / User Info */}
        <div className="border-t border-zinc-100 p-3 bg-white">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative group cursor-pointer">
                {/* <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden shadow-sm hover:ring-2 hover:ring-zinc-950/20 transition"> */}
                  {/* <img src={LogoProfile} alt="Admin" className="w-9 h-9 object-cover" /> */}
                {/* </div> */}
                {/* <div className="pointer-events-none absolute left-full bottom-0 ml-3 hidden group-hover:flex flex-col rounded-xl bg-zinc-900 px-3 py-2 text-xs text-white shadow-xl z-50 whitespace-nowrap">
                  <span className="font-bold">{user?.name || 'Administrator'}</span>
                  <span className="text-[10px] text-zinc-400">{user?.email || 'admin@harachicken.com'}</span>
                </div> */}
              </div>

              {/* <div className="relative group">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  aria-label="Logout Keluar"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut size={17} />
                </button>
                <div className="pointer-events-none absolute left-full bottom-0 ml-3 hidden group-hover:flex items-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xl z-50 whitespace-nowrap">
                  Logout Keluar
                </div>
              </div> */}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 bg-[#fafaf9] p-3 flex items-center justify-between">
              {/* <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
                  <img src={LogoProfile} alt="Admin" className="w-8 h-8 object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs text-zinc-900 truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {user?.email || 'admin@harachicken.com'}
                  </p>
                </div>
              </div> */}

              {/* <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                title="Logout"
                className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
              >
                <LogOut size={16} />
              </button> */}
            </div>
          )}
        </div>
      </aside>

      {/* =====================================================
          MOBILE DRAWER SIDEBAR
      ====================================================== */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="fixed inset-y-0 left-0 w-72 flex-col bg-white border-r border-zinc-200 shadow-2xl flex z-10 animate-slide-in">
            <div className="flex h-20 items-center justify-between border-b border-zinc-100 px-6">
              <img src={LogoImg} alt="HaraBox" className="w-28" />
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                Menu Utama
              </p>
              <nav className="space-y-1">
                {mainMenus.map((menu) => {
                  const Icon = menu.icon
                  return (
                    <NavLink
                      key={menu.to}
                      to={menu.to}
                      end={menu.to === '/admin'}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
                          isActive
                            ? 'bg-zinc-950 text-white shadow-md'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{menu.label}</span>
                      </div>
                    </NavLink>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-zinc-100">
                <Link
                  to="/menu"
                  target="_blank"
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl"
                >
                  <span>Buka Menu Publik</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            <div className="border-t border-zinc-100 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition"
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
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-zinc-200/80 bg-white/85 px-6 backdrop-blur-md sm:px-8">
          {/* Left: Mobile Toggle, Desktop Collapse Toggle & Dynamic Breadcrumb Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 lg:hidden cursor-pointer"
              aria-label="Buka Menu Sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Expand / Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 shadow-sm transition cursor-pointer"
              title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
              aria-label={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                <span>Hara Chicken</span>
                <span>/</span>
                <span className="text-zinc-600">Admin Control</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-950 tracking-tight">
                {pageTitle}
              </h2>
            </div>
          </div>

          {/* Right: Quick Alert Pills & Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Pending Orders Notification Pill */}
            {pendingOrdersCount > 0 && (
              <Link
                to="/admin/orders"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-extrabold text-amber-800 shadow-sm transition hover:bg-amber-100 animate-pulse"
                title="Pesanan baru yang menunggu konfirmasi"
              >
                <ShoppingCart size={13} />
                <span>{pendingOrdersCount} Pesanan Baru</span>
              </Link>
            )}

            {/* Quick Visit Website */}
            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <span>Website</span>
              <ExternalLink size={13} className="text-zinc-400" />
            </Link>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 fontinter bg-white p-1.5 pl-3 transition hover:bg-zinc-50 shadow-sm cursor-pointer"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-black text-zinc-950 truncate max-w-[120px]">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600">● Aktif</p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shadow-inner">
                  <img src={LogoProfile} className="h-7 w-7 object-cover" alt="Profile" />
                </div>

                <ChevronDown
                  size={14}
                  className={`text-zinc-400 transition-transform duration-200 mr-1 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Menu Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl animate-fade-in z-50">
                  <div className="border-b border-zinc-100 bg-[#fafaf9] px-4 py-3">
                    <p className="text-xs font-black text-zinc-950">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {user?.email || 'admin@harachicken.com'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5">
                      <ShieldCheck size={12} />
                      Hak Akses Super Admin
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      <LayoutDashboard size={15} className="text-zinc-400" />
                      <span>Dashboard Utama</span>
                    </Link>

                    <Link
                      to="/menu"
                      target="_blank"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      <ExternalLink size={15} className="text-zinc-400" />
                      <span>Lihat Menu Publik</span>
                    </Link>

                    <div className="my-1 border-t border-zinc-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loading}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>{loading ? 'Sedang Logout...' : 'Logout Keluar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}


