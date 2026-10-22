import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, MessageCircle } from 'lucide-react'
import FooterCorner from '../../assets/footer-corner-gold.webp'
import BatikParang from '../../assets/batik-parang-gold.webp'
import { useThemeStore } from '../../stores/theme.store'

export default function Footer() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/menu', label: 'Pilihan Menu Katering' },
    { to: '/tentang-kami', label: 'Tentang Pawon Hara' },
    { to: '/cara-pesan', label: 'Panduan Cara Pesan' },
    { to: '/cek-pesanan', label: 'Lacak Status Pesanan' },
    { to: '/testimoni', label: 'Suara & Testimoni Pelanggan' },
  ]

  return (
    <footer
      className={`relative w-full overflow-hidden select-none transition-colors duration-300 ${isDark
          ? 'bg-[#180806] text-stone-200'
          : 'bg-[#1C0B09] text-stone-200 shadow-[0_-10px_30px_rgba(28,11,9,0.15)]'
        }`}
    >
      {/* =========================================================================
          1. TRADITIONAL JAVANESE BATIK PARANG WATERMARK BACKGROUND (DIPERTAHANKAN)
      ========================================================================== */}
      {/* Motif Batik Parang Asli dari gambar (berwarna emas keraton hangat & halus) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.075] mix-blend-screen"
        style={{
          backgroundImage: `url(${BatikParang})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '1200px auto',
        }}
      />

      {/* Radial Vignette agar bagian tengah teks tetap jernih & berfokus pada konten */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_25%,#1C0B09_92%)]" />

      {/* Ambient Lighting Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-[#F59E0B]/12 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-12 left-12 w-64 h-64 bg-[#95271D]/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-12 right-12 w-64 h-64 bg-[#F59E0B]/10 blur-3xl pointer-events-none rounded-full" />

      {/* =========================================================================
          2. MAIN CONTENT: 3 COLUMNS (MASCOT & BRAND | NAVIGASI | HUBUNGI)
      ========================================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-10 sm:pt-14 pb-14 sm:pb-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-12 items-start">
          {/* ----------------- COLUMN 1: MASCOT & BRAND (5 Cols) ----------------- */}
          <div className="lg:col-span-5 flex flex-col items-start space-y-4">
            {/* Duck Mascot in Traditional Attire & Crowned Brand Title */}
            <Link to="/" className="group inline-flex items-center gap-3.5 sm:gap-4">
              <div className="flex flex-col items-start">
                <span className="font-dhaksinarga tracking-wide text-xl sm:text-4xl font-bold text-white transition-colors leading-tight">
                  Pawon Hara
                </span>
                <span className="text-[10px] sm:text-lg font-semibold tracking-[0.2em] uppercase text-[#E77B49] mt-0.5">
                  Dapur Citarasa Nusantara
                </span>
              </div>
            </Link>

            {/* Description Text */}
            <div className="space-y-2 max-w-md">
              {/* <p className="text-xs sm:text-lg font-medium text-amber-200/90 font-sans tracking-wide">
                Pawon Hara | Dapurnya Rasa Nusantara
              </p> */}
              <p className="text-xs sm:text-lg text-stone-300/90 leading-relaxed font-sans">
                Sajian menu khas nusantara untuk semua acara. Pawon Hara Dapurnya Rasa Nusantara
              </p>
            </div>
                {/* Social Media Circular Badges */}
              <div className="pt-2">
                <div className="text-xs text-stone-400 font-medium mb-3">
                  Media Sosial Kami:
                </div>
                <div className="flex items-center gap-3">
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/pawonhara/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram Pawon Hara"
                    className="w-9 h-9 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#1C0B08] hover:scale-110 transition-all duration-300 shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61587199700622&locale=id_ID"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook Pawon Hara"
                    className="w-9 h-9 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#1C0B08] hover:scale-110 transition-all duration-300 shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  {/* Direct WhatsApp Pill */}
                  <a
                    href="https://wa.me/6281122225520"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Admin"
                    className="w-9 h-9 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#1C0B08] hover:scale-110 transition-all duration-300 shadow-sm"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>
              </div>
          </div>

          {/* ----------------- COLUMN 2: NAVIGASI CEPAT (3 Cols) ----------------- */}
          <div className="lg:col-span-3">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] text-[#F59E0B]">
              NAVIGASI CEPAT
            </h3>

            <ul className="mt-5 space-y-3">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="group inline-flex items-center gap-2.5 text-xs sm:text-sm text-stone-300 hover:text-amber-300 transition-all duration-200"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] group-hover:scale-150 group-hover:bg-amber-300 group-hover:shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all duration-200" />
                    <span className="group-hover:translate-x-1.5 transition-transform duration-200">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ----------------- COLUMN 3: HUBUNGI PAWON HARA (4 Cols) ----------------- */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] text-[#F59E0B]">
              HUBUNGI PAWON HARA
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-stone-300">
              {/* Alamat */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/35 flex items-center justify-center shrink-0 mt-0.5 text-[#F59E0B] shadow-inner">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="font-semibold text-stone-200">
                    Sariharjo, Kec. Ngaglik, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55581
                  </div>
                  <div className="text-stone-400 text-xs mt-0.5">
                    Melayani Pengiriman ke Seluruh Wilayah DIY
                  </div>
                </div>
              </div>

              {/* Telepon / WhatsApp */}
              <a
                href="https://wa.me/6281122225520"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 transition-colors hover:text-amber-300"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/35 flex items-center justify-center shrink-0 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-[#1C0B08] group-hover:scale-105 transition-all shadow-inner">
                  <Phone size={16} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform">
                  +62 811-2222-5520 (Call / WA)
                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:pawonhara@gmail.com"
                className="group flex items-center gap-3 transition-colors hover:text-amber-300"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/35 flex items-center justify-center shrink-0 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-[#1C0B08] group-hover:scale-105 transition-all shadow-inner">
                  <Mail size={16} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform">
                  pawonhara@gmail.com
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. PROPORTIONAL CORNER FILIGREE ORNAMENTS & GOLDEN DIVIDER LINE (VERSI TERBARU)
      ========================================================================== */}
      <div className="relative w-full">
        {/* Corner Ornament Kiri (Versi terbaru dari lampiran, menempel di atas garis pembatas emas) */}
        <div className="absolute left-2 sm:left-6 lg:left-3 bottom-3 pointer-events-none select-none z-10">
          <img
            src={FooterCorner}
            alt=""
            aria-hidden="true"
            className="w-14 sm:w-18 md:w-22 h-auto opacity-85 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]"
          />
        </div>

        {/* Corner Ornament Kanan (Mirrored, versi terbaru dari lampiran) */}
        <div className="absolute right-2 sm:right-6 lg:right-3 bottom-3 pointer-events-none select-none z-10">
          <img
            src={FooterCorner}
            alt=""
            aria-hidden="true"
            className="w-14 sm:w-18 md:w-22 h-auto opacity-85 -scale-x-100 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]"
          />
        </div>

        {/* Golden Horizontal Divider Line (Garis Emas Membentang) */}
        <div className="w-full flex justify-center">
        <div className="relative w-full h-[2px] bg-[#F59E0B]/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
          <div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-[#FDE68A] to-transparent opacity-85" />
        </div>
        </div>
      </div>

      {/* =========================================================================
          5. BOTTOM COPYRIGHT BAR (DIPERTAHANKAN SEPENUHNYA)
      ========================================================================== */}
      <div className="relative z-10 w-full py-5 sm:py-6 bg-black/35 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Pawon Hara. Seluruh hak cipta dilindungi.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-stone-400">
            <span className="text-amber-200/90 font-medium">
              Catering & Nasi Box Yogyakarta
            </span>
            <span className="text-[#F59E0B]/40">•</span>
            <Link
              to="/tentang-kami"
              className="hover:text-amber-300 transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <span className="text-[#F59E0B]/40">•</span>
            <Link
              to="/cara-pesan"
              className="hover:text-amber-300 transition-colors"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
