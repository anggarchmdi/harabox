import { Link } from 'react-router-dom'
import LogoImg from '../../assets/Logo.webp'

export default function Footer() {
  return (
    <footer className="bg-[#171717] text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block">
              <img
                src={LogoImg}
                alt="Hara Chicken"
                className="w-40"
              />
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-gray-400">
              Nasi box praktis dan lezat untuk berbagai kebutuhan.
              Dari acara keluarga, meeting kantor, hingga pesanan
              dalam jumlah besar.
            </p>

            <Link
              to="/menu"
              className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              Pilih Menu Katering
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold">
              Navigasi
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/menu"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Menu
                </Link>
              </li>

              <li>
                <Link
                  to="/tentang-kami"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Tentang Kami
                </Link>
              </li>

              <li>
                <Link
                  to="/cara-pesan"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Cara Pesan
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold">
              Hubungi Kami
            </h3>

            <div className="mt-5 space-y-4 text-sm text-gray-400">
              <p>
                Yogyakarta
              </p>

              <a
                href="tel:+6281234567890"
                className="block transition hover:text-white"
              >
                +62 812-3456-7890
              </a>

              <a
                href="mailto:hello@harachicken.com"
                className="block transition hover:text-white"
              >
                hello@harachicken.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            © 2026 Hara Chicken. All rights reserved.
          </p>

          <div className="flex gap-5">
            <a
              href="#"
              className="text-xs text-gray-500 transition hover:text-white"
            >
              Instagram
            </a>

            <a
              href="#"
              className="text-xs text-gray-500 transition hover:text-white"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
