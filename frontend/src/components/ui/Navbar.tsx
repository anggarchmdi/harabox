import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import LogoImg from '../../assets/Logo.webp'

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

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Navbar hanya mengikuti scroll di halaman Home
  const isHome = location.pathname === '/'

  // Semua halaman selain Home menggunakan navbar merah
  const solidNavbar = !isHome || scrolled

  useEffect(() => {
    // Kalau bukan Home, tidak perlu listener scroll
    if (!isHome) {
      setScrolled(false)
      return
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome])

  useEffect(() => {
    // Tutup mobile menu ketika pindah halaman
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
      {/* Desktop / Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          solidNavbar
            ? 'bg-white shadow-md'
            : 'bg-white'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <Link
            to="/"
            className="relative z-10 flex items-center"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src={LogoImg}
              alt="Hara Chicken"
              className="w-36"
            />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'font-extrabold text-red-500'
                      : solidNavbar
                        ? 'font-medium text-black hover:text-red-500'
                        : 'text-black hover:text-red-500'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <Link
            to="/order"
            className="hidden rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-all transform hover:scale-95 duration-300 hover:shadow-amber-500 lg:block"
          >
            Pesan Sekarang
          </Link>

          {/* Mobile button */}
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${
              solidNavbar
                ? 'bg-white text-gray-900'
                : 'bg-white/10 text-white'
            }`}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile navigation */}
      <div
        className={`fixed inset-0 z-40 bg-white transition-all duration-300 lg:hidden ${
          mobileOpen
            ? 'visible opacity-100'
            : 'invisible opacity-0'
        }`}
      >
        <div className="flex min-h-full flex-col px-6 ">

          <nav className="flex flex-col">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `border-b border-gray-100 py-5 text-2xl font-semibold ${
                    isActive
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto">
            <Link
              to="/order"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-700"
            >
              Pesan Sekarang
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
