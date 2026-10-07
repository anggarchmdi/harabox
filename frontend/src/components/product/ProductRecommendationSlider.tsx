import { useRef, useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'

import { productService } from '../../services/products.service'
import { getImageUrl } from '../../utils/image'
import type { Product } from '../../types/products'
import { useThemeStore } from '../../stores/theme.store'

import BentoKatsuImg from '../../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../../assets/nasibox/bento-telur-mata-sapi-b.webp'
import EkonomisBaladoImg from '../../assets/nasibox/ekonomis-balado-b.webp'
import KrisbarDadaImg from '../../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../../assets/nasibox/rames-paha-b.webp'

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

const fallbackRecommendations: Product[] = [
  {
    id: 101,
    category_id: 1,
    name: 'Nasi Box Bento Katsu Komplit',
    slug: 'nasi-box-bento-katsu',
    description: 'Chicken katsu renyah keemasan, nasi pulen, salad segar dengan saus spesial dan sambal pilihan.',
    price: '18000',
    minimum_order: 10,
    is_active: true,
    category: { id: 1, name: 'Paket Bento', slug: 'paket-bento' },
  },
  {
    id: 102,
    category_id: 1,
    name: 'Nasi Box Ayam Krisbar Paha',
    slug: 'nasi-box-ayam-krisbar-paha',
    description: 'Ayam krispi bakar saus manis gurih meresap, lalapan segar, tahu tempe, dan sambal nagih.',
    price: '22000',
    minimum_order: 10,
    is_active: true,
    category: { id: 1, name: 'Paket Nasi Box', slug: 'paket-nasi-box' },
  },
  {
    id: 103,
    category_id: 2,
    name: 'Nasi Box Rames Balado Komplit',
    slug: 'nasi-box-rames-balado',
    description: 'Lauk ayam balado pedas gurih, mie goreng gurih, telur balado, dan sambal goreng kentang.',
    price: '28000',
    minimum_order: 10,
    is_active: true,
    category: { id: 2, name: 'Paket Nasi Box Premium', slug: 'paket-premium' },
  },
  {
    id: 104,
    category_id: 2,
    name: 'Nasi Kuning Paha Krispi Spesial',
    slug: 'nasi-kuning-paha-krispi',
    description: 'Nasi kuning santan harum gurih, ayam paha renyah, orek tempe manis, telur iris, dan sambal bajak.',
    price: '24000',
    minimum_order: 15,
    is_active: true,
    category: { id: 2, name: 'Paket Syukuran', slug: 'paket-syukuran' },
  },
  {
    id: 105,
    category_id: 1,
    name: 'Nasi Box Bento Telur Mata Sapi',
    slug: 'nasi-box-bento-telur',
    description: 'Menu praktis lezat dengan telur mata sapi omega, sosis goreng, tumis buncis, dan saus lezat.',
    price: '16000',
    minimum_order: 10,
    is_active: true,
    category: { id: 1, name: 'Paket Bento', slug: 'paket-bento' },
  },
  {
    id: 106,
    category_id: 1,
    name: 'Nasi Box Ayam Krisbar Dada Mantap',
    slug: 'nasi-box-ayam-krisbar-dada',
    description: 'Potongan dada ayam krispi panggang berlumur saus bakar rahasia, porsi tebal mengenyangkan.',
    price: '24000',
    minimum_order: 10,
    is_active: true,
    category: { id: 1, name: 'Paket Nasi Box', slug: 'paket-nasi-box' },
  },
]

interface ProductRecommendationSliderProps {
  currentProduct: Product
}

export default function ProductRecommendationSlider({ currentProduct }: ProductRecommendationSliderProps) {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'
  const sliderRef = useRef<HTMLDivElement>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
    staleTime: 60_000,
  })

  // Filter recommendations: exclude current product, prioritize same category
  const recommendations = useMemo(() => {
    const sourceList =
      allProducts && allProducts.length > 0
        ? allProducts.filter((p) => p.is_active !== false)
        : fallbackRecommendations

    const otherProducts = sourceList.filter(
      (p) => p.id !== currentProduct.id && p.slug !== currentProduct.slug
    )

    // Sort: same category first
    const sameCategory = otherProducts.filter(
      (p) => currentProduct.category_id && p.category_id === currentProduct.category_id
    )
    const otherCategory = otherProducts.filter(
      (p) => !currentProduct.category_id || p.category_id !== currentProduct.category_id
    )

    const combined = [...sameCategory, ...otherCategory]
    // Limit to 6 recommendations
    return combined.slice(0, 6)
  }, [allProducts, currentProduct])

  const checkScroll = () => {
    if (!sliderRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [recommendations])

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return
    const scrollAmount = 360
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (!isLoading && recommendations.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-[#60241E]/30">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md ${
              isDark
                ? 'bg-[#2D120F] text-[#F59E0B] border border-[#60241E]'
                : 'bg-[#FAF0E4] text-[#8C3A00] border border-[#E6DACD]'
            }`}
          >
            <Sparkles size={12} className="text-[#F59E0B]" />
            Rekomendasi Menu
          </span>
          <h2
            className={`mt-3 text-2xl sm:text-3xl font-black font-poppins tracking-tight ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}
          >
            Pilihan Menu Favorit Lainnya
          </h2>
          <p
            className={`mt-1.5 text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
            }`}
          >
            Cari variasi hidangan lain untuk melengkapi acara Anda? Temukan aneka paket nasi box dan bento lezat lainnya dari Pawon Hara.
          </p>
        </div>

        {/* Desktop Actions & Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
          <Link
            to="/menu"
            className={`hidden md:inline-flex items-center gap-1.5 text-xs font-black transition mr-2 ${
              isDark ? 'text-[#F59E0B] hover:text-amber-300' : 'text-[#D97706] hover:text-[#B45309]'
            }`}
          >
            <span>Lihat Semua Menu</span>
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Geser ke kiri"
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md ${
              isDark
                ? 'bg-[#2D120F] border-[#60241E] text-amber-200 hover:bg-[#3B1814] hover:border-[#F59E0B]/50'
                : 'bg-white border-[#E6DACD] text-[#5C3831] hover:bg-[#FAF0E4] hover:border-[#D97706]/50 shadow-[#2B120E]/5'
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Geser ke kanan"
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md ${
              isDark
                ? 'bg-[#2D120F] border-[#60241E] text-amber-200 hover:bg-[#3B1814] hover:border-[#F59E0B]/50'
                : 'bg-white border-[#E6DACD] text-[#5C3831] hover:bg-[#FAF0E4] hover:border-[#D97706]/50 shadow-[#2B120E]/5'
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slider Container with Gradient Edge Fades */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Left Fade Overlay */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-r z-10 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          } ${isDark ? 'from-[#1C0B09]' : 'from-[#FBF7F2]'} to-transparent`}
        />

        {/* Right Fade Overlay */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-l z-10 transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          } ${isDark ? 'from-[#1C0B09]' : 'from-[#FBF7F2]'} to-transparent`}
        />

        {/* Horizontal Scroll Track */}
        <div
          ref={sliderRef}
          className="flex items-stretch gap-4 sm:gap-6 lg:gap-7 overflow-x-auto scrollbar-none py-3 px-1 scroll-smooth snap-x snap-mandatory touch-pan-x"
        >
          {recommendations.map((item) => {
            const displayImage = getProductDisplayImage(item)
            const unitPrice = Number(item.price)
            const minOrder = Math.max(10, item.minimum_order || 10)
            const isPremium = Boolean(
              item.category?.name?.toLowerCase().includes('premium') ||
              item.category?.slug?.toLowerCase().includes('premium') ||
              item.name?.toLowerCase().includes('premium')
            )

            return (
              <article
                key={item.id}
                className={`group relative flex flex-col overflow-hidden rounded-[2rem] border shadow-lg transition-all duration-500 hover:-translate-y-2 shrink-0 w-[290px] sm:w-[330px] md:w-[350px] snap-start ${
                  isDark
                    ? 'border-[#60241E]/80 bg-[#2D120F] hover:border-[#F59E0B]/50 hover:shadow-2xl hover:shadow-black/60'
                    : 'border-[#E6DACD] bg-white hover:border-[#D97706]/50 shadow-[#2B120E]/5 hover:shadow-xl'
                }`}
              >
                {/* Image Container with Floating Badges */}
                <div
                  className={`relative aspect-[4/3] overflow-hidden transition-colors ${
                    isDark
                      ? 'bg-gradient-to-br from-[#2D120F] via-[#240E0C] to-[#1C0B09]'
                      : 'bg-gradient-to-br from-[#FAF5EE] via-[#F4ECE1] to-[#EAE0D3]'
                  }`}
                >
                  <img
                    src={displayImage}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 drop-shadow-md"
                  />

                  {/* Gradient Soft Shadow */}
                  {isDark ? (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1C0B09]/80 via-transparent to-transparent" />
                  ) : (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2B120E]/20 via-transparent to-transparent" />
                  )}

                  {/* Top Left: Minimum Order Badge */}
                  <div
                    className={`absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-105 ${
                      isDark
                        ? 'border border-[#F59E0B]/40 bg-[#1C0B09]/90 text-amber-300'
                        : 'border border-[#E6DACD] bg-white/95 text-[#8C3A00]'
                    }`}
                  >
                    <ShoppingBag size={13} className="text-[#F59E0B]" />
                    <span>Min. {minOrder} Porsi</span>
                  </div>

                  {/* Top Right: Category Badge (Premium Gold / Reguler Silver) */}
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

                  {/* Bottom overlay preview: kelipatan 10 */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-semibold drop-shadow">
                    <span
                      className={`flex items-center gap-1.5 backdrop-blur-md px-2.5 py-0.5 rounded-full border ${
                        isDark
                          ? 'bg-[#1C0B09]/80 border-[#60241E]/70 text-amber-200'
                          : 'bg-white/95 border-[#E6DACD] text-[#5C3831]'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                      Kelipatan 10 Porsi
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  {/* Title & Badges Grid (65% - 35%) */}
                  <div className="flex w-full justify-between gap-3 items-start mb-2.5">
                    <div className="w-[65%]">
                      <h3
                        className={`text-lg sm:text-xl font-poppins font-bold tracking-wide leading-snug transition-colors line-clamp-2 ${
                          isDark ? 'text-white group-hover:text-[#F59E0B]' : 'text-[#2B120E] group-hover:text-[#D97706]'
                        }`}
                      >
                        <Link to={`/menu/${item.slug}`}>
                          {item.name}
                        </Link>
                      </h3>
                    </div>
                    <div className="w-[35%]">
                      <div className="flex flex-col items-end gap-1.5 w-full">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isDark
                              ? 'text-amber-300 bg-[#1C0B09] border border-[#60241E]'
                              : 'text-[#8C4320] bg-[#FAF0E4] border border-[#E6DACD]'
                          }`}
                        >
                          <Clock size={11} className={isDark ? 'text-amber-300' : 'text-[#8C4320]'} />
                          Siap Santap
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isDark
                              ? 'text-emerald-400 bg-[#1C0B09] border border-[#60241E]'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          <ShieldCheck size={11} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                          100% Halal
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className={`mt-2 text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                      isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                    }`}
                  >
                    {item.description ||
                      'Paket catering spesial dengan rasa gurih meresap, higienis, dan dikemas rapi siap saji.'}
                  </p>

                  {/* Price and Action Section */}
                  <div
                    className={`mt-auto pt-5 border-t flex items-center justify-between gap-3 ${
                      isDark ? 'border-[#60241E]/60' : 'border-[#EFE5D8]'
                    }`}
                  >
                    {/* Price Block */}
                    <div className="flex flex-col">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-widest ${
                          isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'
                        }`}
                      >
                        Mulai Dari
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs sm:text-sm font-extrabold text-[#F59E0B] font-poppins">
                          Rp
                        </span>
                        <span
                          className={`text-2xl sm:text-[28px] font-black tracking-tight font-poppins transition-colors ${
                            isDark
                              ? 'text-white group-hover:text-[#F59E0B]'
                              : 'text-[#2B120E] group-hover:text-[#D97706]'
                          }`}
                        >
                          {unitPrice.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'
                          }`}
                        >
                          /box
                        </span>
                      </div>
                    </div>

                    {/* Interactive CTA Button */}
                    <Link
                      to={`/menu/${item.slug}`}
                      className="group/btn relative inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] hover:from-amber-400 hover:to-amber-500 px-4 sm:px-5 py-3 text-xs font-black text-[#1C0B09] shadow-md shadow-[#F59E0B]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
      </div>

      {/* Mobile "Lihat Semua Menu" CTA */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] px-6 py-3 text-xs font-black text-[#1C0B09] shadow-md shadow-[#F59E0B]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Lihat Semua Menu Lainnya</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}
