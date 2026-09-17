import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Plus,
  Receipt,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AOS from 'aos'

import Summary from '../components/ui/Summary'
import PageLoader from '../components/ui/PageLoader'
import { useThemeStore } from '../stores/theme.store'

const steps = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Pilih Menu Katering',
    description:
      'Jelajahi koleksi menu katering kami, mulai dari Bento Katsu, Ayam Krisbar, Nasi Kuning, hingga Nasi Rames dengan bahan segar dan bumbu otentik.',
    badge: 'Katalog Lengkap',
  },
  {
    number: '02',
    icon: Plus,
    title: 'Tentukan Porsi (Kelipatan 10)',
    description:
      'Pilih jumlah porsi dengan mudah menggunakan tombol counter kelipatan 10 (10, 20, 30, 50, 100+ porsi). Minimal pemesanan adalah 10 porsi.',
    badge: 'Sistem Kelipatan 10',
  },
  {
    number: '03',
    icon: CalendarDays,
    title: 'Lengkapi Data Acara & Lokasi',
    description:
      'Masukkan nama lengkap, nomor WhatsApp aktif, tanggal dan perkiraan jam acara, serta alamat pengantaran lengkap beserta catatan khusus.',
    badge: 'Form Ringkas',
  },
  {
    number: '04',
    icon: Receipt,
    title: 'Terhubung ke WhatsApp & Terima Invoice',
    description:
      'Sistem otomatis mencatat pesanan Anda dan mengarahkan ke chat WhatsApp admin. Tim kami akan mengirimkan invoice resmi katering beserta rincian biaya.',
    badge: 'Invoice Katering Resmi',
  },
  {
    number: '05',
    icon: CheckCircle2,
    title: 'Konfirmasi Pembayaran & Siap Diantar',
    description:
      'Lakukan pembayaran sesuai invoice dan kirimkan bukti transfer. Pesanan Anda diproses di dapur higienis dan diantar tepat waktu siap santap.',
    badge: 'Pengantaran Tepat Waktu',
  },
]

const proTips = [
  {
    title: 'Pemesanan Lebih Awal',
    desc: 'Untuk pesanan dalam jumlah besar (di atas 100 porsi), kami sarankan memesan H-2 atau H-3 agar persiapan dapur optimal.',
  },
  {
    title: 'Kustomisasi Khusus',
    desc: 'Butuh sambal dipisah, menu vegetarian, atau penyesuaian lauk? Tuliskan di catatan pemesanan atau sampaikan langsung via WhatsApp.',
  },
  {
    title: 'Faktur & Administrasi Kantor',
    desc: 'Kami siap menerbitkan invoice penawaran resmi, kuitansi bermaterai, ataupun kelengkapan administrasi instansi/perusahaan Anda.',
  },
]

export default function CaraPesan() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: false,
      offset: 40,
    })
    AOS.refresh()

    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 650)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
          : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-[#2B120E]'
      }`}
    >
      {/* Branded Initial Page Loader with clean LogoSpinner */}
      <PageLoader
        isLoading={pageLoading}
        text="Menyiapkan Panduan Pemesanan..."
        subtext="Langkah mudah memesan katering lezat siap santap untuk acara Anda"
        minDuration={650}
      />

      {/* Header */}
      <Summary
        eyebrow="PANDUAN PEMESANAN PAWON HARA"
        title="Pesan Katering Praktis Tanpa Ribet"
        description="Mulai dari memilih menu, menentukan jumlah porsi, hingga menerima invoice resmi katering via WhatsApp dalam hitungan menit."
      />

      {/* =====================================================
          STEP BY STEP TIMELINE SECTION
      ====================================================== */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
        <div data-aos="fade-up" className="mb-14 text-center max-w-2xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] shadow-sm ${
              isDark
                ? 'border-[#F59E0B]/40 bg-[#60241E] text-amber-300'
                : 'border-[#D97706]/40 bg-[#FAF0E4] text-[#8C4320]'
            }`}
          >
            <Sparkles size={13} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
            Alur Pemesanan 5 Langkah
          </div>

          <h2
            className={`mt-4 text-3xl font-dhaksinarga tracking-wide sm:text-5xl ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}
          >
            Langkah Cepat & Transparan
          </h2>

          <p className={`mt-4 text-sm sm:text-base leading-relaxed ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
            Ikuti panduan mudah berikut untuk memesan konsumsi katering Pawon Hara untuk acara Anda.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical subtle center line */}
          <div
            className={`absolute left-8 top-12 bottom-12 hidden w-px sm:block ${
              isDark ? 'bg-[#60241E]/60' : 'bg-[#E6DACD]'
            }`}
          />

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon

              return (
                <article
                  key={step.number}
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                  className={`group relative grid gap-6 rounded-[2.2rem] border p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 shadow-lg sm:grid-cols-[72px_1fr] ${
                    isDark
                      ? 'border-[#60241E]/80 bg-[#2D120F] hover:border-[#F59E0B]/50 hover:bg-[#361613]'
                      : 'border-[#E6DACD] bg-white hover:border-[#D97706]/50 hover:bg-[#FCF9F5] shadow-[#2B120E]/5'
                  }`}
                >
                  {/* Step Number Badge */}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60241E] to-[#95271D] font-mono text-base font-black text-white shadow-md shadow-black/40 ring-1 ring-[#F59E0B]/30 group-hover:scale-105 transition-transform">
                    {step.number}
                  </div>

                  {/* Step Details */}
                  <div className="flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                        <h3
                          className={`text-xl font-dhaksinarga tracking-wide ${
                            isDark ? 'text-white' : 'text-[#2B120E]'
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                          isDark
                            ? 'bg-[#3B1814] border border-[#60241E] text-amber-300'
                            : 'bg-[#FAF0E4] border border-[#E6DACD] text-[#8C4320]'
                        }`}
                      >
                        {step.badge}
                      </span>
                    </div>

                    <p className={`mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
                      {step.description}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          WHATSAPP INVOICE PREVIEW SECTION
      ====================================================== */}
      <section
        className={`border-t py-20 lg:py-28 transition-colors duration-300 ${
          isDark ? 'border-[#60241E]/80 bg-[#200B09]' : 'border-[#E0D2C2] bg-[#EFE5D8]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Info */}
            <div data-aos="fade-right" className="space-y-5">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                  isDark
                    ? 'border-[#F59E0B]/40 bg-[#60241E] text-amber-300'
                    : 'border-[#D97706]/40 bg-[#FAF0E4] text-[#8C4320]'
                }`}
              >
                <Receipt size={13} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                Sistem Invoice Digital WhatsApp
              </div>

              <h2
                className={`text-3xl font-dhaksinarga tracking-wide sm:text-4xl lg:text-5xl leading-tight ${
                  isDark ? 'text-white' : 'text-[#2B120E]'
                }`}
              >
                Harga Ditentukan Tim Kami, Invoice Resmi Langsung di WhatsApp Anda
              </h2>

              <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-amber-100/75' : 'text-[#5C3831]'}`}>
                Setelah Anda memilih menu dan jumlah porsi di website, pesanan Anda tercatat langsung di dashboard admin kami.
                Tim Pawon Hara akan segera mengirimkan invoice resmi berisi rincian pesanan, konfirmasi ongkir,
                serta rekening pembayaran resmi.
              </p>

              <div
                className={`pt-2 flex flex-wrap gap-3 text-xs font-semibold ${
                  isDark ? 'text-amber-100/90' : 'text-[#5C3831]'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 shadow-xs ${
                    isDark ? 'border-[#60241E] bg-[#2D120F]' : 'border-[#E6DACD] bg-white'
                  }`}
                >
                  <CheckCircle2 size={14} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                  Rincian Porsi Jelas
                </div>
                <div
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 shadow-xs ${
                    isDark ? 'border-[#60241E] bg-[#2D120F]' : 'border-[#E6DACD] bg-white'
                  }`}
                >
                  <CheckCircle2 size={14} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                  Rekening Bank Resmi
                </div>
                <div
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 shadow-xs ${
                    isDark ? 'border-[#60241E] bg-[#2D120F]' : 'border-[#E6DACD] bg-white'
                  }`}
                >
                  <CheckCircle2 size={14} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                  Tercatat di Sistem
                </div>
              </div>
            </div>

            {/* Right Mockup Card of WhatsApp Invoice */}
            <div
              data-aos="fade-left"
              data-aos-delay="150"
              className={`relative rounded-[2.5rem] border p-6 sm:p-8 shadow-2xl ${
                isDark
                  ? 'border-[#60241E]/80 bg-[#2D120F]'
                  : 'border-[#E6DACD] bg-white shadow-[#2B120E]/10'
              }`}
            >
              <div
                className={`flex items-center gap-3 border-b pb-4 mb-4 ${
                  isDark ? 'border-[#60241E]/70' : 'border-[#EFE5D8]'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#60241E] text-[#F59E0B] ring-1 ring-[#F59E0B]/30">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                    Admin Katering Pawon Hara
                  </p>
                  <p className="text-[11px] text-emerald-500 font-semibold">● Online • Fast Response</p>
                </div>
              </div>

              <div
                className={`rounded-2xl border p-4 font-mono text-xs space-y-2 shadow-inner ${
                  isDark
                    ? 'border-[#60241E] bg-[#1C0B09] text-amber-100'
                    : 'border-[#E6DACD] bg-[#FAF5EE] text-[#2B120E]'
                }`}
              >
                <p className="font-bold text-[#F59E0B] font-dhaksinarga text-sm tracking-wider">
                  *INVOICE PESANAN PAWON HARA*
                </p>
                <div className={isDark ? 'text-[#60241E]' : 'text-[#DDCBC0]'}>
                  ===============================
                </div>
                <p>No. Pesanan: <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>PH-20260903-XXXX</span></p>
                <p>Menu: <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>Nasi Box Bento Katsu (30 Porsi)</span></p>
                <p>Tanggal Acara: <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>12 Oktober 2026</span></p>
                <p>Alamat: <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>Gedung Pertemuan Lt. 3</span></p>
                <div className={isDark ? 'text-[#60241E]' : 'text-[#DDCBC0]'}>
                  -------------------------------
                </div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                  TOTAL TAGIHAN: <span className="text-[#F59E0B]">Rp 750.000</span>
                </p>
                <p className={`text-[11px] font-sans mt-2 ${isDark ? 'text-amber-200/60' : 'text-[#8C6B62]'}`}>
                  Pembayaran: Bank BCA / Mandiri a/n Pawon Hara
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRO TIPS SECTION
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div
          data-aos="fade-up"
          className={`rounded-[2.5rem] border p-8 sm:p-12 shadow-xl ${
            isDark
              ? 'border-[#60241E]/80 bg-[#2D120F]'
              : 'border-[#E6DACD] bg-white shadow-[#2B120E]/5'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'
            }`}
          >
            <HelpCircle size={15} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
            Tips Penting dari Kami
          </div>

          <h2
            className={`mt-2 text-2xl sm:text-3xl font-dhaksinarga tracking-wide ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}
          >
            Agar Pemesanan Anda Berjalan Sempurna
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {proTips.map((tip, idx) => (
              <div
                key={tip.title}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className={`rounded-2xl border p-6 space-y-2 shadow-xs ${
                  isDark
                    ? 'border-[#60241E]/60 bg-[#1C0B09]'
                    : 'border-[#E6DACD] bg-[#FAF5EE]'
                }`}
              >
                <h4
                  className={`font-dhaksinarga tracking-wide text-base ${
                    isDark ? 'text-white' : 'text-[#2B120E]'
                  }`}
                >
                  {tip.title}
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          BOTTOM CONSULTATION CTA
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div
          data-aos="zoom-in"
          data-aos-duration="650"
          className={`relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-2xl transition-colors duration-300 ${
            isDark
              ? 'border-2 border-[#B34A44]/40 bg-gradient-to-br from-[#2D120F] via-[#381612] to-[#451B17] text-white'
              : 'border-2 border-[#E77B49]/40 bg-gradient-to-br from-[#FAF3EA] via-[#F4E9DC] to-[#EFE1D1] text-[#2B120E]'
          }`}
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm ${
                  isDark
                    ? 'border border-[#F59E0B]/40 bg-[#60241E] text-amber-300'
                    : 'border border-[#D97706]/40 bg-[#FAF0E4] text-[#8C4320]'
                }`}
              >
                <CheckCircle2 size={13} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                Siap Memesan?
              </div>

              <h2
                className={`mt-4 text-3xl font-dhaksinarga tracking-wide sm:text-4xl lg:text-5xl leading-tight ${
                  isDark ? 'text-white' : 'text-[#2B120E]'
                }`}
              >
                Pilih Menu Katering Favorit Anda Sekarang
              </h2>

              <p className={`mt-4 text-sm sm:text-base leading-relaxed max-w-2xl ${isDark ? 'text-amber-100/75' : 'text-[#5C3831]'}`}>
                Tersedia beragam pilihan paket nasi box bento katsu, krisbar, dan nasi kuning dengan harga hemat serta rasa lezat.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49] px-8 py-4 text-sm font-black text-[#1C0B09] shadow-xl shadow-[#F59E0B]/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Jelajahi Semua Menu</span>
                <ArrowRight size={16} />
              </Link>

              <a
                href="https://wa.me/6289669743193?text=Halo%20Pawon%20Hara,%20saya%20ingin%20tanya%20cara%20pemesanan%20katering."
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3.5 text-xs font-bold transition ${
                  isDark
                    ? 'border-[#E77B49]/50 bg-[#1C0B09] text-white hover:bg-[#250D0A]'
                    : 'border-[#E6DACD] bg-white text-[#2B120E] hover:bg-[#FAF4ED]'
                }`}
              >
                <MessageCircle size={15} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                Chat WhatsApp Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
