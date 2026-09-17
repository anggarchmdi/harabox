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
import { useThemeStore } from '../stores/theme.store'

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

  useEffect(() => {
    const timer = setTimeout(() => {
      AOS.refreshHard()
      AOS.refresh()
      window.dispatchEvent(new Event('scroll'))
    }, 120)
    return () => clearTimeout(timer)
  }, [theme])

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
        text="Memuat Cerita Dapur Pawon Hara..."
        subtext="Mengenal komitmen rasa, sertifikasi halal, dan standar higienis kami"
        minDuration={650}
      />

      {/* Header */}
      <Summary
        eyebrow="TENTANG PAWON HARA"
        title="Lebih Dari Sekadar Katering Nasi Box"
        description="Menyajikan kelezatan otentik khas Nusantara, higienitas terjaga, dan pelayanan yang dapat diandalkan untuk menyempurnakan setiap pertemuan penting Anda."
      />

      {/* =====================================================
          SECTION 1: EDITORIAL STORY WITH LUXURY SHOWCASE
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Text Story */}
          <div data-aos="fade-right" className="space-y-6">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] shadow-sm ${
                isDark
                  ? 'border-[#F59E0B]/40 bg-[#60241E] text-amber-300'
                  : 'border-[#D97706]/40 bg-[#FAF0E4] text-[#8C4320]'
              }`}
            >
              <Sparkles size={13} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
              Dedikasi Kami
            </div>

            <h2
              className={`text-3xl font-dhaksinarga tracking-wide sm:text-5xl leading-tight ${
                isDark ? 'text-white' : 'text-[#2B120E]'
              }`}
            >
              Menghadirkan Makanan Lezat, Menghubungkan Momen Berharga.
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-amber-100/75' : 'text-[#6B423A]'}`}>
              Pawon Hara berawal dari keyakinan sederhana: bahwa makanan yang lezat, higienis,
              dan tiba tepat waktu adalah kunci utama keberhasilan setiap acara kumpul bersama.
            </p>

            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-amber-100/75' : 'text-[#6B423A]'}`}>
              Kami menyadari bahwa mempersiapkan konsumsi untuk puluhan hingga ratusan orang bukanlah hal yang mudah.
              Oleh sebab itu, Pawon Hara hadir dengan alur pemesanan yang ringkas, pilihan menu bento & nasi box
              yang komprehensif, serta fleksibilitas harga dan invoice katering resmi yang dapat disesuaikan dengan anggaran acara Anda.
            </p>

            <div
              className={`pt-4 border-t flex items-center gap-6 ${
                isDark ? 'border-[#60241E]/80' : 'border-[#EFE5D8]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[#F59E0B]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} className="fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className={`text-xs font-bold ${isDark ? 'text-amber-200/80' : 'text-[#5C3831]'}`}>
                Dipercaya oleh instansi pemerintah, BUMN, korporasi swasta, dan ribuan keluarga.
              </p>
            </div>
          </div>

          {/* Visual Showcase Stack */}
          <div data-aos="fade-left" className="relative">
            <div
              className={`relative overflow-hidden rounded-[2.5rem] border p-3 shadow-2xl ${
                isDark
                  ? 'border-[#60241E]/80 bg-[#2D120F]'
                  : 'border-[#E6DACD] bg-white shadow-[#2B120E]/5'
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[2rem]">
                <img
                  src={BentoKatsuImg}
                  alt="Pawon Hara Bento Katsu"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Overlapping secondary image card */}
            <div
              data-aos="zoom-in"
              data-aos-delay="200"
              className={`absolute -bottom-8 -right-4 w-48 sm:w-56 overflow-hidden rounded-2xl border-4 shadow-2xl transition-transform hover:scale-105 hidden sm:block ${
                isDark ? 'border-[#1C0B09] bg-[#2D120F]' : 'border-white bg-white shadow-xl'
              }`}
            >
              <img
                src={RamesBaladoImg}
                alt="Nasi Rames Balado"
                className="aspect-square w-full object-cover"
              />
              <div
                className={`p-2.5 text-center border-t ${
                  isDark
                    ? 'bg-[#2D120F] border-[#60241E]/60'
                    : 'bg-white border-[#EFE5D8]'
                }`}
              >
                <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                  Nasi Rames Balado
                </p>
                <p className={`text-[10px] ${isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'}`}>
                  Favorit Acara Kantor
                </p>
              </div>
            </div>

            {/* Overlapping floating badge */}
            <div
              data-aos="zoom-in"
              data-aos-delay="300"
              className={`absolute -top-6 -left-4 max-w-[240px] rounded-2xl border p-4 shadow-xl backdrop-blur-md hidden sm:block ${
                isDark
                  ? 'border-[#60241E] bg-[#2D120F]/95'
                  : 'border-[#E6DACD] bg-white/95 shadow-[#2B120E]/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#60241E] text-[#F59E0B] ring-1 ring-[#F59E0B]/30">
                  <Award size={20} />
                </div>
                <div>
                  <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                    Kualitas Prima
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-amber-100/60' : 'text-[#8C6B62]'}`}>
                    Rasa konsisten & selalu fresh.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 2: METRICS / STATISTICS (LUXURY CARDS)
      ====================================================== */}
      <section
        className={`border-y py-16 transition-colors duration-300 ${
          isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-[#E6DACD] bg-[#F5EDE4]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((stat, idx) => (
              <div
                key={stat.label}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className={`rounded-3xl border p-7 text-center transition-all duration-300 shadow-lg ${
                  isDark
                    ? 'border-[#60241E]/80 bg-[#2D120F] hover:border-[#F59E0B]/40 hover:bg-[#361613]'
                    : 'border-[#E6DACD] bg-white hover:border-[#D97706]/40 hover:bg-[#FAF5EE]'
                }`}
              >
                <p className="text-4xl font-black tracking-tight text-[#F59E0B] font-poppins">
                  <StatCounter
                    target={stat.target}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </p>
                <p
                  className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-amber-200/60' : 'text-[#8C6B62]'
                  }`}
                >
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
          <p
            className={`text-xs font-bold uppercase tracking-[0.25em] ${
              isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
            }`}
          >
            Prinsip & Nilai Kami
          </p>
          <h2
            className={`mt-3 text-3xl font-dhaksinarga tracking-wide sm:text-5xl ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}
          >
            Hal Yang Selalu Kami Jaga
          </h2>
          <p className={`mt-4 text-sm sm:text-base leading-relaxed ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
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
                className={`group flex flex-col justify-between rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1.5 shadow-lg ${
                  isDark
                    ? 'border-[#60241E]/80 bg-[#2D120F] hover:border-[#F59E0B]/50 hover:bg-[#361613]'
                    : 'border-[#E6DACD] bg-white hover:border-[#D97706]/50 hover:bg-[#FCF9F5] shadow-[#2B120E]/5'
                }`}
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60241E] to-[#95271D] text-[#F59E0B] transition-colors group-hover:bg-[#F59E0B] group-hover:text-[#1C0B09] ring-1 ring-[#F59E0B]/30">
                    <Icon size={22} />
                  </div>

                  <h3
                    className={`mt-6 text-lg font-dhaksinarga tracking-wide transition-colors ${
                      isDark ? 'text-white group-hover:text-[#F59E0B]' : 'text-[#2B120E] group-hover:text-[#D97706]'
                    }`}
                  >
                    {v.title}
                  </h3>

                  <p
                    className={`mt-3 text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                    }`}
                  >
                    {v.description}
                  </p>
                </div>

                <div
                  className={`mt-6 pt-4 border-t flex items-center gap-1 text-[11px] font-bold ${
                    isDark
                      ? 'border-[#60241E]/60 text-amber-200/50 group-hover:text-[#F59E0B]'
                      : 'border-[#EFE5D8] text-[#8C6B62] group-hover:text-[#D97706]'
                  }`}
                >
                  <span>Standar Pawon Hara</span>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          SECTION 4: KENAPA MEMILIH PAWON HARA?
      ====================================================== */}
      <section
        className={`border-t py-20 lg:py-28 transition-colors duration-300 ${
          isDark ? 'border-[#60241E]/80 bg-[#200B09]' : 'border-[#E0D2C2] bg-[#EFE5D8]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div data-aos="fade-right">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                  isDark
                    ? 'border-[#F59E0B]/40 bg-[#60241E] text-amber-300'
                    : 'border-[#D97706]/40 bg-[#FAF0E4] text-[#8C4320]'
                }`}
              >
                <Users size={13} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                Partner Katering Terpercaya
              </div>

              <h2
                className={`mt-4 text-3xl font-dhaksinarga tracking-wide sm:text-5xl leading-tight ${
                  isDark ? 'text-white' : 'text-[#2B120E]'
                }`}
              >
                Dirancang Agar Urusan Konsumsi Menjadi Sangat Mudah
              </h2>

              <p className={`mt-5 text-sm sm:text-base leading-relaxed ${isDark ? 'text-amber-100/75' : 'text-[#5C3831]'}`}>
                Anda tidak perlu bingung menghitung anggaran atau mencemaskan rasa makanan yang tidak konsisten.
                Cukup pilih menu favorit di website, tentukan jumlah porsi kelipatan 10, dan kami urus selebihnya.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] px-6 py-3.5 text-xs font-black text-[#1C0B09] shadow-md shadow-[#F59E0B]/20 transition hover:scale-105"
                >
                  Jelajahi Pilihan Menu
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to="/cara-pesan"
                  className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3.5 text-xs font-bold transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#2D120F] text-white hover:bg-[#3B1814]'
                      : 'border-[#E6DACD] bg-white text-[#2B120E] hover:bg-[#FAF4ED]'
                  }`}
                >
                  Cara Pesan
                </Link>
              </div>
            </div>

            {/* Checkmark List in Dark Card */}
            <div
              data-aos="fade-left"
              data-aos-delay="150"
              className={`rounded-[2.5rem] border p-8 sm:p-10 shadow-xl space-y-5 ${
                isDark
                  ? 'border-[#60241E]/80 bg-[#2D120F]'
                  : 'border-[#E6DACD] bg-white shadow-[#2B120E]/5'
              }`}
            >
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#60241E] text-[#F59E0B] mt-0.5 ring-1 ring-[#F59E0B]/30">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${isDark ? 'text-amber-100/90' : 'text-[#5C3831]'}`}>
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
                Konsultasi & Invoice Katering
              </div>

              <h2
                className={`mt-4 text-3xl font-dhaksinarga tracking-wide sm:text-4xl lg:text-5xl leading-tight ${
                  isDark ? 'text-white' : 'text-[#2B120E]'
                }`}
              >
                Rencanakan Konsumsi Acara Anda Bersama Kami
              </h2>

              <p className={`mt-4 text-sm sm:text-base leading-relaxed max-w-2xl ${isDark ? 'text-amber-100/75' : 'text-[#5C3831]'}`}>
                Hubungi tim admin katering kami langsung via WhatsApp untuk mendiskusikan kebutuhan acara,
                pengiriman invoice penawaran resmi, serta ketersediaan jadwal dapur.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <a
                href="https://wa.me/6289669743193?text=Halo%20Pawon%20Hara,%20saya%20ingin%20konsultasi%20pesanan%20katering%20untuk%20acara%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49] px-8 py-4 text-sm font-black text-[#1C0B09] shadow-xl shadow-[#F59E0B]/25 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle size={18} />
                Hubungi Admin WhatsApp
              </a>

              <Link
                to="/menu"
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3.5 text-xs font-bold transition ${
                  isDark
                    ? 'border-[#E77B49]/50 bg-[#1C0B09] text-white hover:bg-[#250D0A]'
                    : 'border-[#E6DACD] bg-white text-[#2B120E] hover:bg-[#FAF4ED]'
                }`}
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
