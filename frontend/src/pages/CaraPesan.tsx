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
    <main className="min-h-screen bg-[#fafaf9] text-zinc-900 selection:bg-zinc-950 selection:text-white">
      {/* Branded Initial Page Loader with clean LogoSpinner */}
      <PageLoader
        isLoading={pageLoading}
        text="Menyiapkan Panduan Pemesanan..."
        subtext="Langkah mudah memesan katering lezat siap santap untuk acara Anda"
        minDuration={650}
      />

      {/* Header */}
      <Summary
        eyebrow="PANDUAN PEMESANAN KATERING"
        title="Pesan Katering Praktis Tanpa Ribet."
        description="Mulai dari memilih menu, menentukan jumlah porsi, hingga menerima invoice resmi katering via WhatsApp dalam hitungan menit."
      />

      {/* =====================================================
          STEP BY STEP TIMELINE SECTION
      ====================================================== */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
        <div data-aos="fade-up" className="mb-14 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-700 shadow-sm">
            <Sparkles size={13} className="text-amber-500" />
            Alur Pemesanan 5 Langkah
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            Langkah Cepat & Transparan
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-500">
            Ikuti panduan mudah berikut untuk memesan konsumsi catering Hara Chicken untuk acara Anda.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Vertical subtle center line */}
          <div className="absolute left-8 top-12 bottom-12 hidden w-px bg-zinc-200 sm:block" />

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon

              return (
                <article
                  key={step.number}
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                  className="group relative grid gap-6 rounded-[2.2rem] border border-zinc-200/80 bg-white p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-xl hover:shadow-zinc-950/5 sm:grid-cols-[72px_1fr]"
                >
                  {/* Step Number Badge */}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 font-mono text-base font-black text-white shadow-md shadow-zinc-950/20 group-hover:scale-105 transition-transform">
                    {step.number}
                  </div>

                  {/* Step Details */}
                  <div className="flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                        <h3 className="text-xl font-black tracking-tight text-zinc-950">
                          {step.title}
                        </h3>
                      </div>

                      <span className="rounded-full bg-zinc-100 border border-zinc-200/60 px-3 py-0.5 text-[11px] font-bold text-zinc-600">
                        {step.badge}
                      </span>
                    </div>

                    <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-500">
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
      <section className="border-t border-zinc-200/80 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Info */}
            <div data-aos="fade-right" className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                <Receipt size={13} />
                Sistem Invoice Digital WhatsApp
              </div>

              <h2 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl leading-tight">
                Harga Ditentukan Tim Kami, Invoice Resmi Langsung di WhatsApp Anda.
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-zinc-500">
                Setelah Anda memilih menu dan jumlah porsi di website, pesanan Anda tercatat langsung di dashboard admin kami.
                Tim Hara Chicken akan segera mengirimkan invoice resmi berisi rincian pesanan, konfirmasi ongkir,
                serta rekening pembayaran resmi.
              </p>

              <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold text-zinc-700">
                <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-[#fafaf9] px-3.5 py-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Rincian Porsi Jelas
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-[#fafaf9] px-3.5 py-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Rekening Bank Resmi
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-[#fafaf9] px-3.5 py-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Tercatat di Sistem
                </div>
              </div>
            </div>

            {/* Right Mockup Card of WhatsApp Invoice */}
            <div
              data-aos="fade-left"
              data-aos-delay="150"
              className="relative rounded-[2.5rem] border border-zinc-200 bg-[#fafaf9] p-6 sm:p-8 shadow-lg"
            >
              <div className="flex items-center gap-3 border-b border-zinc-200 pb-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-zinc-950">Admin Katering Hara Chicken</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">● Online • Fast Response</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 font-mono text-xs text-zinc-800 space-y-2 shadow-sm">
                <p className="font-bold text-emerald-700">*INVOICE PESANAN HARA CHICKEN*</p>
                <div className="text-zinc-400">===============================</div>
                <p>No. Pesanan: <span className="font-bold text-zinc-950">HB-20260903-XXXX</span></p>
                <p>Menu: <span className="font-bold text-zinc-950">Nasi Box Bento Katsu (30 Porsi)</span></p>
                <p>Tanggal Acara: <span className="font-bold text-zinc-950">12 Oktober 2026</span></p>
                <p>Alamat: <span className="font-bold text-zinc-950">Gedung Pertemuan Lt. 3</span></p>
                <div className="text-zinc-400">-------------------------------</div>
                <p className="font-bold text-zinc-950 text-sm">TOTAL TAGIHAN: Rp 750.000</p>
                <p className="text-[11px] text-zinc-500 font-sans mt-2">
                  Pembayaran: Bank BCA 1234567890 a/n Hara Chicken
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
        <div data-aos="fade-up" className="rounded-[2.5rem] border border-zinc-200/80 bg-white p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <HelpCircle size={15} className="text-zinc-900" />
            Tips Penting dari Kami
          </div>

          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Agar Pemesanan Anda Berjalan Sempurna
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {proTips.map((tip, idx) => (
              <div
                key={tip.title}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className="rounded-2xl border border-zinc-100 bg-[#fafaf9] p-6 space-y-2"
              >
                <h4 className="font-black text-sm text-zinc-950">{tip.title}</h4>
                <p className="text-xs leading-relaxed text-zinc-500">{tip.desc}</p>
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
          className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/90 bg-gradient-to-br from-white via-white to-zinc-50 p-8 sm:p-12 lg:p-16 shadow-[0_16px_40px_rgba(0,0,0,0.03)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-600 shadow-sm">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Siap Memesan?
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl leading-tight">
                Pilih Menu Katering Favorit Anda Sekarang.
              </h2>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-500 max-w-2xl">
                Tersedia beragam pilihan paket nasi box bento katsu, krisbar, dan nasi kuning dengan harga hemat serta rasa lezat.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-zinc-950 px-8 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Jelajahi Semua Menu</span>
                <ArrowRight size={16} />
              </Link>

              <a
                href="https://wa.me/6289669743193?text=Halo%20Hara%20Chicken,%20saya%20ingin%20tanya%20cara%20pemesanan%20katering."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-xs font-bold text-zinc-800 transition hover:bg-zinc-50"
              >
                <MessageCircle size={15} className="text-emerald-600" />
                Chat WhatsApp Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
