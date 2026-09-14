import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AOS from 'aos'
import {
  ArrowRight,
  Award,
  CalendarDays,
  ChevronDown,
  Flame,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
  ShoppingBasket,
  SlidersHorizontal,

} from 'lucide-react'

import { productService } from '../services/products.service'
import { getImageUrl } from '../utils/image'
import type { Product } from '../types/products'
import PageLoader from '../components/ui/PageLoader'
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton'
import TestimonialSlider from '../components/home/TestimonialSlider'

import HeroImg from '../assets/banners.webp'
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'
import BannerMobile from '../assets/bannersss.webp'
import DapurImg from '../assets/dapur.webp'
import ProductImg from '../assets/product.webp'
import PackingImg from '../assets/packing.webp'

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
  // State untuk kategori filter menu
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // State untuk accordion FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: false,
      offset: 40,
    })
  }, [])

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

  useEffect(() => {
    const timer = setTimeout(() => {
      AOS.refresh()
    }, 100)
    return () => clearTimeout(timer)
  }, [selectedCategory, displayProducts])

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [])

  const whatsappUrl =
    'https://wa.me/6289669743193?text=' +
    encodeURIComponent('Halo Hara Chicken, saya ingin konsultasi pemesanan katering nasi box untuk acara saya.')

  return (
    <div className="overflow-hidden bg-[#fafaf9] text-zinc-900 selection:bg-red-600 selection:text-white">
      {/* Branded Initial Page Loader */}
      <PageLoader
        isLoading={pageLoading}
        text="Menyiapkan Pengalaman Katering..."
        subtext="Menghadirkan hidangan lezat dan higienis siap santap"
        minDuration={700}
      />

      {/* =====================================================
          1. HERO BANNER & FLOATING RECOMMENDATION CARD (SUMMARY HOME)
      ====================================================== */}
      <section className="w-full h-[400px] xl:h-[600px] bg-gray-100 relative">
        <div className="flex justify-center items-center w-full h-full md:hidden bg-linear-to-l">
            <img src={BannerMobile} className='w-full h-full object-cover object-bottomx' alt="" />
        </div>
        <div className="w-full absolute hidden md:flex z-10 h-[600px] bg-black/10" />
        <img
          src={HeroImg}
          alt="Hara Chicken Catering"
          className="w-full h-full hidden md:flex object-cover"
        />

        {/* Floating Quick Order Card */}
        <div className="absolute z-20 w-full px-4 -translate-y-32 md:-translate-y-28 xl:-translate-y-32">
        <div
            data-aos="fade-up"
            data-aos-duration="700"
            className="
            mx-auto w-full max-w-4xl
            rounded-3xl
            border border-zinc-100
            bg-white
            px-6 py-7
            shadow-[0_10px_40px_rgba(0,0,0,0.12)]
            md:px-10 md:py-8
            "
        >
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

            {/* Heading */}
            <div className="text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
                HaraBox Catering
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
                Siap pesan nasi box?
                </h2>

                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-zinc-500">
                Pilih menu favoritmu, tentukan jumlah pesanan, dan kami bantu prosesnya.
                </p>
            </div>

            {/* CTA */}
            <Link
                to="/menu#menu-list"
                className="
                group flex shrink-0 items-center gap-2
                rounded-full
                bg-gradient-to-r from-red-500 to-orange-500
                px-7 py-3.5
                text-sm font-semibold text-white
                shadow-md shadow-red-500/20
                transition-all duration-300
                hover:-translate-y-0.5
                hover:shadow-lg hover:shadow-red-500/25
                transform hover:scale-95
                "
            >
                Lihat Menu
            </Link>
            </div>

            {/* Quick Info */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-zinc-100 pt-5 md:justify-start">
            <span className="text-xs flex gap-2 font-medium text-zinc-500">
                <ShoppingBasket className="h-3.5 w-3.5 text-red-500" />
                Minimal 10 porsi
            </span>

            <span className="text-xs flex gap-2 font-medium text-zinc-500">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
                Bisa custom
            </span>

            <span className="text-xs flex gap-2 font-medium text-zinc-500">
                <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                Pesan via WhatsApp
            </span>
            </div>
        </div>
        </div>
      </section>

      {/* =====================================================
          2. TRUST PILLARS (STRIP 4 KEUNGGULAN)
      ====================================================== */}
      <section className="pt-60 md:pt-80 xl:pt-44 pb-16 sm:pb-20 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition transform duration-300">
          {trustPillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
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
          <div
            data-aos="fade-up"
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <span className="rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-700">
                Pilihan Favorit
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black font-poppins tracking-tight text-zinc-950">
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
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
          >
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
          {loadingProducts ? (
            <div className="mt-10">
              <ProductCardSkeleton count={6} />
            </div>
          ) : (
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
                  data-aos="fade-up"
                  data-aos-delay={(idx % 3) * 100}
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
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[11px] font-black text-yellow-500 shadow-md">
                      <Star size={12} className="fill-zinc-950 text-yellow-500" />
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
                        to={`/menu/${item.slug}`}
                        className="inline-flex duration-300 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-600 active:scale-95 cursor-pointer"
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
          )}

          {/* Bottom Callout */}
          <div
            data-aos="fade-up"
            className="mt-12 rounded-3xl border border-zinc-200 bg-[#fafaf9] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
          >
            <div>
              <h4 className="text-lg font-black text-zinc-950">
                Punya Kebutuhan Menu atau Anggaran Khusus?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Kami siap membantu menyesuaikan lauk, snack box, atau buah pelengkap sesuai kebutuhan acara
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 transform hover:scale-95 duration-300 items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
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
      <section className="py-20 sm:py-28">
  <div className="mx-auto max-w-7xl px-5 sm:px-8">

    {/* Heading */}
    <div
      data-aos="fade-up"
      className="mb-10 max-w-2xl"
    >
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
        Tentang Hara Chicken
      </span>

      <h2 className="mt-3 text-3xl font-black font-poppins leading-tight tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
        Bukan sekadar nasi box
        <span className="text-red-600">
          {" "}Kami bantu acara kamu jadi lebih mudah
        </span>
      </h2>

      <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
        Dari meeting kantor sampai acara keluarga, kami siapkan
        hidangan yang praktis, lezat, dan siap menemani momen pentingmu
      </p>
    </div>

    {/* Gallery */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

      {/* Main Photo */}
      <div
        data-aos="fade-right"
        className="group relative overflow-hidden rounded-[2rem] lg:col-span-7"
      >
        <div className="aspect-[4/3] h-full min-h-[420px">
        <div className="absolute z-10 bg-black/20 w-full h-full"></div>
          <img
            src={ProductImg}
            alt="Hara Chicken catering"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>

        <div className="absolute z-20 inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-7 sm:p-9">
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">
            Hara Chicken
          </span>

          <h3 className="mt-2 max-w-md text-2xl leading-tight text-white sm:text-3xl">
            Hidangan siap,
            acara jadi tenang
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
            Kami urus makanannya, kamu fokus menikmati acaranya
          </p>
        </div>
      </div>

      {/* Supporting Photos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">

        <div
          data-aos="fade-left"
          data-aos-delay="100"
          className="group relative min-h-[230px] overflow-hidden rounded-[2rem]"
        >
          <img
            src={DapurImg}
            alt="Dapur Hara Chicken"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

          <div className="absolute bottom-0 left-0 p-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Dapur
            </span>

            <h3 className="mt-1 text-xl font-poppins text-white">
              Fresh setiap hari
            </h3>
          </div>
        </div>

        <div
          data-aos="fade-left"
          data-aos-delay="200"
          className="group relative min-h-[230px] overflow-hidden rounded-[2rem]"
        >
          <img
            src={PackingImg}
            alt="Hara Chicken catering untuk acara"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

          <div className="absolute bottom-0 left-0 p-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Catering
            </span>

            <h3 className="mt-1 text-xl font-poppins text-white">
              Siap untuk berbagai acara
            </h3>
          </div>
        </div>

      </div>
    </div>

    {/* Bottom Info */}
    <div
      data-aos="fade-up"
      data-aos-delay="200"
      className="mt-6 flex flex-col gap-5 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-zinc-600">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Minimal 10 porsi
        </span>

        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Bisa custom
        </span>

        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Area Yogyakarta
        </span>
      </div>

      <Link
        to="/tentang-kami"
        className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-950 transition hover:text-red-600"
      >
        Kenal Hara Chicken
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </div>

  </div>
</section>
      {/* =====================================================
          5. SOLUSI KATERING APAPUN ACARANYA (OCCASIONS)
      ====================================================== */}
      <section className="py-20 sm:py-28 bg-white border-t border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div data-aos="fade-up" className="max-w-2xl">
            <span className="rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-700">
              Fleksibel & Serbaguna
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black font-poppins tracking-tight text-zinc-950">
              Solusi Katering untuk <span className="text-red-500">Setiap Acara</span>
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
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
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
          <div
            data-aos="fade-up"
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10"
          >
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
              <div
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 150}
                className="relative group"
              >
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
          <div data-aos="fade-up" className="text-center max-w-2xl mx-auto">
            <span className="rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-700">
              Ulasan Nyata
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
              Kata Mereka yang Sudah Mencoba
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-500">
              Ratusan perusahaan, komunitas, dan keluarga telah mempercayakan konsumsi acara kepada Hara Chicken.
            </p>
          </div>

          <div className="mt-12" data-aos="fade-up">
            <TestimonialSlider />
          </div>
        </div>
      </section>

      {/* =====================================================
          8. FAQ INTERAKTIF (PERTANYAAN UMUM)
      ====================================================== */}
      <section className="py-20 sm:py-24 bg-white border-t border-zinc-200/80">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div data-aos="fade-up" className="text-center mb-12">
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
                  data-aos="fade-up"
                  data-aos-delay={idx * 80}
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
          <div
            data-aos="zoom-in"
            data-aos-duration="650"
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-red-600 via-red-500 to-amber-500 p-8 sm:p-14 lg:p-16 text-white shadow-2xl shadow-red-600/20"
          >
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
