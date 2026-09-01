import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import HeroImg from '../assets/nasibox/nasi-kuning-dada-krispi.webp'
import HeroImg1 from '../assets/nasibox/bento-katsu-b.webp'
import HeroImg2 from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import HeroImg3 from '../assets/nasibox/rames-balado-b.webp'

const products = [
  {
    name: 'Nasi Box Bento Katsu',
    price: 'Mulai Rp18.000',
    description:
      'Pilihan praktis dengan ayam crispy yang cocok untuk berbagai kebutuhan acara.',
    image: HeroImg1,
  },
  {
    name: 'Nasi Box Ayam Krisbar',
    price: 'Mulai Rp22.000',
    description:
      'Menu nasi box dengan ayam dan pelengkap untuk makan bersama yang lebih lengkap.',
    image: HeroImg2,
  },
  {
    name: 'Nasi Box Rames Balado',
    price: 'Mulai Rp28.000',
    description:
      'Pilihan paket lengkap untuk meeting, gathering, keluarga, dan acara lainnya.',
    image: HeroImg3,
  },
]

const occasions = [
  {
    icon: Users,
    title: 'Meeting & Kantor',
    text: 'Praktis untuk makan siang, rapat, dan berbagai kebutuhan konsumsi kantor.',
  },
  {
    icon: CalendarDays,
    title: 'Acara Keluarga',
    text: 'Lengkapi acara keluarga dengan pilihan nasi box yang mudah dibagikan.',
  },
  {
    icon: ShoppingBag,
    title: 'Gathering',
    text: 'Solusi konsumsi untuk acara dengan jumlah tamu yang lebih banyak.',
  },
  {
    icon: MapPin,
    title: 'Acara Spesial',
    text: 'Cocok untuk pengajian, syukuran, ulang tahun, dan berbagai momen lainnya.',
  },
]

const benefits = [
  'Pilihan menu untuk berbagai kebutuhan acara',
  'Pemesanan praktis dan mudah',
  'Pilihan jumlah pesanan yang fleksibel',
]

export default function HomePage() {
  return (
    <div className="overflow-hidden bg-white">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative min-h-[760px] overflow-hidden bg-red-600 lg:min-h-[820px]">
        {/* Background decoration */}
        <div className="absolute -right-48 -top-48 h-[700px] w-[700px] rounded-full bg-red-500" />

        <div className="absolute -bottom-64 left-[25%] h-[600px] w-[600px] rounded-full bg-red-700/60" />

        <div className="absolute right-[8%] top-[28%] h-3 w-3 rounded-full bg-yellow-400" />

        <div className="absolute right-[12%] top-[48%] h-2 w-2 rounded-full bg-white/30" />

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-6 pb-16 pt-32 lg:min-h-[820px] lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:pt-20">
          {/* Copy */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-yellow-400" />

              <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
                HARA CHICKEN
              </p>
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-[70px]">
              Catering enak,
              <br />
              praktis untuk
              <br />
              <span className="text-yellow-300">momen spesial.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-red-100 sm:text-lg sm:leading-8">
              Nasi box untuk meeting, acara keluarga, gathering, pengajian,
              dan berbagai kebutuhan acara. Tinggal pilih menu, kami siapkan.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/order"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-7 py-4 text-sm font-black text-red-950 transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-300"
              >
                Pesan Sekarang

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-4 text-sm font-bold text-white transition duration-300 hover:border-white hover:bg-white/10"
              >
                Lihat Menu
              </Link>
            </div>

            {/* Small trust points */}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 text-sm text-white/75">
                <Check className="h-4 w-4 text-yellow-300" />
                Menu beragam
              </div>

              <div className="flex items-center gap-2 text-sm text-white/75">
                <Check className="h-4 w-4 text-yellow-300" />
                Cocok untuk acara
              </div>

              <div className="flex items-center gap-2 text-sm text-white/75">
                <Check className="h-4 w-4 text-yellow-300" />
                Pesan dengan mudah
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative z-10 lg:pl-4">
            <div className="relative mx-auto max-w-2xl">
              {/* Yellow frame */}
              <div className="absolute -bottom-5 -left-5 h-full w-full rounded-[2rem] bg-yellow-400 sm:-bottom-6 sm:-left-6" />

              {/* Image */}
              <div className="relative overflow-hidden rounded-[2rem] bg-yellow-300 shadow-2xl">
                <img
                  src={HeroImg}
                  alt="Nasi box Hara Chicken"
                  className="aspect-[5/4] w-full object-cover"
                />
              </div>

              {/* Price badge */}
              <div className="absolute -bottom-7 right-4 sm:right-8">
                <div className="rounded-2xl bg-white px-5 py-4 shadow-2xl ring-1 ring-black/5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Paket mulai dari
                  </p>

                  <p className="mt-0.5 text-2xl font-black tracking-tight text-red-600">
                    Rp18.000
                  </p>
                </div>
              </div>

              {/* Floating mini badge */}
              <div className="absolute -left-3 top-8 hidden rounded-2xl bg-yellow-400 px-4 py-3 shadow-xl sm:block">
                <p className="text-xs font-black text-red-950">
                  Nasi Box
                </p>

                <p className="text-[11px] font-medium text-red-950/70">
                  Siap untuk acara kamu
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          VALUE STRIP
      ====================================================== */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-gray-100 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          <div className="flex items-center gap-4 py-7 sm:px-7 lg:py-8 lg:first:pl-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-gray-950">Banyak Pilihan</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Menu untuk berbagai kebutuhan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-7 sm:px-7 lg:py-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-gray-950">Untuk Berbagai Acara</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Keluarga hingga kebutuhan kantor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-7 sm:px-7 lg:py-8 lg:last:pr-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-gray-950">Praktis Dipesan</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Proses pemesanan sederhana
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          INTRO / VALUE PROPOSITION
      ====================================================== */}
      <section className="bg-white px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">
              Kenapa Hara?
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-gray-950 sm:text-5xl">
              Acara sudah cukup ribet.
              <br />
              Urusan makanan
              <span className="text-red-600"> jangan.</span>
            </h2>
          </div>

          <div>
            <p className="max-w-2xl text-lg leading-8 text-gray-600">
              Menyiapkan konsumsi untuk banyak orang membutuhkan waktu dan
              perhatian. Hara Chicken hadir untuk membuat bagian tersebut
              menjadi lebih sederhana.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>

                  <span className="text-sm font-semibold text-gray-800">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/tentang-kami"
              className="group mt-9 inline-flex items-center gap-2 text-sm font-black text-red-600"
            >
              Kenal lebih dekat

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          MENU
      ====================================================== */}
      <section
        id="menu"
        className="bg-[#f7f5f2] px-6 py-24 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">
                Menu Pilihan
              </p>

              <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl">
                Mau <span className='text-yellow-500'>Makan</span> apa
                <br />
                hari ini?
              </h2>

              <p className="mt-4 max-w-lg text-base leading-7 text-gray-500">
                Beberapa pilihan menu yang bisa kamu pesan untuk berbagai
                kebutuhan acara.
              </p>
            </div>

            <Link
              to="/menu"
              className="group inline-flex items-center gap-2 text-sm font-black text-red-600"
            >
              Lihat semua menu

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10"
              >
                <Link to="/menu" className="block">
                  <div className="relative overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-black text-red-600 shadow-sm">
                      {index === 0 ? 'Favorit' : 'Pilihan Menu'}
                    </div>

                    <div className="absolute bottom-4 right-4 rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white shadow-lg">
                      {product.price}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-black leading-tight text-gray-950">
                        {product.name}
                      </h3>

                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-red-600" />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>

                    <div className="mt-6 flex items-center text-sm font-bold text-red-600">
                      Lihat menu
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          OCCASIONS
      ====================================================== */}
      <section className="bg-white px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">
              Cocok Untuk Apa?
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl">
              Satu
                <span className='text-yellow-500'> Catering</span>
                ,
              <br />
              banyak momen.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {occasions.map((item) => {
              const Icon = item.icon

              return (
                <article
                  key={item.title}
                  className="group rounded-[1.5rem] border border-gray-100 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-xl hover:shadow-red-950/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition duration-300 group-hover:bg-red-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-7 text-lg font-black text-gray-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    {item.text}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section className="bg-gray-950 px-6 py-24 text-white lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
                Cara Pesan
              </p>

              <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Gampang.
                <br />
                Tinggal pilih
                <br />
                dan pesan.
              </h2>

              <Link
                to="/cara-pesan"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-yellow-400"
              >
                Lihat cara pesan

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-0 border-t border-white/10">
              {[
                {
                  number: '01',
                  title: 'Pilih menu',
                  text: 'Temukan paket catering yang sesuai dengan kebutuhan acara kamu.',
                },
                {
                  number: '02',
                  title: 'Isi detail pesanan',
                  text: 'Masukkan jumlah pesanan, tanggal, waktu, dan informasi acara.',
                },
                {
                  number: '03',
                  title: 'Konfirmasi',
                  text: 'Periksa kembali pesanan sebelum dikonfirmasi.',
                },
                {
                  number: '04',
                  title: 'Kami proses',
                  text: 'Tim Hara Chicken memproses pesanan sesuai detail yang diberikan.',
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="grid gap-5 border-b border-white/10 py-7 sm:grid-cols-[70px_1fr]"
                >
                  <span className="text-sm font-black text-yellow-400">
                    {step.number}
                  </span>

                  <div>
                    <h3 className="text-xl font-bold">{step.title}</h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="bg-yellow-400 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-900/60">
              Siap untuk acara kamu?
            </p>

            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[1] tracking-tight text-red-950 sm:text-5xl lg:text-6xl">
              Biar urusan makanan,
              <br />
              Hara yang siapkan.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-red-950/65">
              Pilih menu yang kamu suka dan mulai siapkan catering untuk acara
              kamu.
            </p>
          </div>

          <Link
            to="/order"
            className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-red-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-red-900/20 transition duration-300 hover:-translate-y-1 hover:bg-red-700"
          >
            Pesan Sekarang

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}
