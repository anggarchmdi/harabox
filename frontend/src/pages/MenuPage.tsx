import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
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

  const hasFilter = Boolean(debouncedSearch) || activeCategory !== 'all' || sortBy !== 'default'

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setActiveCategory('all')
    setSortBy('default')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-36 rounded-full bg-zinc-100" />
            <div className="h-16 w-3/4 max-w-2xl rounded-2xl bg-zinc-100" />
            <div className="h-5 w-1/2 max-w-lg rounded-xl bg-zinc-100" />

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-white p-4">
                  <div className="aspect-[4/3] rounded-2xl bg-zinc-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-20 rounded bg-zinc-100" />
                    <div className="h-6 w-3/4 rounded bg-zinc-100" />
                    <div className="h-4 w-full rounded bg-zinc-100" />
                    <div className="h-10 w-full rounded-2xl bg-zinc-100 pt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
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
      {/* =====================================================
          LUXURY WHITE HERO SECTION
      ====================================================== */}
      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-gradient-to-b from-white via-white to-[#fafaf9] pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
        {/* Subtle ambient light patterns */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-100/80 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-amber-50/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Elegant luxury pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border shadow-yellow-500 border-zinc-200/90 bg-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-700 shadow-sm backdrop-blur">
              <Sparkles size={13} className="text-amber-500" />
              Hara Chicken Gourmet Catering
            </div>

            {/* Main Headline in Timeless High-Contrast Charcoal */}
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl leading-[1.08]">
              Pilihan Menu Katering Istimewa
              <span className="block text-zinc-400 font-serif italic font-normal text-3xl sm:text-5xl lg:text-6xl mt-1">
                untuk setiap momen berharga.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base lg:text-lg">
              Sajian katering nasi box premium dengan cita rasa gurih meresap, higienis,
              dan dikemas eksklusif siap santap untuk melengkapi rapat kantor, syukuran, hingga gathering berskala besar.
            </p>

            {/* Luxury Trust Indicators Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-zinc-700">
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>4.9 / 5 Rating Kepuasan</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>100% Halal & Bahan Segar</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <Clock size={14} className="text-zinc-500" />
                <span>Tepat Waktu & Rapi</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
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
      <section className="sticky top-20 z-30 -mt-6 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-[2rem] border border-zinc-200/90 bg-white/95 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.04)] backdrop-blur-md sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu catering (contoh: Bento Katsu, Nasi Kuning, Krisbar)..."
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-11 pr-10 text-xs sm:text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setDebouncedSearch('')
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                  aria-label="Bersihkan pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-12 w-full sm:w-56 appearance-none rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 pr-9 text-xs font-bold text-zinc-800 outline-none focus:border-zinc-950 focus:bg-white transition cursor-pointer"
                >
                  <option value="default">Urutan: Rekomendasi</option>
                  <option value="price-asc">Harga: Termurah ke Tertinggi</option>
                  <option value="price-desc">Harga: Tertinggi ke Termurah</option>
                  <option value="min-order">Porsi Minimal Terkecil</option>
                  <option value="name-asc">Nama Menu: A - Z</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>

              {hasFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-12 shrink-0 rounded-2xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 hover:border-zinc-900 hover:text-zinc-950 transition"
                  title="Reset semua filter"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Category Pills Bar */}
          <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pt-1 border-t border-zinc-100 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/70'
              }`}
            >
              Semua Menu ({products?.length ?? 0})
            </button>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.slug)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/70'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN MENU GRID SECTION
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        {/* Results Count & Quick Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-6 border-b border-zinc-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Menampilkan <span className="text-zinc-950 font-black">{filteredProducts.length}</span> menu pilihan
            {activeCategory !== 'all' && (
              <span> dalam kategori <span className="text-zinc-950 font-bold capitalize">"{activeCategory.replace(/-/g, ' ')}"</span></span>
            )}
          </p>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem kelipatan 10 porsi • Pesan via WhatsApp</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="my-16 rounded-[2.5rem] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <Search size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-zinc-900">
              Menu Tidak Ditemukan
            </h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
              Tidak ada menu katering yang cocok dengan kata kunci{' '}
              <span className="font-bold text-zinc-900">"{search}"</span>. Coba gunakan kata kunci lain atau reset filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3 text-xs font-bold text-white transition hover:bg-zinc-800"
            >
              Tampilkan Semua Menu
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((item, index) => {
              const displayImage = getProductDisplayImage(item)
              const unitPrice = Number(item.price)
              const minOrder = Math.max(10, item.minimum_order || 10)
              const isFirstFeatured = index === 0 && !hasFilter

              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-[2.2rem] border border-zinc-200/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)] hover:border-zinc-300"
                >
                  {/* Image Container with Luxury Floating Badges */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                    <img
                      src={displayImage}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Gradient Soft Shadow for Legibility */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                    {/* Top Left: Minimum Order Badge */}
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/60 bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-zinc-800 shadow-sm backdrop-blur-md">
                      <ShoppingBag size={13} className="text-zinc-900" />
                      <span>Min. {minOrder} Porsi</span>
                    </div>

                    {/* Top Right: Best Seller Spotlight on item 1 */}
                    {isFirstFeatured ? (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-zinc-950/90 text-amber-300 border border-zinc-800 px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        <Flame size={12} className="fill-amber-400 text-amber-400" />
                        Paling Laris
                      </div>
                    ) : (
                      <div className="absolute right-4 top-4 rounded-full bg-white/90 backdrop-blur-md border border-white/60 px-2.5 py-1 text-[11px] font-bold text-zinc-800 shadow-sm">
                        ★ 4.9
                      </div>
                    )}

                    {/* Bottom overlay preview: kelipatan 10 */}
                    <div className="absolute bottom-3 left-4 text-[11px] font-bold text-white/95 drop-shadow-sm flex items-center gap-1.5">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Kelipatan 10 porsi (10, 20, 30...)
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    {/* Category Eyebrow */}
                    {item.category && (
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                        {item.category.name}
                      </p>
                    )}

                    {/* Product Name */}
                    <h3 className="mt-1.5 text-xl font-black text-zinc-950 tracking-tight leading-snug group-hover:text-zinc-800 transition-colors">
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
                    <div className="mt-auto pt-6 border-t border-zinc-100 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Harga Katering
                        </p>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-zinc-950 tracking-tight">
                            Rp {unitPrice.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">/ porsi</span>
                        </div>
                      </div>

                      <Link
                        to={`/menu/${item.slug}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>Pilih Porsi</span>
                        <ArrowRight size={14} />
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
        <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/90 bg-gradient-to-br from-white via-white to-zinc-50 p-8 sm:p-12 lg:p-16 shadow-[0_16px_40px_rgba(0,0,0,0.03)]">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
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

            <div className="flex flex-col gap-3 lg:items-end">
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
