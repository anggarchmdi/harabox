import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
  X,
} from 'lucide-react'

import PawonHaraImg from '../../assets/PawonHara.webp'
import { useCartStore } from '../../stores/cart.store'
import { useThemeStore } from '../../stores/theme.store'

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
  {
    label: 'Lacak Pesanan',
    to: '/cek-pesanan',
  },
]

export default function Navbar() {
  const location = useLocation()
  const totalCartItems = useCartStore((state) => state.items.length)
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

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
          fixed inset-x-0 top-0 z-50 w-full max-w-[100vw]
          transition-all duration-300
          ${solidNavbar
            ? isDark
              ? 'bg-[#1C0B09]/95 backdrop-blur-md shadow-xl duration-300'
              : 'bg-[#FBF7F2]/95 backdrop-blur-md shadow-md duration-300'
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
            className="relative z-50 shrink-0 flex items-center gap-3 group"
          >
            <div>
              <img src={PawonHaraImg} className="w-12 md:w-16" alt="Pawon Hara Logo" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-dhaksinarga tracking-wide text-xl sm:text-3xl leading-none transition-colors duration-300 ${
                    solidNavbar && !isDark ? 'text-[#2B120E]' : 'text-white'
                  }`}
                >
                  Pawon Hara
                </span>
              </div>
              <span className="text-[8px] sm:text-[11px] italic font-bold uppercase tracking-widest text-[#E77B49] mt-0.5">
                Dari Pawon Ke Meja Anda
              </span>
            </div>
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
                  text-sm font-bold
                  transition-colors duration-300

                  ${isActive
                    ? 'text-[#F59E0B]'
                    : solidNavbar && !isDark
                      ? 'text-[#5C3831] hover:text-[#D97706]'
                      : 'text-stone-200 hover:text-[#F59E0B]'
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
                        h-[2.5px]
                        -translate-x-1/2
                        rounded-full
                        bg-gradient-to-r from-[#F59E0B] to-[#E77B49]
                        transition-all duration-300 ease-out
                        ${isActive
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
              DESKTOP ACTIONS (THEME TOGGLE + CART + CTA)
          ========================== */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              title={isDark ? 'Mode Terang (Coklat Terang)' : 'Mode Gelap (Coklat Tua)'}
              className={`
                group relative flex h-11 w-11 items-center justify-center rounded-full
                border transition-all duration-300 cursor-pointer
                ${isDark
                  ? 'border-[#60241E] bg-[#2D120F]/90 text-[#F59E0B] shadow-md hover:border-[#F59E0B] hover:bg-[#60241E] hover:text-amber-200'
                  : solidNavbar
                    ? 'border-[#E6DACD] bg-white text-[#D97706] shadow-sm hover:border-[#D97706] hover:bg-[#FAF0E4]'
                    : 'border-white/20 bg-black/25 text-amber-300 backdrop-blur-xs hover:border-[#F59E0B] hover:bg-black/40'
                }
              `}
            >
              <span className="transition-transform duration-300 group-hover:rotate-45">
                {isDark ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={20} strokeWidth={2.2} />}
              </span>
            </button>

            {/* Cart Button */}
            <Link
              to="/cart"
              className={`
                group relative flex h-11 w-11 items-center justify-center rounded-full
                border transition-all duration-300
                ${isCartPage
                  ? isDark
                    ? 'border-[#F59E0B] bg-[#2D120F] text-[#F59E0B] shadow-md'
                    : 'border-[#D97706] bg-[#FAF0E4] text-[#D97706] shadow-sm'
                  : isDark
                    ? 'border-[#60241E] bg-[#2D120F]/90 text-stone-200 shadow-md hover:border-[#F59E0B] hover:bg-[#60241E] hover:text-white'
                    : solidNavbar
                      ? 'border-[#E6DACD] bg-white text-[#5C3831] shadow-sm hover:border-[#D97706] hover:bg-[#FAF0E4] hover:text-[#2B120E]'
                      : 'border-white/20 bg-black/25 text-stone-100 backdrop-blur-xs hover:border-[#F59E0B] hover:bg-black/40'
                }
              `}
              aria-label={`Buka Keranjang (${totalCartItems} menu)`}
            >
              <ShoppingCart size={20} strokeWidth={2.2} className="transition-transform group-hover:scale-110" />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[11px] font-black text-[#1C0B09] shadow-md ring-2 ring-[#1C0B09]">
                {totalCartItems}
              </span>
            </Link>

            {!isCartPage && (
              <Link
                to="/menu#menu-list"
                className="
                  group flex items-center gap-2
                  rounded-full
                  bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49]
                  hover:from-amber-400 hover:to-amber-500
                  px-5 py-2.5
                  text-sm font-black text-[#1C0B09]
                  shadow-md shadow-[#F59E0B]/25
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:shadow-lg hover:shadow-[#F59E0B]/35
                "
              >
                <span>Pesan Sekarang</span>

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
              MOBILE ACTIONS (THEME TOGGLE + CART + MENU BUTTON)
          ========================== */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              className={`
                relative z-50 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer
                ${isDark
                  ? 'border-[#60241E] bg-[#2D120F] text-[#F59E0B] shadow-md'
                  : solidNavbar
                    ? 'border-[#E6DACD] bg-white text-[#D97706] shadow-sm'
                    : 'border-white/20 bg-black/25 text-amber-300'
                }
              `}
            >
              {isDark ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={20} strokeWidth={2.2} />}
            </button>

            <Link
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className={`
                relative z-50
                flex h-11 w-11
                items-center justify-center
                rounded-full border
                transition-all duration-300
                ${isCartPage
                  ? isDark
                    ? 'border-[#F59E0B] bg-[#2D120F] text-[#F59E0B] shadow-md'
                    : 'border-[#D97706] bg-[#FAF0E4] text-[#D97706] shadow-sm'
                  : isDark
                    ? 'border-[#60241E] bg-[#2D120F] text-amber-100 shadow-md'
                    : solidNavbar
                      ? 'border-[#E6DACD] bg-white text-[#5C3831] shadow-sm'
                      : 'border-white/20 bg-black/25 text-white'
                }
              `}
              aria-label={`Buka Keranjang (${totalCartItems} menu)`}
            >
              <ShoppingCart size={20} strokeWidth={2.2} />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[11px] font-black text-[#1C0B09] shadow-md ring-2 ring-[#1C0B09]">
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
                border
                transition-all duration-300 cursor-pointer
                ${isDark
                  ? 'border-[#60241E] bg-[#2D120F] text-amber-300 shadow-md'
                  : solidNavbar
                    ? 'border-[#E6DACD] bg-white text-[#5C3831] shadow-sm'
                    : 'border-white/20 bg-black/25 text-white'
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
                  ${mobileOpen
                    ? 'rotate-90 text-[#F59E0B]'
                    : isDark
                      ? 'rotate-0 text-amber-200'
                      : 'rotate-0 text-[#5C3831]'
                  }
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
          MOBILE NAVIGATION DRAWER
      ========================== */}
      <div
        className={`
          fixed inset-0 z-40
          transition-all duration-500
          lg:hidden
          ${isDark ? 'bg-[#1C0B09] text-stone-100' : 'bg-[#FBF7F2] text-[#2B120E]'}
          ${mobileOpen
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
              ${mobileOpen
                ? 'translate-y-0 opacity-100'
                : '-translate-y-3 opacity-0'
              }
            `}
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F59E0B]">
              Navigasi Katering
            </p>

            <p className={`mt-2 text-sm font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
              Jelajahi Pawon Hara
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
                  py-5
                  transition-all duration-500
                  border-b ${isDark ? 'border-[#60241E]/60' : 'border-[#E6DACD]'}

                  ${mobileOpen
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-5 opacity-0'
                  }

                  ${isActive
                    ? 'text-[#F59E0B]'
                    : isDark ? 'text-stone-200' : 'text-[#5C3831]'
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
                        font-dhaksinarga tracking-wide text-md
                        transition-all duration-300
                        ${isActive
                          ? 'font-bold text-[#F59E0B]'
                          : isDark
                            ? 'text-stone-200 group-hover:text-[#F59E0B] group-hover:translate-x-1'
                            : 'text-[#5C3831] group-hover:text-[#D97706] group-hover:translate-x-1'
                        }
                      `}
                    >
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    <span
                      className={`
                        h-2.5 w-2.5
                        rounded-full
                        bg-[#F59E0B]
                        transition-all duration-300
                        ${isActive
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
                py-5
                transition-all duration-500
                border-b ${isDark ? 'border-[#60241E]/60' : 'border-[#E6DACD]'}
                ${mobileOpen
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-5 opacity-0'
                }
                ${isActive
                  ? 'text-[#F59E0B]'
                  : isDark ? 'text-stone-200' : 'text-[#5C3831]'
                }
              `}
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={22} className={isActive ? 'text-[#F59E0B]' : isDark ? 'text-stone-300' : 'text-[#5C3831]'} />
                    <span
                      className={`
                        font-dhaksinarga tracking-wide text-md
                        transition-all duration-300
                        ${isActive
                          ? 'font-bold text-[#F59E0B]'
                          : isDark
                            ? 'text-stone-200 group-hover:text-[#F59E0B] group-hover:translate-x-1'
                            : 'text-[#5C3831] group-hover:text-[#D97706] group-hover:translate-x-1'
                        }
                      `}
                    >
                      Keranjang
                    </span>
                  </div>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F59E0B] px-2 text-xs font-black text-[#1C0B09] shadow-sm">
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
                ${mobileOpen
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
                  bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49]
                  px-5 py-4
                  text-[#1C0B09]
                  shadow-lg shadow-[#F59E0B]/25
                  transition-all duration-300
                "
              >
                <div>
                  <p className="text-xs font-bold text-[#60241E]">
                    Siap pesan katering lezat?
                  </p>

                  <p className="mt-0.5 text-base font-black">
                    Pesan Sekarang di Pawon Hara
                  </p>
                </div>

                <span
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-[#1C0B09]/15
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
              ${mobileOpen
                ? 'opacity-100'
                : 'opacity-0'
              }
            `}
            style={{
              transitionDelay: mobileOpen ? '450ms' : '0ms',
            }}
          >
            <p className={`text-xs font-semibold ${isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'}`}>
              Pawon Hara • Catering & Bento
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
