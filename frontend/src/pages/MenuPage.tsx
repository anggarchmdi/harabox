import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import AOS from 'aos'
import {
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { productService } from '../services/products.service'
import { getImageUrl } from '../utils/image'
import type { Product } from '../types/products'
import PageLoader from '../components/ui/PageLoader'
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton'

// Aset lokal untuk smart fallback beresolusi tinggi & menggugah selera
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'

const fallbackImages = [
  BentoKatsuImg,
  KrisbarPahaImg,
  RamesBaladoImg,
  NasiKuningBaladoImg,
  BentoTelurImg,
  KrisbarDadaImg,
  NasiKuningPahaImg,
  RamesPahaImg,
  EkonomisBaladoImg,
]

function getProductDisplayImage(item: Product): string {
  const uploadedUrl = getImageUrl(item.image)
  if (uploadedUrl) return uploadedUrl

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
  if (name.includes('ekonomis') || name.includes('putih') || name.includes('bakar') || name.includes('goreng')) {
    return EkonomisBaladoImg
  }

  const hash = Math.abs(item.id) % fallbackImages.length
  return fallbackImages[hash]
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'min-order' | 'name-asc'

export default function MenuPage() {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  })

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('default')

  const location = useLocation()

useEffect(() => {
  if (location.hash !== '#menu-list') return

  const scrollToMenu = () => {
    const element = document.getElementById('menu-list')

    if (!element) return

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(scrollToMenu)
  })
}, [location.hash])

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: false,
      offset: 40,
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const categories = useMemo(() => {
    if (!products) return []

    const categoryMap = new Map<
      number,
      {
        id: number
        name: string
        slug: string
        count: number
      }
    >()

    products.forEach((product) => {
      if (product.category) {
        const existing = categoryMap.get(product.category.id)
        if (existing) {
          existing.count += 1
        } else {
          categoryMap.set(product.category.id, {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            count: 1,
          })
        }
      }
    })

    return Array.from(categoryMap.values())
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!products) return []

    const query = debouncedSearch.toLowerCase()

    const list = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)

      const matchesCategory =
        activeCategory === 'all' || product.category?.slug === activeCategory

      return matchesSearch && matchesCategory
    })

    return list.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return Number(a.price) - Number(b.price)
      }
      if (sortBy === 'price-desc') {
        return Number(b.price) - Number(a.price)
      }
      if (sortBy === 'min-order') {
        return (a.minimum_order || 10) - (b.minimum_order || 10)
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [products, debouncedSearch, activeCategory, sortBy])

  useEffect(() => {
    // Refresh AOS trigger positions after products render or filter changes
    const timer = setTimeout(() => {
      AOS.refresh()
    }, 120)

    return () => clearTimeout(timer)
  }, [filteredProducts, isLoading])

  const hasFilter = Boolean(debouncedSearch) || activeCategory !== 'all' || sortBy !== 'default'

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setActiveCategory('all')
    setSortBy('default')
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center max-w-md rounded-3xl bg-white p-8 border border-zinc-200/80 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900">
            <ShoppingBag size={24} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-zinc-950">
            Menu Belum Dapat Dimuat
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Terjadi masalah saat menghubungkan ke database menu catering.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3 text-xs font-bold text-white transition hover:bg-zinc-800"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] text-zinc-900 selection:bg-zinc-950 selection:text-white">
      {/* Branded Page Loader with clean LogoSpinner */}
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Menu Katering Lezat..."
        subtext="Memuat daftar lengkap paket bento, krisbar, dan nasi box spesial"
        minDuration={700}
      />

      {/* =====================================================
          LUXURY WHITE HERO SECTION
      ====================================================== */}
      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-gradient-to-b from-white via-white to-[#fafaf9] pt-24 pb-6 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20">
        {/* Subtle ambient light patterns */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-100/80 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-amber-50/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Elegant luxury pill badge */}
            <div
              data-aos="fade-down"
              data-aos-duration="600"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border shadow-yellow-500 border-zinc-200/90 bg-white/90 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-zinc-700 shadow-sm backdrop-blur transition-all duration-300"
            >
              <Sparkles size={12} className="text-amber-500 sm:h-[13px] sm:w-[13px]" />
              Hara Chicken Gourmet Catering
            </div>

            {/* Main Headline in Timeless High-Contrast Charcoal */}
            <h1
              data-aos="fade-up"
              data-aos-delay="100"
              data-aos-duration="700"
              className="mt-3 sm:mt-6 max-w-4xl text-2xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-7xl leading-tight sm:leading-[1.08]"
            >
              Pilihan Menu Katering Istimewa
              <span className="block text-zinc-400 font-serif italic font-normal text-xl sm:text-4xl lg:text-6xl mt-0.5 sm:mt-1">
                untuk setiap momen berharga.
              </span>
            </h1>

            {/* Description */}
            <p
              data-aos="fade-up"
              data-aos-delay="200"
              data-aos-duration="700"
              className="mt-2.5 sm:mt-6 max-w-2xl text-xs sm:text-base lg:text-lg leading-relaxed text-zinc-500 line-clamp-2 sm:line-clamp-none"
            >
              Sajian katering nasi box premium dengan cita rasa gurih meresap, higienis,
              dan dikemas eksklusif siap santap untuk melengkapi rapat kantor, syukuran, hingga gathering berskala besar.
            </p>

            {/* Luxury Trust Indicators Pills */}
            <div
              data-aos="fade-up"
              data-aos-delay="300"
              data-aos-duration="700"
              className="mt-4 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold text-zinc-700"
            >
              <div className="flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300 cursor-default">
                <Star size={13} className="fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
                <span>4.9 / 5 Rating</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300 cursor-default">
                <ShieldCheck size={14} className="text-emerald-600 sm:h-[15px] sm:w-[15px]" />
                <span>100% Halal</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300 cursor-default">
                <Clock size={13} className="text-zinc-500 sm:h-3.5 sm:w-3.5" />
                <span>Tepat Waktu & Rapi</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-4 py-2 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300 cursor-default">
                <ShoppingBag size={14} className="text-zinc-500" />
                <span>{products?.length ?? 0} Pilihan Menu Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATALOG CONTROLS: SEARCH, SORT & CATEGORIES
      ====================================================== */}
      <section className="sticky top-16 sm:top-20 z-30 -mt-3 sm:-mt-6 mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl sm:rounded-[2rem] border border-zinc-200/90 bg-white/95 p-2.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-md"
        >
          {/* Top Row: Search Input + Compact Sort Button + Reset */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu katering..."
                className="h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl border border-zinc-200/90 bg-zinc-50/70 pl-9 sm:pl-10 pr-8 sm:pr-9 text-xs sm:text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setDebouncedSearch('')
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                  aria-label="Bersihkan pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sort Button (Compact, aligned with search bar) */}
            <div className="relative shrink-0">
              <div
                className={`flex h-11 sm:h-12 items-center gap-1.5 rounded-xl sm:rounded-2xl border px-3 sm:px-4 text-xs font-bold transition shadow-2xs cursor-pointer ${
                  sortBy !== 'default'
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                    : 'border-zinc-200/90 bg-zinc-50/80 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <ArrowUpDown
                  size={14}
                  className={sortBy !== 'default' ? 'text-white' : 'text-zinc-500'}
                />
                <span className="hidden sm:inline">
                  {sortBy === 'default'
                    ? 'Urutan: Rekomendasi'
                    : sortBy === 'price-asc'
                    ? 'Harga: Termurah'
                    : sortBy === 'price-desc'
                    ? 'Harga: Tertinggi'
                    : sortBy === 'min-order'
                    ? 'Porsi Terkecil'
                    : 'Nama: A - Z'}
                </span>
                <span className="sm:hidden text-xs">
                  {sortBy === 'default'
                    ? 'Urutkan'
                    : sortBy === 'price-asc'
                    ? 'Termurah'
                    : sortBy === 'price-desc'
                    ? 'Tertinggi'
                    : sortBy === 'min-order'
                    ? 'Min. Porsi'
                    : 'A - Z'}
                </span>
                <ChevronDown
                  size={13}
                  className={`transition ${sortBy !== 'default' ? 'text-white' : 'text-zinc-400'}`}
                />
              </div>

              {/* Native Select Overlay */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Urutkan daftar menu"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-xs"
              >
                <option value="default">Urutan: Rekomendasi</option>
                <option value="price-asc">Harga: Termurah ke Tertinggi</option>
                <option value="price-desc">Harga: Tertinggi ke Termurah</option>
                <option value="min-order">Porsi Minimal Terkecil</option>
                <option value="name-asc">Nama Menu: A - Z</option>
              </select>
            </div>

            {/* Reset Filters (Only when filter active) */}
            {hasFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl border border-red-200/70 bg-red-50/90 px-2.5 sm:px-3 text-xs font-bold text-red-600 hover:bg-red-100 transition shadow-2xs"
                title="Reset semua filter"
              >
                Reset
              </button>
            )}
          </div>

          {/* Bottom Row: Horizontal Scrollable Compact Category Chips */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-zinc-100 w-full overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 touch-pan-x">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 inline-flex items-center h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-zinc-950 text-white shadow-2xs'
                    : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-950 border border-zinc-200/60'
                }`}
              >
                <span>Semua Menu</span>
                <span
                  className={`ml-1.5 text-[10px] ${
                    activeCategory === 'all' ? 'text-zinc-300 font-bold' : 'text-zinc-400 font-medium'
                  }`}
                >
                  ({products?.length ?? 0})
                </span>
              </button>

              {categories.map((category) => {
                const isActive = activeCategory === category.slug
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.slug)}
                    className={`shrink-0 inline-flex items-center h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-950 text-white shadow-2xs'
                        : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-950 border border-zinc-200/60'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span
                      className={`ml-1.5 text-[10px] ${
                        isActive ? 'text-zinc-300 font-bold' : 'text-zinc-400 font-medium'
                      }`}
                    >
                      ({category.count})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN MENU GRID SECTION
      ====================================================== */}
      <section id='menu-list' className="scroll-mt-24 mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-12 sm:pb-16 lg:pb-20">
        {/* Results Count & Quick Notice */}
        <div
          data-aos="fade-in"
          data-aos-duration="500"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 pb-2.5 sm:pb-4 border-b border-zinc-200/60"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {isLoading ? (
              <span>Memuat menu pilihan katering...</span>
            ) : (
              <>
                Menampilkan <span className="text-zinc-950 font-black">{filteredProducts.length}</span> menu pilihan
                {activeCategory !== 'all' && (
                  <span> dalam kategori <span className="text-zinc-950 font-bold capitalize">"{activeCategory.replace(/-/g, ' ')}"</span></span>
                )}
              </>
            )}
          </p>

          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem kelipatan 10 porsi • Pesan via WhatsApp</span>
          </div>
        </div>

        {/* Loading Skeletons / Empty State / Cards Grid */}
        {isLoading ? (
          <div className="mt-4 sm:mt-8">
            <ProductCardSkeleton count={6} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            data-aos="zoom-in"
            data-aos-duration="500"
            className="my-10 sm:my-16 rounded-[2rem] sm:rounded-[2.5rem] border border-dashed border-zinc-300 bg-white p-8 sm:p-12 text-center shadow-xs"
          >
            <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Search size={22} />
            </div>
            <h3 className="mt-3 text-lg sm:text-xl font-bold text-zinc-900">
              Menu Tidak Ditemukan
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
              Tidak ada menu katering yang cocok dengan kata kunci{' '}
              <span className="font-bold text-zinc-900">"{search}"</span>. Coba gunakan kata kunci lain atau reset filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 sm:px-6 py-2.5 sm:py-3 text-xs font-bold text-white transition hover:bg-zinc-800"
            >
              Tampilkan Semua Menu
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="mt-4 sm:mt-8 grid gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((item, index) => {
              const displayImage = getProductDisplayImage(item)
              const unitPrice = Number(item.price)
              const minOrder = Math.max(10, item.minimum_order || 10)
              const isFirstFeatured = index === 0 && !hasFilter
              const cardDelay = (index % 3) * 100

              return (
                <article
                  key={item.id}
                  data-aos="fade-up"
                  data-aos-delay={cardDelay}
                  data-aos-duration="600"
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-2 hover:border-red-200 hover:shadow-[0_22px_45px_rgba(220,38,38,0.08),0_10px_20px_rgba(0,0,0,0.03)]"
                >
                  {/* Image Container with Luxury Floating Badges */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                    <img
                      src={displayImage}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Gradient Soft Shadow for Legibility */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />

                    {/* Top Left: Minimum Order Badge */}
                    <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-black text-zinc-900 shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                      <ShoppingBag size={13} className="text-red-600" />
                      <span>Min. {minOrder} Porsi</span>
                    </div>

                    {/* Top Right: Best Seller Spotlight on item 1 */}
                    {isFirstFeatured ? (
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md transition-transform duration-300 group-hover:scale-105">
                        <Flame size={12} className="fill-white" />
                        <span>Best Seller</span>
                      </div>
                    ) : (
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[11px] font-black text-amber-400 shadow-md transition-transform duration-300 group-hover:scale-105">
                        <Star size={12} className="fill-amber-400" />
                        <span>4.9</span>
                      </div>
                    )}

                    {/* Bottom overlay preview: kelipatan 10 */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-white/95 font-semibold drop-shadow">
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Kelipatan 10 Porsi
                      </span>
                      <span className="text-[10px] font-bold text-white/85 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                        Siap Santap
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    {/* Category Eyebrow & Halal Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {item.category ? (
                        <span className="inline-flex items-center rounded-lg bg-red-50 border border-red-200/70 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700">
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          Paket Nasi Box
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        100% Halal
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight leading-snug group-hover:text-red-600 transition-colors line-clamp-1">
                      <Link to={`/menu/${item.slug}`}>
                        {item.name}
                      </Link>
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-500 line-clamp-2">
                      {item.description ||
                        'Paket catering spesial dengan rasa gurih meresap, higienis, dan dikemas rapi siap saji.'}
                    </p>

                    {/* Price and Action Section */}
                    <div className="mt-auto pt-5 border-t border-zinc-100 flex items-center justify-between gap-3">
                      {/* Price Block with Wow Typography */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                          Mulai Dari
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xs sm:text-sm font-extrabold text-red-600 font-poppins">
                            Rp
                          </span>
                          <span className="text-2xl sm:text-[28px] font-black tracking-tight text-zinc-950 font-poppins group-hover:text-red-600 transition-colors">
                            {unitPrice.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-400">
                            /box
                          </span>
                        </div>
                      </div>

                      {/* Interactive CTA Button */}
                      <Link
                        to={`/menu/${item.slug}`}
                        className="group/btn relative inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-zinc-950 px-4 sm:px-5 py-3 text-xs font-black text-white shadow-md shadow-zinc-950/15 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-500 hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>Pesan</span>
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          LUXURY WHITE CONSULTATION BANNER (BOTTOM)
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-offset="60"
          className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/90 bg-gradient-to-br from-white via-white to-zinc-50 p-8 sm:p-12 lg:p-16 shadow-[0_16px_40px_rgba(0,0,0,0.03)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div data-aos="fade-right" data-aos-delay="100" data-aos-duration="650">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-600 shadow-sm">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Konsultasi & Penawaran Katering Resmi
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl leading-tight">
                Punya Kebutuhan Khusus atau Ratusan Porsi?
              </h2>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-500 max-w-2xl">
                Tim Hara Chicken siap membantu penyesuaian menu, penjadwalan waktu pengantaran ke lokasi acara Anda,
                serta menerbitkan invoice resmi untuk pembayaran transfer perusahaan ataupun pribadi.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-zinc-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Bisa Uji Cicip (Sample Menu)
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Invoice & Kuitansi Lengkap
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Kapasitas hingga 2.000+ porsi/hari
                </div>
              </div>
            </div>

            <div
              data-aos="fade-left"
              data-aos-delay="200"
              data-aos-duration="650"
              className="flex flex-col gap-3 lg:items-end"
            >
              <a
                href="https://wa.me/6289669743193?text=Halo%20Hara%20Chicken,%20saya%20ingin%20konsultasi%20pesanan%20katering%20nasi%20box%20untuk%20acara%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageCircle size={18} />
                Konsultasi via WhatsApp (Admin)
              </a>

              <Link
                to="/cara-pesan"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-xs font-bold text-zinc-800 transition hover:bg-zinc-50"
              >
                Pelajari Cara Pemesanan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
