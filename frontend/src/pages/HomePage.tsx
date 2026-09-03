import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
  UtensilsCrossed,
} from 'lucide-react'

import { productService } from '../services/products.service'
import { getImageUrl } from '../utils/image'
import type { Product } from '../types/products'

import HeroImg from '../assets/banners1.jpeg'
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'

// Curated fallback data untuk produk unggulan jika offline/loading
interface CuratedProduct {
  name: string
  price: string
  priceNum: number
  category: string
  badge: string
  rating: string
  reviews: number
  description: string
  image: string
  slug: string
  minOrder: number
}

const curatedFeaturedProducts: CuratedProduct[] = [
  {
    name: 'Nasi Box Bento Katsu',
    price: 'Rp 18.000',
    priceNum: 18000,
    category: 'bento',
    badge: 'Favorit',
    rating: '4.9',
    reviews: 142,
    description:
      'Chicken katsu renyah keemasan, nasi putih pulen, salad segar dengan saus spesial dan sambal pilihan.',
    image: BentoKatsuImg,
    slug: 'nasi-box-bento-katsu',
    minOrder: 10,
  },
  {
    name: 'Nasi Box Ayam Krisbar Paha',
    price: 'Rp 22.000',
    priceNum: 22000,
    category: 'krisbar',
    badge: 'Best Seller',
    rating: '5.0',
    reviews: 218,
    description:
      'Ayam krispi bakar dengan saus bakar manis gurih meresap, lalapan segar, tahu tempe, dan sambal nagih.',
    image: KrisbarPahaImg,
    slug: 'nasi-box-ayam-krisbar-paha',
    minOrder: 10,
  },
  {
    name: 'Nasi Box Rames Balado Komplit',
    price: 'Rp 28.000',
    priceNum: 28000,
    category: 'rames',
    badge: 'Paling Lengkap',
    rating: '4.9',
    reviews: 184,
    description:
      'Lauk ayam balado pedas manis gurih, mie goreng gurih, telur balado, sambal goreng kentang, dan kerupuk.',
    image: RamesBaladoImg,
    slug: 'nasi-box-rames-balado',
    minOrder: 10,
  },
  {
    name: 'Nasi Kuning Paha Krispi Spesial',
    price: 'Rp 24.000',
    priceNum: 24000,
    category: 'kuning',
    badge: 'Acara Syukuran',
    rating: '4.9',
    reviews: 165,
    description:
      'Nasi kuning santan harum gurih, ayam paha renyah, orek tempe manis, telur iris, dan sambal bajak istimewa.',
    image: NasiKuningPahaImg,
    slug: 'nasi-kuning-paha-krispi',
    minOrder: 15,
  },
  {
    name: 'Nasi Box Bento Telur Mata Sapi',
    price: 'Rp 16.000',
    priceNum: 16000,
    category: 'bento',
    badge: 'Ekonomis',
    rating: '4.8',
    reviews: 96,
    description:
      'Menu sarapan dan meeting praktis dengan telur mata sapi omega, sosis goreng, tumis buncis, dan saus lezat.',
    image: BentoTelurImg,
    slug: 'nasi-box-bento-telur',
    minOrder: 10,
  },
  {
    name: 'Nasi Box Ayam Krisbar Dada',
    price: 'Rp 24.000',
    priceNum: 24000,
    category: 'krisbar',
    badge: 'Porsi Mantap',
    rating: '4.9',
    reviews: 110,
    description:
      'Potongan dada ayam krispi panggang berlumur saus bakar rahasia, porsi daging tebal mengenyangkan.',
    image: KrisbarDadaImg,
    slug: 'nasi-box-ayam-krisbar-dada',
    minOrder: 10,
  },
]

// Mapping gambar fallback untuk produk API
function resolveProductImage(item: Product): string {
  const url = getImageUrl(item.image)
  if (url) return url

  const name = item.name.toLowerCase()
  if (name.includes('katsu') || name.includes('bento')) return BentoKatsuImg
  if (name.includes('telur') || name.includes('mata sapi')) return BentoTelurImg
  if (name.includes('krisbar') || name.includes('geprek') || name.includes('krispi')) {
    return name.includes('dada') ? KrisbarDadaImg : KrisbarPahaImg
  }
  if (name.includes('kuning') || name.includes('tumpeng')) {
    return name.includes('paha') ? NasiKuningPahaImg : NasiKuningBaladoImg
  }
  if (name.includes('rames') || name.includes('rendang') || name.includes('balado')) {
    return name.includes('paha') ? RamesPahaImg : RamesBaladoImg
  }
  return EkonomisBaladoImg
}

const occasions = [
  {
    icon: Users,
    title: 'Meeting & Acara Kantor',
    tag: 'Bisnis & Formal',
    text: 'Sajian praktis, rapi, dan higienis yang menjaga kesan profesional untuk tamu perusahaan dan rekan kerja.',
    textColor: 'text-amber-600',
  },
  {
    icon: CalendarDays,
    title: 'Syukuran & Acara Keluarga',
    tag: 'Hangat & Akrab',
    text: 'Hidangan kaya rasa yang disukai semua generasi dari anak-anak hingga kakek-nenek, bebas repot masak di dapur.',
    textColor: 'text-red-600',
  },
  {
    icon: ShoppingBag,
    title: 'Gathering & Komunitas',
    tag: 'Skala Besar',
    text: 'Kapasitas produksi hingga ratusan box dengan kualitas rasa dan temperatur yang tetap terjaga sampai dibagikan.',
    textColor: 'text-emerald-600',
  },
  {
    icon: MapPin,
    title: 'Pengajian & Momen Spesial',
    tag: 'Halal & Berkah',
    text: 'Dikemas rapat dan bersih, mudah dibawa pulang oleh para tamu, siap santap dengan kelengkapan alat makan.',
    textColor: 'text-blue-600',
  },
]

const trustPillars = [
  {
    icon: Flame,
    title: 'Rasa Gurih Meresap',
    description: 'Resep bumbu marinasi otentik berpadu sambal khas yang bikin nagih.',
  },
  {
    icon: Truck,
    title: 'Pasti Tepat Waktu',
    description: 'Garansi tiba sebelum acara dimulai dalam kondisi hangat dan siap santap.',
  },
  {
    icon: ShieldCheck,
    title: 'Kemasan Rapi & Higienis',
    description: 'Box tebal food-grade, higienis, lengkap dengan sendok, tisu, dan tusuk gigi.',
  },
  {
    icon: Award,
    title: 'Harga Bersahabat',
    description: 'Pilihan menu mulai Rp 16.000 dengan porsi pas dan mengenyangkan.',
  },
]

const faqs = [
  {
    question: 'Berapa minimal pemesanan nasi box di Hara Chicken?',
    answer:
      'Minimal pemesanan sangat terjangkau, yaitu mulai dari 10 box untuk menu reguler. Untuk pesanan dalam jumlah besar (di atas 100 box), kami sarankan konfirmasi minimal H-2 agar tim dapur dapat menjadwalkan dengan optimal.',
  },
  {
    question: 'Berapa hari sebelumnya saya harus memesan?',
    answer:
      'Untuk pesanan reguler (10 - 50 box), pemesanan dapat dilakukan H-1 sebelum jam 17.00 WIB. Untuk pesanan skala besar (> 100 box), disarankan H-2 atau H-3 agar pilihan menu dan kustomisasi dapat disiapkan maksimal.',
  },
  {
    question: 'Apakah bisa kustomisasi menu atau request lauk khusus?',
    answer:
      'Tentu saja bisa! Anda dapat berkonsultasi dengan admin WhatsApp kami untuk menyesuaikan lauk, tingkat kepedasan sambal, atau request buah/puding tambahan sesuai anggaran acara Anda.',
  },
  {
    question: 'Bagaimana metode pembayaran dan pengantarannya?',
    answer:
      'Pembayaran dapat dilakukan melalui transfer bank resmi (BCA/Mandiri). Pesanan akan diantar langsung oleh kurir katering kami tepat waktu sesuai jam yang disepakati.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  // State form rekomendasi / summary home
  const [plannerDate, setPlannerDate] = useState('')
  const [deliveryArea, setDeliveryArea] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')

  // State untuk kategori filter menu
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // State untuk accordion FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Ambil data produk real dari API
  const { data: apiProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
    staleTime: 60_000,
  })

  // Format list menu yang ditampilkan
  const displayProducts = (() => {
    if (!loadingProducts && apiProducts && apiProducts.length > 0) {
      const activeList = apiProducts.filter((p) => p.is_active)
      if (selectedCategory === 'all') return activeList.slice(0, 6)

      return activeList
        .filter((p) => {
          const name = p.name.toLowerCase()
          if (selectedCategory === 'bento') return name.includes('bento') || name.includes('katsu')
          if (selectedCategory === 'krisbar') return name.includes('krisbar') || name.includes('bakar')
          if (selectedCategory === 'kuning') return name.includes('kuning')
          if (selectedCategory === 'rames') return name.includes('rames') || name.includes('balado')
          return true
        })
        .slice(0, 6)
    }

    if (selectedCategory === 'all') return curatedFeaturedProducts
    return curatedFeaturedProducts.filter((p) => p.category === selectedCategory)
  })()

  const handleRecommendationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/menu')
  }

  const whatsappUrl =
    'https://wa.me/6289669743193?text=' +
    encodeURIComponent('Halo Hara Chicken, saya ingin konsultasi pemesanan katering nasi box untuk acara saya.')

  return (
    <div className="overflow-hidden bg-[#fafaf9] text-zinc-900 selection:bg-red-600 selection:text-white">
      {/* =====================================================
          1. HERO BANNER & FLOATING RECOMMENDATION CARD (SUMMARY HOME)
      ====================================================== */}
      <section className="w-full h-[400px] xl:h-[600px] bg-gray-100 relative">
        <div className="w-full absolute z-10 h-[600px] bg-black/10" />
        <img
          src={HeroImg}
          alt="Hara Chicken Catering"
          className="w-full h-full object-cover"
        />

        {/* Floating Recommendation Card */}
        <div className="absolute z-20 w-full px-4 -translate-y-28 md:-translate-y-32 xl:-translate-y-36">
          <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white px-6 py-7 shadow-[0_10px_40px_rgba(0,0,0,0.12)] md:px-10 border border-zinc-100">
            {/* Heading */}
            <div className="mb-7 text-center">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                Bingung mau pesan apa?
                <span className="ml-1 font-normal text-gray-500">
                  Yuk, kami pilihkan menu terbaik!
                </span>
              </h1>
            </div>

            {/* Form */}
            <form
              onSubmit={handleRecommendationSubmit}
              className="flex flex-col gap-5 xl:flex-row xl:items-end xl:gap-4"
            >
              {/* Tanggal Acara */}
              <div className="flex-1">
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Tanggal Acara
                </label>

                <div className="flex h-11 items-center gap-3 border-b border-gray-300 px-1 transition-colors focus-within:border-red-500">
                  <CalendarDays
                    size={18}
                    strokeWidth={1.8}
                    className="text-red-500 shrink-0"
                  />

                  <input
                    type="date"
                    value={plannerDate}
                    onChange={(e) => setPlannerDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Daerah Pengantaran */}
              <div className="flex-1">
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Daerah Pengantaran
                </label>

                <div className="flex h-11 items-center gap-3 border-b border-gray-300 px-1 transition-colors focus-within:border-red-500">
                  <MapPin
                    size={18}
                    strokeWidth={1.8}
                    className="text-red-500 shrink-0"
                  />

                  <select
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="">Pilih Lokasi</option>
                    <option value="Kota Yogyakarta">Kota Yogyakarta</option>
                    <option value="Kabupaten Sleman">Sleman</option>
                    <option value="Kabupaten Bantul">Bantul</option>
                    <option value="Kabupaten Kulon Progo">Kulon Progo</option>
                    <option value="Kabupaten Gunung Kidul">Gunung Kidul</option>
                  </select>
                </div>
              </div>

              {/* Jam Pengantaran */}
              <div className="flex-1">
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Jam Pengantaran
                </label>

                <div className="flex h-11 items-center gap-3 border-b border-gray-300 px-1 transition-colors focus-within:border-red-500">
                  <Clock3
                    size={18}
                    strokeWidth={1.8}
                    className="text-red-500 shrink-0"
                  />

                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="">Pilih Waktu</option>
                    <option value="Pagi (07:00 - 10:00)">Pagi (07:00 - 10:00)</option>
                    <option value="Siang (11:00 - 13:00)">Siang (11:00 - 13:00)</option>
                    <option value="Sore (15:00 - 17:00)">Sore (15:00 - 17:00)</option>
                    <option value="Malam (18:00 - 20:00)">Malam (18:00 - 20:00)</option>
                  </select>
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                className="h-11 shrink-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-8 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/25 active:translate-y-0 xl:min-w-[180px] cursor-pointer"
              >
                Cek Rekomendasi
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =====================================================
          2. TRUST PILLARS (STRIP 4 KEUNGGULAN)
      ====================================================== */}
      <section className="pt-32 md:pt-36 xl:pt-44 pb-16 sm:pb-20 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-950/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition-colors duration-300 group-hover:bg-red-600 group-hover:text-white">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-base font-black text-zinc-900">{pillar.title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          3. FEATURED MENU SHOWCASE
      ====================================================== */}
      <section id="menu" className="py-16 sm:py-24 bg-white border-y border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-700">
                Pilihan Favorit
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950">
                Menu Katering <span className="text-red-600">Paling Laris</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-zinc-500 max-w-xl">
                Dibuat segar setiap hari dengan bahan berkualitas tinggi dan bumbu racikan khas Hara Chicken.
              </p>
            </div>

            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-black text-red-600 hover:text-red-700 transition"
            >
              <span>Lihat Semua Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'Semua Menu' },
              { id: 'bento', label: 'Bento Katsu' },
              { id: 'krisbar', label: 'Ayam Krisbar' },
              { id: 'kuning', label: 'Nasi Kuning' },
              { id: 'rames', label: 'Rames Nusantara' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${selectedCategory === tab.id
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayProducts.map((item, idx) => {
              const isApiItem = 'category_id' in item
              const name = item.name
              const description = item.description || 'Pilihan katering praktis higienis dengan lauk lengkap dan porsi mengenyangkan.'
              const imageSrc = isApiItem ? resolveProductImage(item as Product) : (item as CuratedProduct).image
              const priceLabel = isApiItem
                ? `Rp ${Number((item as Product).price).toLocaleString('id-ID')}`
                : (item as CuratedProduct).price
              const badgeLabel = !isApiItem
                ? (item as CuratedProduct).badge
                : idx === 0
                  ? 'Favorit'
                  : idx === 1
                    ? 'Best Seller'
                    : 'Pilihan Menu'
              const minOrder = isApiItem ? (item as Product).minimum_order : (item as CuratedProduct).minOrder

              return (
                <article
                  key={idx}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-zinc-950/10"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                    <img
                      src={imageSrc}
                      alt={name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    {/* Badge Pojok Kiri */}
                    <div className="absolute left-4 top-4 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-black text-red-600 shadow-md">
                      {badgeLabel}
                    </div>

                    {/* Minimum Order Tag */}
                    <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                      Min. {minOrder} Box
                    </div>

                    {/* Rating Pill */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-zinc-950 shadow-md">
                      <Star size={12} className="fill-zinc-950 text-zinc-950" />
                      <span>4.9</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black text-zinc-950 group-hover:text-red-600 transition">
                        {name}
                      </h3>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed line-clamp-2">
                      {description}
                    </p>

                    {/* Card Footer */}
                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Harga per Box</span>
                        <p className="text-lg font-black text-red-600">{priceLabel}</p>
                      </div>

                      <Link
                        to="/menu"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-600 active:scale-95 cursor-pointer"
                      >
                        <span>Pesan</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Bottom Callout */}
          <div className="mt-12 rounded-3xl border border-zinc-200 bg-[#fafaf9] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h4 className="text-lg font-black text-zinc-950">
                Punya Kebutuhan Menu atau Anggaran Khusus?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Kami siap membantu menyesuaikan lauk, snack box, atau buah pelengkap sesuai kebutuhan acara.
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageCircle size={17} />
              <span>Konsultasi Menu Gratis</span>
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          4. BENTO GRID: KENAPA MEMILIH HARA CHICKEN?
      ====================================================== */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Story (Col 5) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-zinc-950 text-white p-8 sm:p-10 relative overflow-hidden">
            <div className="relative z-10">
              <span className="rounded-full bg-red-600/30 border border-red-500/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-300">
                Kualitas Terpercaya
              </span>
              <h2 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Acara sudah cukup menguras tenaga.{' '}
                <span className="text-amber-400">Urusan hidangan lezat, biar kami yang siapkan.</span>
              </h2>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                Dari acara kantor hingga momen kumpul keluarga, Hara Chicken berkomitmen memberikan
                layanan katering yang konsisten, rasa yang disukai semua tamu, dan ketenangan bagi penyelenggara.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  'Ayam segar pilihan dari peternakan terpercaya',
                  'Standar higienis tinggi & 100% Halal',
                  'Invoice otomatis WhatsApp untuk arsip kantor/panitia',
                  'Dukungan admin ramah & fast response',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <Link
                to="/tentang-kami"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition"
              >
                <span>Pelajari Cerita Kami Lebih Dekat</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* 3 Bento Feature Tiles (Col 7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tile 1 */}
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm flex flex-col justify-between hover:border-red-200 transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5">
                  <UtensilsCrossed size={22} />
                </div>
                <h3 className="text-lg font-black text-zinc-950">Dapur Profesional & Bersih</h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Dimasak tepat sebelum jadwal pengantaran untuk menjaga kehangatan, kegaringan, dan nutrisi makanan.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Standar Food Grade</span>
                <span className="text-emerald-600 font-extrabold">● Bersertifikasi</span>
              </div>
            </div>

            {/* Tile 2 */}
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm flex flex-col justify-between hover:border-red-200 transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-5">
                  <Truck size={22} />
                </div>
                <h3 className="text-lg font-black text-zinc-950">Armada Pengiriman Khusus</h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Kurir katering terlatih dengan wadah insulasi pengantaran agar box tidak basah, rusak, atau telat.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Coverage Seluruh Area</span>
                <span className="text-red-600 font-extrabold">Yogyakarta & Sekitarnya</span>
              </div>
            </div>

            {/* Tile 3 (Full Width) */}
            <div className="sm:col-span-2 rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50 p-7 shadow-sm hover:border-amber-200 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-950">Konfirmasi Cepat & Invoice Otomatis</h3>
                    <p className="text-xs sm:text-sm text-zinc-500">
                      Format invoice rapi langsung terkirim ke WhatsApp untuk memudahkan pencatatan panitia dan keuangan kantor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          5. SOLUSI KATERING APAPUN ACARANYA (OCCASIONS)
      ====================================================== */}
      <section className="py-20 sm:py-28 bg-white border-t border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-800">
              Fleksibel & Serbaguna
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950">
              Solusi Katering untuk <span className="text-amber-500">Setiap Acara</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-500">
              Dari kebutuhan formal perkantoran hingga kehangatan momen keluarga besar.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {occasions.map((occ, idx) => {
              const Icon = occ.icon
              return (
                <div
                  key={idx}
                  className="group rounded-3xl border border-zinc-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1.5 hover:border-red-200 hover:shadow-xl hover:shadow-red-950/5"
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 ${occ.textColor} transition-colors group-hover:bg-zinc-950 group-hover:text-white`}>
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-500">
                      {occ.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-black text-zinc-950">{occ.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    {occ.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          6. ALUR PEMESANAN PRAKTIS (HOW IT WORKS)
      ====================================================== */}
      <section className="py-20 sm:py-28 bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                Cara Pemesanan
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Pesan Mudah dalam 4 Langkah
              </h2>
            </div>
            <Link
              to="/cara-pesan"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <span>Lihat Panduan Lengkap</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Pilih Menu & Porsi',
                desc: 'Tentukan menu katering favorit sesuai selera dan sesuaikan jumlah box dengan kebutuhan tamu.',
              },
              {
                step: '02',
                title: 'Jadwal & Lokasi',
                desc: 'Tentukan tanggal acara, jam tiba yang diharapkan, dan alamat pengantaran lengkap.',
              },
              {
                step: '03',
                title: 'Konfirmasi Invoice',
                desc: 'Tim kami akan memproses dan mengirimkan rincian invoice resmi ke WhatsApp Anda.',
              },
              {
                step: '04',
                title: 'Pesanan Diantar Hangat',
                desc: 'Dapur menyiapkan hidangan segar dan kurir mengantar tepat waktu sebelum acara dimulai.',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <span className="text-4xl sm:text-5xl font-black text-amber-400/30 group-hover:text-amber-400 transition-colors duration-300">
                  {item.step}
                </span>
                <h3 className="mt-3 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          7. TESTIMONI PELANGGAN (SOCIAL PROOF)
      ====================================================== */}
      <section className="py-20 sm:py-28 bg-[#fafaf9]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-800">
              Ulasan Nyata
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
              Kata Mereka yang Sudah Mencoba
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-500">
              Ratusan perusahaan, komunitas, dan keluarga telah mempercayakan konsumsi acara kepada Hara Chicken.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Nasi Box Bento Katsunya juara! Kami pesan 85 box untuk seminar kantor, makanan tiba 30 menit sebelum jadwal. Semua peserta memuji rasa ayamnya yang renyah dan kemasannya rapi.',
                name: 'Dian Safitri',
                role: 'HR Officer, PT Mandiri Bersama',
                rating: 5,
                event: '85 Box Seminar Kantor',
              },
              {
                quote:
                  'Rames Balado dan Nasi Kuningnya mantap bumbu meresap. Syukuran keluarga besar jadi lancar tanpa saya harus repot masak seharian di dapur. Pelayanan adminnya ramah dan komunikatif!',
                name: 'Bpk. Hendra Gunawan',
                role: 'Yogyakarta',
                rating: 5,
                event: '50 Box Acara Syukuran',
              },
              {
                quote:
                  'Fast response banget via WhatsApp! Invoice langsung dikirim rapi, sangat memudahkan LPJ kegiatan kampus kami. Nasi box ayam krisbarnya favorit anak-anak organisasi.',
                name: 'Rian Kurniawan',
                role: 'Ketua Panitia Dies Natalis',
                rating: 5,
                event: '120 Box Acara Kampus',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-red-200 transition duration-300"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {Array.from({ length: t.rating }).map((_, r) => (
                      <Star key={r} size={16} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-zinc-950">{t.name}</h4>
                    <p className="text-[11px] text-zinc-400">{t.role}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                    {t.event}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          8. FAQ INTERAKTIF (PERTANYAAN UMUM)
      ====================================================== */}
      <section className="py-20 sm:py-24 bg-white border-t border-zinc-200/80">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <span className="rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-700">
              Bantuan & FAQ
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Informasi lengkap seputar pemesanan, pengantaran, dan katering di Hara Chicken.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 bg-[#fafaf9] overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-black text-zinc-900 hover:text-red-600 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-zinc-400 transition-transform duration-200 shrink-0 ml-3 ${isOpen ? 'rotate-180 text-red-600' : ''
                        }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed animate-fade-in border-t border-zinc-200/50 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          9. CLOSING HEROIC CTA BANNER
      ====================================================== */}
      <section className="py-16 sm:py-20 bg-[#fafaf9]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-red-600 via-red-500 to-amber-500 p-8 sm:p-14 lg:p-16 text-white shadow-2xl shadow-red-600/20">
            {/* Background Accent Rings */}
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-amber-300/20 blur-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
              <div className="max-w-2xl">
                <span className="rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                  Siap untuk Acaramu?
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Biar Urusan Makanan Lezat, Hara yang Siapkan!
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/90 leading-relaxed">
                  Pesan katering nasi box favorit sekarang juga. Dapatkan rekomendasi menu terbaik
                  dan penawaran istimewa untuk acara Anda.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
                <Link
                  to="/menu"
                  className="rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-white font-black px-7 py-4 text-sm shadow-xl transition hover:scale-105 active:scale-95"
                >
                  Pesan Sekarang
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-black px-7 py-4 text-sm shadow-xl transition hover:scale-105 active:scale-95"
                >
                  <MessageCircle size={18} className="text-emerald-600" />
                  <span>Chat WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
