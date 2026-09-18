import { Link } from 'react-router-dom'
import { MapPin, Mail, MessageCircle } from 'lucide-react'
import PawonHaraImg from '../../assets/PawonHara.webp'
import { useThemeStore } from '../../stores/theme.store'

export default function Footer() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  return (
    <footer
      className={`border-t transition-colors duration-300 ${
        isDark
          ? 'bg-[#200B09] text-white border-[#60241E]/50'
          : 'bg-[#EFE5D8] text-[#2B120E] border-[#E0D2C2]'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div>
                <img src={PawonHaraImg} className="w-16" alt="Pawon Hara Logo" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-dhaksinarga tracking-wide text-2xl sm:text-3xl leading-none ${
                      isDark ? 'text-white' : 'text-[#2B120E]'
                    }`}
                  >
                    Pawon Hara
                  </span>
                </div>
                <span className="text-[11px] italic font-bold uppercase tracking-widest text-[#E77B49] mt-0.5">
                  Dari Pawon Ke Meja Anda
                </span>
              </div>
            </Link>

            <p className={`max-w-md text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-[#5C3831]'}`}>
              Sajian nasi box dan bento lezat kaya bumbu meresap untuk berbagai kebutuhan acara.
              Mulai dari syukuran keluarga, meeting kantor, gathering komunitas, hingga pesanan katering skala besar.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3">
            <h3
              className={`text-xs font-black uppercase tracking-[0.2em] ${
                isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
              }`}
            >
              Navigasi Cepat
            </h3>

            <ul className="mt-5 space-y-3">
              {[
                { to: '/', label: 'Beranda' },
                { to: '/menu', label: 'Pilihan Menu Katering' },
                { to: '/tentang-kami', label: 'Tentang Pawon Hara' },
                { to: '/cara-pesan', label: 'Panduan Cara Pesan' },
                { to: '/cek-pesanan', label: 'Lacak Status Pesanan' },
                { to: '/testimoni', label: 'Suara & Testimoni Pelanggan' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`text-sm transition hover:translate-x-1 inline-block duration-200 ${
                      isDark
                        ? 'text-stone-300 hover:text-[#F59E0B]'
                        : 'text-[#5C3831] hover:text-[#B45309]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3
              className={`text-xs font-black uppercase tracking-[0.2em] ${
                isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
              }`}
            >
              Hubungi Pawon Hara
            </h3>

            <div className={`mt-5 space-y-3.5 text-sm ${isDark ? 'text-stone-300' : 'text-[#5C3831]'}`}>
              <div className="flex items-start gap-3">
                <MapPin size={17} className="text-[#E77B49] shrink-0 mt-0.5" />
                <span>Yogyakarta & Sekitarnya (Melayani Pengiriman ke Seluruh DIY)</span>
              </div>

              <a
                href="https://wa.me/6289669743193"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 transition ${
                  isDark ? 'hover:text-[#F59E0B]' : 'hover:text-[#B45309]'
                }`}
              >
                <MessageCircle size={17} className="text-[#E77B49] shrink-0" />
                <span>+62 896-6974-3193 (WhatsApp Admin)</span>
              </a>

              <a
                href="mailto:halo@pawonhara.com"
                className={`flex items-center gap-3 transition ${
                  isDark ? 'hover:text-[#F59E0B]' : 'hover:text-[#B45309]'
                }`}
              >
                <Mail size={17} className="text-[#E77B49] shrink-0" />
                <span>halo@pawonhara.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          className={`flex flex-col gap-4 border-t py-7 sm:flex-row sm:items-center sm:justify-between text-xs ${
            isDark ? 'border-[#60241E]/60 text-stone-400' : 'border-[#D9C7B6] text-[#7A5B52]'
          }`}
        >
          <p>© {new Date().getFullYear()} Pawon Hara. Seluruh hak cipta dilindungi.</p>

          <div className="flex items-center gap-6">
            <span className={isDark ? 'text-stone-500' : 'text-[#9C8279]'}>
              Catering & Bento Box Yogyakarta
            </span>
            <a
              href="https://wa.me/6289669743193"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition ${isDark ? 'text-stone-400 hover:text-[#F59E0B]' : 'text-[#7A5B52] hover:text-[#B45309]'}`}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
