import { Link } from 'react-router-dom'
import { MapPin, Mail, MessageCircle } from 'lucide-react'
import PawonHaraImg from '../../assets/PawonHara.webp'

export default function Footer() {
  return (
    <footer className="bg-[#200B09] text-white border-t border-[#60241E]/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="">
                <img src={PawonHaraImg} className='w-16' alt="" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-dhaksinarga tracking-wide text-2xl sm:text-3xl text-white leading-none">
                    Pawon Hara
                  </span>
                </div>
                <span className="text-[11px] italic font-bold uppercase tracking-widest text-[#E77B49] mt-0.5">
                  Dari Pawon Ke Meja Anda
                </span>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-relaxed text-stone-300">
              Sajian nasi box dan bento lezat kaya bumbu meresap untuk berbagai kebutuhan acara.
              Mulai dari syukuran keluarga, meeting kantor, gathering komunitas, hingga pesanan katering skala besar.
            </p>

            {/* <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#60241E]/60 border border-[#B34A44]/40 px-3 py-1 text-xs font-semibold text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Dapur Higienis & Halal
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#60241E]/60 border border-[#B34A44]/40 px-3 py-1 text-xs font-semibold text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                Tepat Waktu
              </span>
            </div> */}
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F59E0B]">
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
                    className="text-sm text-stone-300 transition hover:text-[#F59E0B] hover:translate-x-1 inline-block duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F59E0B]">
              Hubungi Pawon Hara
            </h3>

            <div className="mt-5 space-y-3.5 text-sm text-stone-300">
              <div className="flex items-start gap-3">
                <MapPin size={17} className="text-[#E77B49] shrink-0 mt-0.5" />
                <span>Yogyakarta & Sekitarnya (Melayani Pengiriman ke Seluruh DIY)</span>
              </div>

              <a
                href="https://wa.me/6289669743193"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:text-[#F59E0B]"
              >
                <MessageCircle size={17} className="text-[#E77B49] shrink-0" />
                <span>+62 896-6974-3193 (WhatsApp Admin)</span>
              </a>

              <a
                href="mailto:halo@pawonhara.com"
                className="flex items-center gap-3 transition hover:text-[#F59E0B]"
              >
                <Mail size={17} className="text-[#E77B49] shrink-0" />
                <span>halo@pawonhara.com</span>
              </a>
            </div>

            <div className="mt-6 pt-5 border-t border-[#60241E]/60">
              <a
                href="https://wa.me/6289669743193"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] hover:from-[#D97706] hover:to-[#B34A44] px-5 py-3 text-xs font-black text-[#200B09] shadow-md transition duration-300 hover:shadow-lg"
              >
                <MessageCircle size={15} />
                <span>Konsultasi Menu WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-[#60241E]/60 py-7 sm:flex-row sm:items-center sm:justify-between text-xs text-stone-400">
          <p>
            © {new Date().getFullYear()} Pawon Hara. Seluruh hak cipta dilindungi.
          </p>

          <div className="flex items-center gap-6">
            <span className="text-stone-500">Catering & Bento Box Yogyakarta</span>
            <a
              href="https://wa.me/6289669743193"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 transition hover:text-[#F59E0B]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
