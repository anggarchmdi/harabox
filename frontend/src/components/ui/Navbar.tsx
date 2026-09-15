import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Menu,
  ShoppingCart,
  X,
} from 'lucide-react'

import LogoImg from '../../assets/Logo.webp'
import { useCartStore } from '../../stores/cart.store'

const navItems = [
  {
    label: 'Home',
    to: '/',
  },
  {
    label: 'Menu',
    to: '/menu',
  },
  {
    label: 'Tentang Kami',
    to: '/tentang-kami',
  },
  {
    label: 'Cara Pesan',
    to: '/cara-pesan',
  },
]

export default function Navbar() {
  const location = useLocation()
  const totalCartItems = useCartStore((state) => state.items.length)

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isHome = location.pathname === '/'
  const isCartPage = location.pathname === '/cart'
  const solidNavbar = !isHome || scrolled

  useEffect(() => {
    if (!isHome) {
      setScrolled(false)
      return
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* =========================
          NAVBAR
      ========================== */}
      <header
        className={`
          fixed inset-x-0 top-0 z-50
          transition-all duration-300
          ${
            solidNavbar
            ? 'bg-white shadow-md fontpoppins duration-300'
            : 'bg-transparent'
          }
        `}
      >
        <div
          className={`
            mx-auto flex h-20 max-w-7xl items-center
            justify-between px-5
            transition-all
            lg:px-8
            ${solidNavbar ? 'h-[72px]' : 'h-20'}
          `}
        >
          {/* =========================
              LOGO
          ========================== */}
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="relative z-50 shrink-0"
          >
            <img
              src={LogoImg}
              alt="Hara Chicken"
              className="
                w-32
                object-contain
                transition-all duration-300
                hover:scale-[1.03]
                sm:w-36
              "
            />
          </Link>

          {/* =========================
              DESKTOP NAVIGATION
          ========================== */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `
                  group relative py-2
                  text-sm font-medium
                  transition-colors duration-300

                  ${
                    isActive
                    ? 'text-red-500'
                    : solidNavbar
                      ? 'text-gray-800 hover:text-red-500'
                      : 'text-gray-900 hover:text-red-500'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {item.label}

                    {/* Active underline */}
                    <span
                      className={`
                        absolute
                        -bottom-0.5
                        left-1/2
                        h-[2px]
                        -translate-x-1/2
                        rounded-full
                        bg-red-500
                        transition-all duration-300 ease-out
                        ${
                            isActive
                          ? 'w-full opacity-100'
                          : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                        }
                      `}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* =========================
              DESKTOP ACTIONS (CART + CTA)
          ========================== */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/cart"
              className={`
                group relative flex h-11 w-11 items-center justify-center rounded-full
                border transition-all duration-300
                ${
                  isCartPage
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                    : solidNavbar
                      ? 'border-zinc-300/90 bg-white text-zinc-900 shadow-xs hover:border-zinc-950 hover:bg-zinc-950 hover:text-white hover:shadow-md'
                      : 'border-white/80 bg-white text-zinc-900 shadow-md hover:border-zinc-950 hover:bg-zinc-950 hover:text-white'
                }
              `}
              aria-label={`Buka Keranjang (${totalCartItems} menu)`}
            >
              <ShoppingCart size={20} strokeWidth={2.2} className="transition-transform group-hover:scale-110" />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white shadow-md ring-2 ring-white">
                {totalCartItems}
              </span>
            </Link>

            {!isCartPage && (
              <Link
                to="/menu#menu-list"
                className="
                  group flex items-center gap-2
                  rounded-full
                  bg-red-500
                  px-5 py-2.5
                  text-sm font-semibold text-white
                  shadow-sm shadow-red-500/20
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:bg-red-600
                  hover:shadow-lg hover:shadow-red-500/20
                "
              >
                Pesan Sekarang

                <ArrowUpRight
                  size={16}
                  className="
                    transition-transform duration-300
                    group-hover:translate-x-0.5
                    group-hover:-translate-y-0.5
                  "
                />
              </Link>
            )}
          </div>

          {/* =========================
              MOBILE ACTIONS (CART + MENU BUTTON)
          ========================== */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className={`
                relative z-50
                flex h-11 w-11
                items-center justify-center
                rounded-full border
                transition-all duration-300
                ${
                  isCartPage
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                    : solidNavbar
                      ? 'border-zinc-300/90 bg-white text-zinc-900 shadow-xs hover:bg-zinc-100'
                      : 'border-white/80 bg-white text-zinc-900 shadow-md'
                }
              `}
              aria-label={`Buka Keranjang (${totalCartItems} menu)`}
            >
              <ShoppingCart size={20} strokeWidth={2.2} />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white shadow-md ring-2 ring-white">
                {totalCartItems}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className={`
                relative z-50
                flex h-11 w-11
                items-center justify-center
                rounded-full
                transition-all duration-300

                ${mobileOpen
                  ? 'bg-gray-100 text-gray-900'
                  : solidNavbar
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : 'bg-white text-gray-900 shadow-sm'
                }
              `}
              aria-label={
                mobileOpen
                  ? 'Tutup menu navigasi'
                  : 'Buka menu navigasi'
              }
              aria-expanded={mobileOpen}
            >
              <span
                className={`
                  transition-all duration-300
                  ${mobileOpen ? 'rotate-90' : 'rotate-0'}
                `}
              >
                {mobileOpen ? (
                  <X size={21} strokeWidth={2} />
                ) : (
                  <Menu size={21} strokeWidth={2} />
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          MOBILE NAVIGATION
      ========================== */}
      <div
        className={`
          fixed inset-0 z-40
          bg-white
          transition-all duration-500
          lg:hidden

          ${
            mobileOpen
            ? 'visible opacity-100'
            : 'invisible opacity-0 pointer-events-none'
          }
        `}
      >
        <div className="flex min-h-full flex-col px-6 pb-8 pt-28">

          {/* Small heading */}
          <div
            className={`
              mb-8
              transition-all duration-500
              ${
                mobileOpen
                ? 'translate-y-0 opacity-100'
                : '-translate-y-3 opacity-0'
              }
            `}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Navigasi
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Jelajahi Hara Chicken
            </p>
          </div>

          {/* Mobile menu */}
          <nav className="flex flex-col">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  group relative
                  border-b border-gray-100
                  py-5
                  transition-all duration-500

                  ${
                    mobileOpen
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-5 opacity-0'
                  }

                  ${
                    isActive
                    ? 'text-red-500'
                    : 'text-gray-900'
                  }
                `}
                style={{
                  transitionDelay: mobileOpen
                    ? `${index * 70 + 100}ms`
                    : '0ms',
                }}
              >
                {({ isActive }) => (
                  <div className="flex items-center justify-between">
                    <span
                      className={`
                        text-2xl
                        transition-all duration-300
                        ${
                            isActive
                          ? 'font-bold'
                          : 'font-medium group-hover:translate-x-1'
                        }
                      `}
                    >
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    <span
                      className={`
                        h-2 w-2
                        rounded-full
                        bg-red-500
                        transition-all duration-300
                        ${
                            isActive
                          ? 'scale-100 opacity-100'
                          : 'scale-0 opacity-0'
                        }
                      `}
                    />
                  </div>
                )}
              </NavLink>
            ))}

            <NavLink
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                group relative
                border-b border-gray-100
                py-5
                transition-all duration-500
                ${
                  mobileOpen
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-5 opacity-0'
                }
                ${
                  isActive
                  ? 'text-red-500'
                  : 'text-gray-900'
                }
              `}
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={22} className={isActive ? 'text-red-500' : 'text-gray-700'} />
                    <span
                      className={`
                        text-2xl
                        transition-all duration-300
                        ${
                            isActive
                          ? 'font-bold'
                          : 'font-medium group-hover:translate-x-1'
                        }
                      `}
                    >
                      Keranjang
                    </span>
                  </div>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-black text-white shadow-sm">
                    {totalCartItems} menu
                  </span>
                </div>
              )}
            </NavLink>
          </nav>

          {/* =========================
              MOBILE CTA
          ========================== */}
          {!isCartPage && (
            <div
              className={`
                mt-auto pt-10
                transition-all duration-500
                ${
                  mobileOpen
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-5 opacity-0'
                }
              `}
              style={{
                transitionDelay: mobileOpen ? '380ms' : '0ms',
              }}
            >
              <Link
                to="/menu#menu-list"
                onClick={() => setMobileOpen(false)}
                className="
                  group flex w-full
                  items-center justify-between
                  rounded-2xl
                  bg-red-500
                  px-5 py-4
                  text-white
                  shadow-lg shadow-red-500/20
                  transition-all duration-300
                  hover:bg-red-600
                "
              >
                <div>
                  <p className="text-xs font-medium text-red-100">
                    Siap pesan?
                  </p>

                  <p className="mt-0.5 text-base font-semibold">
                    Pesan Sekarang
                  </p>
                </div>

                <span
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-white/15
                    transition-transform duration-300
                    group-hover:translate-x-1
                  "
                >
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            </div>
          )}

          {/* Bottom branding */}
          <div
            className={`
              mt-6 text-center
              transition-all duration-500
              ${
                mobileOpen
                ? 'opacity-100'
                : 'opacity-0'
              }
            `}
            style={{
              transitionDelay: mobileOpen ? '450ms' : '0ms',
            }}
          >
            <p className="text-xs text-gray-400">
              Hara Chicken
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
