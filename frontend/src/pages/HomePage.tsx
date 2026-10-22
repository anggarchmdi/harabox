import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AOS from 'aos'
import {
  ArrowRight,
  Award,
  CalendarDays,
  ChevronDown,
  Crown,
  Flame,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  ShoppingBasket,
} from 'lucide-react'

import { productService } from '../services/products.service'
import { getImageUrl } from '../utils/image'
import type { Product } from '../types/products'
import PageLoader from '../components/ui/PageLoader'
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton'
import TestimonialSlider from '../components/home/TestimonialSlider'
import { useThemeStore } from '../stores/theme.store'
import { useSEO } from '../hooks/useSEO'

import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'
import HeroSlider from '../components/home/HeroSlider'
import BatikParang from '../assets/batik-parang-gold.webp'

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
  isPremium?: boolean
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
    isPremium: true,
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
    text: 'Sajian khas nusantara praktis dan higienis untuk setiap agenda perusahaan',
    textColor: 'text-[#95271D]',
  },
  {
    icon: CalendarDays,
    title: 'Syukuran & Acara Keluarga',
    tag: 'Hangat & Akrab',
    text: 'Hidangan cita rasa nusantara yang menghangatkan semua anggota keluarga.',
    textColor: 'text-[#E77B49]',
  },
  {
    icon: ShoppingBag,
    title: 'Gathering & Komunitas',
    tag: 'Skala Besar',
    text: 'Menu khas nusantara untuk memenuhi semua kapasitas kebutuhan konsumsi acara besar.',
    textColor: 'text-[#60241E]',
  },
  {
    icon: MapPin,
    title: 'Pengajian & Momen Spesial',
    tag: 'Halal & Berkah',
    text: 'Kenikmatan nusantara yang akan menemani momen penting dan spesial',
    textColor: 'text-[#B34A44]',
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
    description: 'Berbagai macam menu tersedia dari harga 20.000.',
  },
]

const faqs = [
  {
    question: 'Berapa minimal pemesanan nasi box di Pawon Hara?',
    answer:
      'Minimal porsi pemesanannya mulai di 10 nasi box hingga lebih 500 box.',
  },
  {
    question: 'Berapa hari sebelumnya saya harus memesan?',
    answer:
      'Waktu pemesanan maksimal H-1 acara. Namun, Kami sarankan konfirmasi minimal H-2 agar Kami dapat menjadwalkan dengan optimal.',
  },
  {
    question: 'Apakah bisa kustomisasi menu atau request lauk khusus?',
    answer:
      'Tentu saja bisa! Panjenengan, bisa langsung memilih sajian nasi dan sayurnya langsung atau berkonsultasi langsung dengan admin WhatsApp Pawon Hara.',
  },
  {
    question: 'Bagaimana metode pembayaran dan pengantarannya?',
    answer:
      'Pembayaran dapat dilakukan melalui transfer bank resmi (BSI). Pesanan akan langsung tepat waktu.',
  },
]

export default function HomePage() {
  useSEO({
    title: 'Pawon Hara | Nasi Box & Katering Jogja - Higienis, Murah & Enak',
    description:
      'Pawon Hara melayani pesanan nasi box, bento box, dan katering di Jogja untuk kebutuhan kantor, rapat, gathering, syukuran, dan berbagai acara. Higienis, halal, dan harga terjangkau.',
    canonical: '/',
  })

  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

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
      AOS.refreshHard()
      AOS.refresh()
      window.dispatchEvent(new Event('scroll'))
    }, 120)
    return () => clearTimeout(timer)
  }, [selectedCategory, displayProducts, theme])

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [])

  const whatsappUrl =
    'https://wa.me/6281122225520?text=' +
    encodeURIComponent('Halo Pawon Hara, saya ingin konsultasi pemesanan katering nasi box untuk acara saya.')

  return (
    <div
      className={`overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
          : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-[#2B120E]'
      }`}
    >
      {/* Branded Initial Page Loader */}
      <PageLoader
        isLoading={pageLoading}
        text="Menyiapkan Pengalaman Katering..."
        subtext="Menghadirkan hidangan lezat dan higienis siap santap dari Pawon Hara"
        minDuration={700}
      />

      {/* =====================================================
          1. HERO AUTO-SLIDER & ACTION BUTTONS OVERLAY LAYER
      ====================================================== */}
      <HeroSlider whatsappUrl={whatsappUrl} />

      {/* =====================================================
          QUICK VALUE HIGHLIGHTS STRIP (BRIDGING HERO & TRUST PILLARS)
      ====================================================== */}
      <div
        className={`w-full border-b transition-colors duration-300 ${
          isDark
            ? 'bg-[#220B09] border-[#60241E]/50 text-amber-200/85'
            : 'bg-[#F7F0E7] border-[#E6DACD] text-[#6B423A]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-around sm:justify-center sm:gap-10 text-[11px] sm:text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <ShoppingBasket className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Min. 10 Porsi</span>
          </span>
          <span className="h-3 w-px bg-current opacity-20" />
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Garansi Tepat Waktu</span>
          </span>
          <span className="h-3 w-px bg-current opacity-20" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Higienis & Halal</span>
          </span>
        </div>
      </div>

      {/* =====================================================
          2. TRUST PILLARS (STRIP 4 KEUNGGULAN)
      ====================================================== */}
      <section className="pt-6 sm:pt-10 pb-14 sm:pb-20 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition transform duration-300">
          {trustPillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className={`group relative rounded-3xl p-6 transition duration-300 hover:-translate-y-1.5 ${
                  isDark
                    ? 'border border-[#60241E]/80 bg-[#2D120F] shadow-lg shadow-black/30 hover:border-[#F59E0B]/50 hover:bg-[#361613]'
                    : 'border border-[#E6DACD] bg-white shadow-md shadow-[#2B120E]/5 hover:border-[#D97706]/50 hover:bg-[#FCF9F5] hover:shadow-xl'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60241E] to-[#95271D] text-[#F59E0B] transition-colors duration-300 group-hover:bg-[#F59E0B] group-hover:text-[#1C0B09] shadow-2xs ring-1 ${
                    isDark ? 'ring-[#F59E0B]/30' : 'ring-[#D97706]/20'
                  }`}
                >
                  <Icon size={22} />
                </div>
                <h3
                  className={`mt-4 text-base font-black transition-colors ${
                    isDark ? 'text-white group-hover:text-[#F59E0B]' : 'text-[#2B120E] group-hover:text-[#D97706]'
                  }`}
                >
                  {pillar.title}
                </h3>
                <p
                  className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                  }`}
                >
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
      <section
        id="menu"
        className={`py-16 sm:py-24 border-y transition-colors duration-300 ${
          isDark ? 'bg-[#240E0C] border-[#60241E]/60' : 'bg-[#F5EDE4] border-[#E6DACD]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Section Header */}
          <div
            data-aos="fade-up"
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <span
                className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                  isDark
                    ? 'bg-[#60241E] border border-[#F59E0B]/40 text-amber-300'
                    : 'bg-[#FAF0E4] border border-[#D97706]/40 text-[#8C4320]'
                }`}
              >
                Pilihan Favorit
              </span>
              <h2
                className={`mt-3 text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold tracking-wide ${
                  isDark ? 'text-white' : 'text-[#2B120E]'
                }`}
              >
                Menu Khas <span className="text-[#F59E0B]">Pawon Hara</span>
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base max-w-xl ${
                  isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                }`}
              >
                Menu khas yang dibuat dengan penuh cita rasa nusantara
              </p>
            </div>

            <Link
              to="/menu"
              className={`inline-flex items-center gap-2 text-sm font-black transition ${
                isDark ? 'text-[#F59E0B] hover:text-amber-300' : 'text-[#D97706] hover:text-[#B45309]'
              }`}
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
            ].map((tab) => {
              const isActive = selectedCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#F59E0B] text-[#1C0B09] font-black shadow-lg shadow-[#F59E0B]/25 ring-2 ring-[#F59E0B]'
                      : isDark
                        ? 'bg-[#2D120F] text-amber-100/80 border border-[#60241E] hover:bg-[#3B1814] hover:text-white'
                        : 'bg-white text-[#5C3831] border border-[#E6DACD] hover:bg-[#FAF0E4] hover:text-[#2B120E]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
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
                const description =
                  item.description || 'Pilihan katering praktis higienis dengan lauk lengkap dan porsi mengenyangkan.'
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
                const isPremium = isApiItem
                  ? Boolean(
                      (item as Product).category?.name?.toLowerCase().includes('premium') ||
                      (item as Product).category?.slug?.toLowerCase().includes('premium') ||
                      item.name?.toLowerCase().includes('premium')
                    )
                  : Boolean(
                      (item as CuratedProduct).isPremium ||
                      (item as CuratedProduct).category?.toLowerCase().includes('premium') ||
                      item.name?.toLowerCase().includes('premium')
                    )

                const hasDeliveryFee = isApiItem && Boolean((item as Product).has_delivery_fee)
                const productDeliveryFee = isApiItem ? Number((item as Product).delivery_fee || 0) : 0

                return (
                  <article
                    key={idx}
                    data-aos="fade-up"
                    data-aos-delay={(idx % 3) * 100}
                    className={`group flex flex-col overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1.5 ${
                      isDark
                        ? 'border border-[#60241E]/80 bg-[#2D120F] hover:border-[#F59E0B]/60 hover:shadow-2xl hover:shadow-black/50'
                        : 'border border-[#E6DACD] bg-white shadow-md shadow-[#2B120E]/5 hover:border-[#D97706]/60 hover:shadow-xl'
                    }`}
                  >
                    {/* Image Container */}
                    <div
                      className={`relative aspect-[4/3] w-full overflow-hidden transition-colors ${
                        isDark
                          ? 'bg-gradient-to-br from-[#2D120F] via-[#240E0C] to-[#1C0B09]'
                          : 'bg-gradient-to-br from-[#FAF5EE] via-[#F4ECE1] to-[#EAE0D3]'
                      }`}
                    >
                      <img
                        src={imageSrc}
                        alt={name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105 drop-shadow-md"
                      />

                      {/* Harmonized subtle overlay */}
                      {isDark ? (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C0B09]/75 via-transparent to-transparent pointer-events-none" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2B120E]/15 via-transparent to-transparent pointer-events-none" />
                      )}

                      {/* Badge Pojok Kiri */}
                      <div className="absolute left-3.5 top-3.5 rounded-full bg-[#F59E0B] px-3 py-1 text-[11px] font-black text-[#1C0B09] shadow-md">
                        {badgeLabel}
                      </div>

                      {/* Bottom overlay tags: Min Order & Gratis Ongkir */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold drop-shadow z-10">
                        <div
                          className={`rounded-xl px-2.5 py-1 shadow-md backdrop-blur-md ${
                            isDark
                              ? 'bg-[#1C0B09]/85 text-amber-200 border border-[#60241E]/70'
                              : 'bg-white/95 text-[#5C3831] border border-[#E6DACD]'
                          }`}
                        >
                          Min. {minOrder} Box
                        </div>

                        {hasDeliveryFee ? (
                          <div
                            className="flex items-center gap-1 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 dark:text-amber-200 dark:bg-amber-950/80 border border-amber-300/40 shadow-sm"
                          >
                            <Truck size={11} className="shrink-0" />
                            +Ongkir {productDeliveryFee.toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-1 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-300/40 shadow-sm"
                          >
                            <Truck size={11} className="shrink-0" />
                            Gratis Ongkir
                          </div>
                        )}
                      </div>

                      {/* Category Badge (Premium Gold / Reguler Silver) */}
                      {isPremium ? (
                        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49] text-[#1C0B09] px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md shadow-amber-500/25 border border-yellow-200/60 transition-transform duration-300 group-hover:scale-105">
                          <Crown size={12} className="fill-[#1C0B09]" />
                          <span>Premium</span>
                        </div>
                      ) : (
                        <div
                          className={`absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md transition-transform duration-300 group-hover:scale-105 ${
                            isDark
                              ? 'bg-gradient-to-r from-slate-700/90 via-zinc-600/90 to-slate-700/90 border border-slate-400/50 text-slate-100 shadow-slate-900/50'
                              : 'bg-gradient-to-r from-slate-100 via-white to-zinc-200 border border-slate-300 text-slate-700 shadow-slate-400/20'
                          }`}
                        >
                          <Sparkles size={12} className={isDark ? 'fill-slate-300 text-slate-300' : 'fill-slate-400 text-slate-500'} />
                          <span>Reguler</span>
                        </div>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-lg font-black transition ${
                            isDark ? 'text-white group-hover:text-[#F59E0B]' : 'text-[#2B120E] group-hover:text-[#D97706]'
                          }`}
                        >
                          {name}
                        </h3>
                      </div>

                      <p
                        className={`mt-2 text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                          isDark ? 'text-amber-100/65' : 'text-[#6B423A]'
                        }`}
                      >
                        {description}
                      </p>

                      {/* Card Footer */}
                      <div
                        className={`mt-6 pt-4 border-t flex items-center justify-between ${
                          isDark ? 'border-[#60241E]/70' : 'border-[#EFE5D8]'
                        }`}
                      >
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              isDark ? 'text-stone-400' : 'text-[#8C6B62]'
                            }`}
                          >
                            Harga per Box
                          </span>
                          <p className="text-xl font-black text-[#F59E0B]">{priceLabel}</p>
                        </div>

                        <Link
                          to={`/menu/${item.slug}`}
                          className="inline-flex duration-300 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] hover:from-amber-400 hover:to-amber-500 px-4 py-2.5 text-xs font-black text-[#1C0B09] transition active:scale-95 cursor-pointer shadow-md shadow-[#F59E0B]/20"
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
            className={`mt-12 rounded-3xl p-6 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left ${
              isDark
                ? 'border-2 border-[#B34A44]/40 bg-gradient-to-br from-[#2D120F] via-[#381612] to-[#451B17] text-white shadow-xl'
                : 'border-2 border-[#E77B49]/40 bg-gradient-to-br from-[#FAF3EA] via-[#F4E9DC] to-[#EFE1D1] text-[#2B120E] shadow-lg'
            }`}
          >
            <div>
              <h4
                className={`text-lg sm:text-xl font-poppins font-black  tracking-wide ${
                  isDark ? 'text-[#F59E0B]' : 'text-[#2B120E]'
                }`}
              >
                Bingung dengan kebutuhan menu dan biaya khusus?
              </h4>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 transform hover:scale-95 duration-300 items-center gap-2 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#1C0B09] px-6 py-3.5 text-xs sm:text-sm font-black shadow-xl shadow-[#F59E0B]/25 transition cursor-pointer"
            >
              <MessageCircle size={17} className="text-[#1C0B09]" />
              <span>Konsultasi Menu Gratis</span>
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          5. SOLUSI KATERING APAPUN ACARANYA (OCCASIONS)
      ====================================================== */}
      <section
        className={`py-20 sm:py-28 border-t transition-colors duration-300 ${
          isDark ? 'bg-[#240E0C] border-[#60241E]/60 text-white' : 'bg-[#F5EDE4] border-[#E6DACD] text-[#2B120E]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div data-aos="fade-up" className="max-w-2xl">
            <span
              className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                isDark
                  ? 'bg-[#60241E] border border-[#F59E0B]/40 text-amber-300'
                  : 'bg-[#FAF0E4] border border-[#D97706]/40 text-[#8C4320]'
              }`}
            >
              Fleksibel & Serbaguna
            </span>
            <h2
              className={`mt-3 text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold tracking-wide ${
                isDark ? 'text-white' : 'text-[#2B120E]'
              }`}
            >
              Sedia menu khas Nusantara
                <span className="text-[#F59E0B]"> Untuk semua acara</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {occasions.map((occ, idx) => {
              const Icon = occ.icon
              return (
                <div
                  key={idx}
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                  className={`group rounded-3xl p-7 transition duration-300 hover:-translate-y-1.5 ${
                    isDark
                      ? 'border border-[#60241E]/80 bg-[#2D120F] hover:bg-[#361613] hover:border-[#F59E0B]/50 shadow-lg shadow-black/30'
                      : 'border border-[#E6DACD] bg-white hover:bg-[#FCF9F5] hover:border-[#D97706]/50 shadow-md shadow-[#2B120E]/5 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60241E] to-[#95271D] text-[#F59E0B] transition-colors group-hover:bg-[#F59E0B] group-hover:text-[#1C0B09] ring-1 ring-[#F59E0B]/30">
                      <Icon size={22} />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        isDark
                          ? 'bg-[#3B1814] border border-[#60241E] text-amber-300'
                          : 'bg-[#FAF0E4] border border-[#E6DACD] text-[#8C4320]'
                      }`}
                    >
                      {occ.tag}
                    </span>
                  </div>

                  <h3
                    className={`mt-6 text-lg font-black transition-colors ${
                      isDark ? 'text-white group-hover:text-[#F59E0B]' : 'text-[#2B120E] group-hover:text-[#D97706]'
                    }`}
                  >
                    {occ.title}
                  </h3>
                  <p
                    className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                    }`}
                  >
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
      <section
        className={`py-20 sm:py-28 border-y transition-colors duration-300 ${
          isDark ? 'bg-[#200B09] border-[#60241E]/50 text-white' : 'bg-[#EFE5D8] border-[#E0D2C2] text-[#2B120E]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div
            data-aos="fade-up"
            className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b ${
              isDark ? 'border-amber-900/30' : 'border-[#D9C7B6]'
            }`}
          >
            <div>
              <span
                className={`text-xs font-black uppercase tracking-[0.25em] ${
                  isDark ? 'text-amber-400' : 'text-[#B45309]'
                }`}
              >
                Cara Pemesanan
              </span>
              <h2
                className={`mt-3 text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold tracking-wide ${
                  isDark ? 'text-white' : 'text-[#2B120E]'
                }`}
              >
                Pesan Mudah dalam 4 Langkah
              </h2>
            </div>
            <Link
              to="/cara-pesan"
              className={`inline-flex items-center gap-2 text-sm font-bold transition ${
                isDark ? 'text-amber-300 hover:text-amber-200' : 'text-[#B45309] hover:text-[#92400E]'
              }`}
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
                desc: 'Pilih menu khas nusantara kami sesuai selera dan jumlah kebutuhan, panjenengan',
              },
              {
                step: '02',
                title: 'Jadwal & Lokasi',
                desc: 'Pilih tanggal dan jam menu diantarkan. Jangan lupa dilengkapi dengan alamat tujuan',
              },
              {
                step: '03',
                title: 'Konfirmasi Invoice',
                desc: 'Mangga, konfirmasi pesanan melalui kontak Whatsapp Pawon Hara',
              },
              {
                step: '04',
                title: 'Pesanan Diantar Hangat',
                desc: 'Pawon Hara segera mengantarkan pesanan tepat waktu',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 150}
                className="relative group"
              >
                <span
                  className={`text-4xl sm:text-5xl font-black transition-colors duration-300 ${
                    isDark
                      ? 'text-[#F59E0B]/30 group-hover:text-[#F59E0B]'
                      : 'text-[#B45309]/30 group-hover:text-[#B45309]'
                  }`}
                >
                  {item.step}
                </span>
                <h3 className={`mt-3 text-lg font-black ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                  {item.title}
                </h3>
                <p
                  className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-stone-300' : 'text-[#5C3831]'
                  }`}
                >
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
      <section
        className={`py-20 sm:py-28 border-t transition-colors duration-300 ${
          isDark ? 'bg-[#1C0B09] border-[#60241E]/60 text-white' : 'bg-[#FBF7F2] border-[#E6DACD] text-[#2B120E]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div data-aos="fade-up" className="text-center max-w-2xl mx-auto">
            <span
              className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                isDark
                  ? 'bg-[#60241E] border border-[#F59E0B]/40 text-amber-300'
                  : 'bg-[#FAF0E4] border border-[#D97706]/40 text-[#8C4320]'
              }`}
            >
              Ulasan Nyata
            </span>
            <h2
              className={`mt-3 text-3xl sm:text-4xl font-bold font-poppins tracking-wide ${
                isDark ? 'text-white' : 'text-[#2B120E]'
              }`}
            >
                Matur nuwun
            </h2>
            <p
              className={`mt-2 text-sm sm:text-base ${
                isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
              }`}
            >
              atas testimoni dan kepercayaan perusahaan, komunitas, dan keluarga pada Pawon Hara
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
      <section
        className={`py-20 sm:py-24 border-t transition-colors duration-300 ${
          isDark ? 'bg-[#240E0C] border-[#60241E]/60 text-white' : 'bg-[#F5EDE4] border-[#E6DACD] text-[#2B120E]'
        }`}
      >
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div data-aos="fade-up" className="text-center mb-12">
            <span
              className={`rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                isDark
                  ? 'bg-[#60241E] border border-[#F59E0B]/40 text-amber-300'
                  : 'bg-[#FAF0E4] border border-[#D97706]/40 text-[#8C4320]'
              }`}
            >
              Bantuan & FAQ
            </span>
            <h2
              className={`mt-3 text-3xl sm:text-4xl font-poppins font-bold tracking-wide ${
                isDark ? 'text-white' : 'text-[#2B120E]'
              }`}
            >
              Pertanyaan yang Sering Diajukan
            </h2>
            <p
              className={`mt-2 text-sm ${
                isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
              }`}
            >
              Informasi lengkap seputar pemesanan, pengantaran, dan katering di Pawon Hara.
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
                  className={`rounded-2xl overflow-hidden transition ${
                    isDark
                      ? 'border border-[#60241E]/80 bg-[#2D120F] hover:border-[#F59E0B]/40 shadow-lg'
                      : 'border border-[#E6DACD] bg-white hover:border-[#D97706]/40 shadow-md shadow-[#2B120E]/5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-black transition cursor-pointer ${
                      isDark
                        ? 'text-white hover:text-[#F59E0B]'
                        : 'text-[#2B120E] hover:text-[#D97706]'
                    }`}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen
                          ? isDark
                            ? 'rotate-180 text-[#F59E0B]'
                            : 'rotate-180 text-[#D97706]'
                          : isDark
                            ? 'text-amber-200/50'
                            : 'text-[#8C6B62]'
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed animate-fade-in border-t pt-3 ${
                        isDark
                          ? 'border-[#60241E]/70 text-amber-100/80'
                          : 'border-[#EFE5D8] text-[#5C3831]'
                      }`}
                    >
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
      <section
        className={`py-16 sm:py-20 transition-colors duration-300 ${
          isDark ? 'bg-[#1C0B09]' : 'bg-[#FBF7F2]'
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div
            data-aos="zoom-in"
            data-aos-duration="650"
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#42140F] via-[#60241E] to-[#95271D] border-2 border-[#E77B49]/40 p-8 sm:p-14 lg:p-16 text-white shadow-2xl shadow-black/60"
          >
            {/* Background Accent Rings */}
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#E77B49]/20 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-[#F59E0B]/20 blur-3xl" />

            {/* Traditional Javanese Batik Parang Watermark (Width Full, Height 1/2, Smooth Gradient Fade) */}
            <div
              className="absolute bottom-0 inset-x-0 w-full h-1/2 pointer-events-none opacity-25 mix-blend-screen overflow-hidden"
              style={{
                backgroundImage: `url(${BatikParang})`,
                backgroundRepeat: 'repeat',
                backgroundPosition: 'bottom center',
                backgroundSize: '800px auto',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0) 100%)',
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
              <div className="max-w-2xl">
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold tracking-wide leading-tight text-white">
                  Menemani semua acara,<span className="text-[#F59E0B]"> Pawon Hara</span> Dapurnya rasa Nusantara

                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
                <Link
                  to="/menu"
                  className="rounded-2xl bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#E77B49] hover:from-amber-400 hover:to-amber-500 text-[#1C0B09] font-black px-8 py-4 text-sm shadow-xl shadow-[#F59E0B]/30 transition hover:scale-105 active:scale-95"
                >
                  Pesan Sekarang
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#2D120F] hover:bg-[#3B1814] text-white border border-[#E77B49]/50 font-black px-7 py-4 text-sm shadow-xl transition hover:scale-105 active:scale-95"
                >
                  <MessageCircle size={18} className="text-[#F59E0B]" />
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
