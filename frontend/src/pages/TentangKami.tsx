import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Utensils,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AOS from 'aos'

import Summary from '../components/ui/Summary'
import PageLoader from '../components/ui/PageLoader'
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'

const values = [
  {
    icon: Utensils,
    title: 'Cita Rasa Gurih Meresap',
    description:
      'Setiap menu diolah menggunakan racikan bumbu rempah pilihan dan ayam berkualitas segar, menghasilkan cita rasa gurih yang meresap hingga ke serat terdalam.',
  },
  {
    icon: ShieldCheck,
    title: '100% Halal & Higienis',
    description:
      'Dapur katering kami menerapkan standar kebersihan yang ketat, sertifikasi halal, dan pengemasan bento/box higienis siap santap.',
  },
  {
    icon: Clock,
    title: 'Pengantaran Disiplin & Tepat Waktu',
    description:
      'Kami mengerti betapa krusialnya jadwal makan pada acara Anda. Armada pengantaran kami memastikan pesanan tiba hangat sebelum acara dimulai.',
  },
  {
    icon: HeartHandshake,
    title: 'Pelayanan Ramah & Invoice Resmi',
    description:
      'Dari konsultasi porsi, kustomisasi menu, hingga penerbitan invoice resmi untuk kebutuhan administrasi perusahaan, tim kami melayani dengan sigap.',
  },
]

interface StatItem {
  target: number
  decimals?: number
  prefix?: string
  suffix?: string
  label: string
}

const statistics: StatItem[] = [
  { target: 50000, suffix: '+', label: 'Porsi Sukses Disajikan' },
  { target: 4.9, decimals: 1, suffix: ' / 5', label: 'Tingkat Kepuasan Klien' },
  { target: 99.8, decimals: 1, suffix: '%', label: 'Ketepatan Waktu Antar' },
  { target: 2000, suffix: '+', label: 'Kapasitas Harian (Porsi)' },
]

function StatCounter({
  target,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 2000,
}: {
  target: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return decimals > 0 ? (0).toFixed(decimals) : '0'
  })
  const containerRef = useRef<HTMLSpanElement>(null)
  const animatedRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true
          observer.disconnect()

          let startTimestamp: number | null = null
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)

            // Ease-out Quart curve for a snappy start and smooth landing
            const easeProgress = 1 - Math.pow(1 - progress, 4)
            const currentVal = easeProgress * target

            if (decimals > 0) {
              setDisplayValue(currentVal.toFixed(decimals))
            } else {
              setDisplayValue(Math.floor(currentVal).toLocaleString('id-ID'))
            }

            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              if (decimals > 0) {
                setDisplayValue(target.toFixed(decimals))
              } else {
                setDisplayValue(target.toLocaleString('id-ID'))
              }
            }
          }

          requestAnimationFrame(step)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [target, decimals, duration])

  return (
    <span ref={containerRef} className="tabular-nums">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  )
}

const highlights = [
  'Solusi katering praktis untuk seminar, meeting kantor, gathering, syukuran, dan pengajian.',
  'Pilihan porsi fleksibel dengan sistem kelipatan 10 porsi (mulai dari minimal 10 porsi).',
  'Pengemasan bento box eksklusif, rapi, lengkap dengan alat makan dan tisu berkualitas.',
  'Dukungan invoice resmi dan sistem pencatatan order digital yang terpantau.',
]

export default function TentangKami() {
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
        text="Memuat Cerita Dapur Hara Chicken..."
        subtext="Mengenal komitmen rasa, sertifikasi halal, dan standar higienis kami"
        minDuration={650}
      />

      {/* Header */}
      <Summary
        eyebrow="TENTANG HARA CHICKEN"
        title="Lebih Dari Sekadar Katering Nasi Box."
        description="Menyajikan kelezatan otentik, higienitas terjaga, dan pelayanan yang dapat diandalkan untuk menyempurnakan setiap pertemuan penting Anda."
      />

      {/* =====================================================
          SECTION 1: EDITORIAL STORY WITH LUXURY SHOWCASE
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Text Story */}
          <div data-aos="fade-right" className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-700 shadow-sm">
              <Sparkles size={13} className="text-amber-500" />
              Dedikasi Kami
            </div>

            <h2 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl leading-tight">
              Menghadirkan Makanan Lezat, Menghubungkan Momen Berharga.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-600">
              Hara Chicken berawal dari keyakinan sederhana: bahwa makanan yang lezat, higienis,
              dan tiba tepat waktu adalah kunci utama keberhasilan setiap acara kumpul bersama.
            </p>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-600">
              Kami menyadari bahwa mempersiapkan konsumsi untuk puluhan hingga ratusan orang bukanlah hal yang mudah.
              Oleh sebab itu, Hara Chicken hadir dengan alur pemesanan yang ringkas, pilihan menu bento & nasi box
              yang komprehensif, serta fleksibilitas harga dan invoice katering resmi yang dapat disesuaikan dengan anggaran acara Anda.
            </p>

            <div className="pt-4 border-t border-zinc-200/80 flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs font-bold text-zinc-700">
                Dipercaya oleh instansi pemerintah, BUMN, korporasi swasta, dan ribuan keluarga.
              </p>
            </div>
          </div>

          {/* Visual Showcase Stack */}
          <div data-aos="fade-left" className="relative">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/80 bg-white p-3 shadow-xl">
              <div className="aspect-[4/3] overflow-hidden rounded-[2rem]">
                <img
                  src={BentoKatsuImg}
                  alt="Hara Chicken Bento Katsu"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Overlapping secondary image card */}
            <div
              data-aos="zoom-in"
              data-aos-delay="200"
              className="absolute -bottom-8 -right-4 w-48 sm:w-56 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl transition-transform hover:scale-105 hidden sm:block"
            >
              <img
                src={RamesBaladoImg}
                alt="Nasi Rames Balado"
                className="aspect-square w-full object-cover"
              />
              <div className="p-2.5 text-center bg-white">
                <p className="text-[11px] font-black text-zinc-950">Nasi Rames Balado</p>
                <p className="text-[10px] text-zinc-400">Favorit Acara Kantor</p>
              </div>
            </div>

            {/* Overlapping floating badge */}
            <div
              data-aos="zoom-in"
              data-aos-delay="300"
              className="absolute -top-6 -left-4 max-w-[240px] rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-950">Kualitas Prima</p>
                  <p className="text-[10px] text-zinc-500">Rasa konsisten & selalu fresh.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 2: METRICS / STATISTICS (LUXURY CARDS)
      ====================================================== */}
      <section className="border-y border-zinc-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((stat, idx) => (
              <div
                key={stat.label}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className="rounded-3xl border border-zinc-100 bg-[#fafaf9] p-7 text-center transition-all duration-300 hover:border-zinc-300 hover:bg-white hover:shadow-md"
              >
                <p className="text-4xl font-black tracking-tight text-zinc-950">
                  <StatCounter
                    target={stat.target}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 3: VALUES & PILLARS
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div data-aos="fade-up" className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
            Prinsip & Nilai Kami
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            Hal Yang Selalu Kami Jaga
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-500 leading-relaxed">
            Komitmen tak tertandingi di setiap box hidangan yang kami sajikan ke meja acara Anda.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, idx) => {
            const Icon = v.icon
            return (
              <div
                key={v.title}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className="group flex flex-col justify-between rounded-[2rem] border border-zinc-200/80 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-zinc-400 hover:shadow-xl hover:shadow-zinc-950/5"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 transition-colors group-hover:bg-zinc-950 group-hover:text-white">
                    <Icon size={22} />
                  </div>

                  <h3 className="mt-6 text-lg font-black tracking-tight text-zinc-950">
                    {v.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-500">
                    {v.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-1 text-[11px] font-bold text-zinc-400 group-hover:text-zinc-900">
                  <span>Standar Hara Chicken</span>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          SECTION 4: KENAPA MEMILIH HARA CHICKEN?
      ====================================================== */}
      <section className="border-t border-zinc-200/80 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div data-aos="fade-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-700">
                <Users size={13} className="text-zinc-900" />
                Partner Katering Terpercaya
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl leading-tight">
                Dirancang Agar Urusan Konsumsi Menjadi Sangat Mudah.
              </h2>

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-zinc-500">
                Anda tidak perlu bingung menghitung anggaran atau mencemaskan rasa makanan yang tidak konsisten.
                Cukup pilih menu favorit di website, tentukan jumlah porsi kelipatan 10, dan kami urus selebihnya.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-zinc-800"
                >
                  Jelajahi Pilihan Menu
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/cara-pesan"
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-xs font-bold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Cara Pesan
                </Link>
              </div>
            </div>

            {/* Checkmark List in Crisp White Card */}
            <div
              data-aos="fade-left"
              data-aos-delay="150"
              className="rounded-[2.5rem] border border-zinc-200/80 bg-[#fafaf9] p-8 sm:p-10 shadow-sm space-y-5"
            >
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed text-zinc-800">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 5: BOTTOM CONSULTATION CTA
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div
          data-aos="zoom-in"
          data-aos-duration="650"
          className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/90 bg-gradient-to-br from-white via-white to-zinc-50 p-8 sm:p-12 lg:p-16 shadow-[0_16px_40px_rgba(0,0,0,0.03)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-600 shadow-sm">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Konsultasi & Invoice Katering
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl leading-tight">
                Rencanakan Konsumsi Acara Anda Bersama Kami.
              </h2>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-500 max-w-2xl">
                Hubungi tim admin katering kami langsung via WhatsApp untuk mendiskusikan kebutuhan acara,
                pengiriman invoice penawaran resmi, serta ketersediaan jadwal dapur.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <a
                href="https://wa.me/6289669743193?text=Halo%20Hara%20Chicken,%20saya%20ingin%20konsultasi%20pesanan%20katering%20untuk%20acara%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageCircle size={18} />
                Hubungi Admin WhatsApp
              </a>

              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-xs font-bold text-zinc-800 transition hover:bg-zinc-50"
              >
                Lihat Koleksi Menu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
