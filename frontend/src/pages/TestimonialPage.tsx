import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Heart,
  Loader2,
  MessageSquareQuote,
  Package,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import PageLoader from '../components/ui/PageLoader'
import { testimonialService } from '../services/testimonial.service'
import { getImageUrl } from '../utils/image'
import type { OrderReviewDetail, Testimonial } from '../types/testimonial'

const ratingDescriptions: Record<number, { title: string; subtitle: string }> = {
  5: { title: 'Luar Biasa!', subtitle: 'Sangat puas dengan rasa ayam, bento box, dan ketepatan pengantaran.' },
  4: { title: 'Puas & Enak', subtitle: 'Pesanan sesuai harapan dan pelayanan memuaskan.' },
  3: { title: 'Cukup Baik', subtitle: 'Makanan cukup oke, ada beberapa hal yang bisa ditingkatkan.' },
  2: { title: 'Kurang Puas', subtitle: 'Ada bagian makanan atau pelayanan yang kurang memuaskan.' },
  1: { title: 'Mengecewakan', subtitle: 'Pesanan tidak sesuai dengan yang diharapkan.' },
}

const avatarGradients = [
  'from-orange-500 to-amber-500',
  'from-rose-500 to-red-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-yellow-600',
  'from-purple-500 to-pink-600',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return 'Baru saja'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return 'Baru saja'
  }
}

export default function TestimonialPage() {
  const [searchParams] = useSearchParams()
  const formRef = useRef<HTMLDivElement | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [orderQuantity, setOrderQuantity] = useState('')
  const [message, setMessage] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  // Shopee-Style Order & Product verification state
  const [orderData, setOrderData] = useState<OrderReviewDetail | null>(null)
  const [isCheckingOrder, setIsCheckingOrder] = useState(false)
  const [hasReviewedAlready, setHasReviewedAlready] = useState(false)
  const [existingReview, setExistingReview] = useState<Testimonial | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderLookupInput, setOrderLookupInput] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | '5star' | 'office' | 'event'>('all')

  // Fetch Public Testimonials
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: testimonialService.getPublic,
  })

  // Function to lookup and verify order (auto-populating products like Shopee)
  const lookupOrder = async (code: string) => {
    const cleanCode = code.trim()
    if (!cleanCode) return

    try {
      setIsCheckingOrder(true)
      setOrderError(null)
      const res = await testimonialService.checkByOrder(cleanCode)

      if (res.has_reviewed) {
        setHasReviewedAlready(true)
        setExistingReview(res.data)
        if (res.order) {
          setOrderData(res.order)
          setName(res.order.customers_name)
          setOrderQuantity(`${res.order.total_quantity} Box`)
        }
        return
      }

      if (res.order) {
        if (res.order.status === 'cancelled') {
          setOrderError('Pesanan ini telah dibatalkan sehingga ulasan tidak dapat diberikan.')
          setOrderData(null)
          return
        }

        setOrderData(res.order)
        setName(res.order.customers_name)
        setOrderQuantity(`${res.order.total_quantity} Box`)
        setOrderCode(res.order.order_code)
        setOrderLookupInput(res.order.order_code)
        setOrderError(null)
        setHasReviewedAlready(false)
        setIsManualMode(false)
      } else {
        setOrderError('Nomor pesanan tidak ditemukan. Mohon periksa kembali kode pesanan Anda.')
      }
    } catch (err) {
      console.error('Failed to lookup order for testimonial', err)
      setOrderError('Gagal memuat data pesanan. Silakan periksa kembali kode pesanan Anda.')
    } finally {
      setIsCheckingOrder(false)
    }
  }

  // Auto-fill form jika dikirim dari Lacak Pesanan / WhatsApp URL
  useEffect(() => {
    const paramName = searchParams.get('name')
    const paramQty = searchParams.get('qty') || searchParams.get('quantity')
    const paramInstitution = searchParams.get('institution')
    const paramOrder = searchParams.get('order') || searchParams.get('order_code')
    const paramRating = searchParams.get('rating')

    if (paramName) setName(paramName)
    if (paramQty) setOrderQuantity(paramQty)
    if (paramInstitution) setInstitution(paramInstitution)
    if (paramRating) {
      const numRating = Number(paramRating)
      if (numRating >= 1 && numRating <= 5) {
        setRating(numRating)
      }
    }

    if (paramOrder) {
      setOrderCode(paramOrder)
      setOrderLookupInput(paramOrder)
      lookupOrder(paramOrder)
    }

    // If redirected with order info, scroll smoothly to form
    if (paramOrder || paramName) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 400)
    }
  }, [searchParams])

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalName = (orderData?.customers_name || name).trim()
    const finalQty = (orderData ? `${orderData.total_quantity} Box` : orderQuantity).trim()

    if (!finalName) {
      toast.error('Mohon lengkapi nama pemesan atau masukkan nomor pesanan Anda.')
      return
    }

    if (!finalQty) {
      toast.error('Mohon cantumkan jumlah pesanan (contoh: 50 Box).')
      return
    }

    if (!message.trim() || message.trim().length < 5) {
      toast.error('Mohon tulis ulasan pengalaman Anda (minimal 5 karakter).')
      return
    }

    try {
      setIsSubmitting(true)

      await testimonialService.submit({
        name: finalName,
        institution: institution.trim() ? institution.trim() : undefined,
        rating,
        order_quantity: finalQty,
        message: message.trim(),
        order_code: (orderData?.order_code || orderCode).trim() ? (orderData?.order_code || orderCode).trim() : undefined,
      })

      setIsSubmitted(true)
      toast.success('Terima kasih! Ulasan Anda berhasil dikirim.')
      formRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Terjadi kesalahan saat mengirim ulasan. Silakan coba lagi.'
      toast.error(errorMsg || 'Gagal mengirim ulasan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Testimonials
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = t.name.toLowerCase().includes(q)
        const matchInst = t.institution?.toLowerCase().includes(q)
        const matchMsg = t.message.toLowerCase().includes(q)
        const matchQty = t.order_quantity.toLowerCase().includes(q)
        if (!matchName && !matchInst && !matchMsg && !matchQty) {
          return false
        }
      }

      // Category Pill
      if (activeCategory === '5star') {
        return t.rating === 5
      }
      if (activeCategory === 'office') {
        const inst = (t.institution || '').toLowerCase()
        return (
          inst.includes('pt') ||
          inst.includes('kantor') ||
          inst.includes('corporate') ||
          inst.includes('bank') ||
          inst.includes('hr') ||
          inst.includes('dinas') ||
          inst.includes('kampus')
        )
      }
      if (activeCategory === 'event') {
        const text = `${t.institution || ''} ${t.message}`.toLowerCase()
        return (
          text.includes('syukuran') ||
          text.includes('keluarga') ||
          text.includes('acara') ||
          text.includes('nikah') ||
          text.includes('ulang tahun') ||
          text.includes('seminar')
        )
      }

      return true
    })
  }, [testimonials, searchQuery, activeCategory])

  const activeRating = hoverRating !== null ? hoverRating : rating
  const activeRatingDesc = ratingDescriptions[activeRating] || ratingDescriptions[5]

  return (
    <div className="min-h-screen bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09] pt-28 pb-24 sm:pt-36 sm:pb-32">
      {/* Branded Page Loader */}
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Cerita & Ulasan..."
        subtext="Memuat ulasan pelanggan setia dan pengalaman katering Pawon Hara"
        minDuration={700}
      />

      {/* Background Decorative Blur Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#60241E]/30 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-[#95271D]/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-[#F59E0B]/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {/* =====================================================
            1. BREADCRUMB & HERO SHOWCASE
        ====================================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-200/60">
            <Link to="/" className="hover:text-[#F59E0B] transition">
              Beranda
            </Link>
            <ChevronRight size={14} className="text-stone-500" />
            <span className="text-white font-bold">Suara & Testimoni Pelanggan</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-b border-[#60241E] pb-12">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2D120F] border border-[#60241E] text-amber-300 text-xs font-black uppercase tracking-wider shadow-2xs">
                <Sparkles size={14} className="text-[#F59E0B]" />
                <span className="font-dhaksinarga tracking-widest text-xs">DIPERCAYA 250+ KANTOR & KELUARGA</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-dhaksinarga tracking-wide font-black text-white leading-[1.15]">
                Cerita Rasa & Kepuasan Pelanggan{' '}
                <span className="bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] bg-clip-text text-transparent">
                  Pawon Hara
                </span>
              </h1>

              <p className="text-sm sm:text-base text-amber-100/80 leading-relaxed max-w-2xl font-normal">
                Setiap box bento dan hidangan katering dimasak segar di hari H dengan bumbu gurih meresap khas Nusantara, higienis, dan
                disegel food-grade. Lihat bagaimana pengalaman nyata para pelanggan setia kami.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] text-[#1C0B09] font-dhaksinarga tracking-wide font-black text-xs sm:text-sm shadow-lg shadow-[#F59E0B]/20 transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Edit3 size={16} />
                <span>Tulis Ulasan Anda</span>
              </button>

              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#60241E] bg-[#2D120F] hover:bg-[#3B1814] text-amber-200 font-bold text-xs sm:text-sm shadow-2xs transition hover:text-white"
              >
                <UtensilsCrossed size={16} className="text-amber-400" />
                <span>Lihat Menu Katering</span>
              </Link>
            </div>
          </div>

          {/* 3 Key Trust Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-6 shadow-xl flex items-center gap-4 text-stone-100">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2D120F] text-amber-400 border border-[#60241E]">
                <Star size={28} className="fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black text-white">4.9</span>
                  <span className="text-xs font-bold text-amber-300/70">/ 5.0</span>
                </div>
                <p className="text-xs font-bold text-amber-100 mt-0.5">Skor Kepuasan Pelanggan</p>
                <p className="text-[11px] text-amber-200/60">Dari ratusan review pemesan</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-6 shadow-xl flex items-center gap-4 text-stone-100">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2D120F] text-[#F59E0B] border border-[#60241E]">
                <Package size={28} />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black text-white">15.000+</span>
                <p className="text-xs font-bold text-amber-100 mt-0.5">Box Nasi Terkirim</p>
                <p className="text-[11px] text-amber-200/60">Meeting, seminar & syukuran</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-6 shadow-xl flex items-center gap-4 text-stone-100">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2D120F] text-emerald-400 border border-[#60241E]">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black text-emerald-400">99.8%</span>
                <p className="text-xs font-bold text-amber-100 mt-0.5">Tepat Waktu Sebelum Acara</p>
                <p className="text-[11px] text-amber-200/60">Garansi kurir katering terpercaya</p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            2. REAL CUSTOMER REVIEWS (WALL OF LOVE)
        ====================================================== */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-dhaksinarga tracking-wide font-black text-white">
                  Ulasan Asli Pelanggan Pawon Hara
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/70">
                Transparan dan tanpa rekayasa dari para pemesan katering yang telah menikmati hidangan kami.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ulasan / instansi..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#60241E] bg-[#1C0B09] text-xs font-medium text-white placeholder-stone-500 focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] font-dhaksinarga font-bold shadow-md'
                  : 'bg-[#2D120F] border border-[#60241E] text-amber-200 hover:bg-[#3B1814] hover:text-white'
              }`}
            >
              Semua Ulasan ({testimonials.length})
            </button>
            <button
              onClick={() => setActiveCategory('5star')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === '5star'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] font-dhaksinarga font-bold shadow-md'
                  : 'bg-[#2D120F] border border-[#60241E] text-amber-200 hover:bg-[#3B1814] hover:text-white'
              }`}
            >
              <Star size={13} className="fill-current" />
              <span>Bintang 5</span>
            </button>
            <button
              onClick={() => setActiveCategory('office')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'office'
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] font-dhaksinarga font-bold shadow-md'
                  : 'bg-[#2D120F] border border-[#60241E] text-amber-200 hover:bg-[#3B1814] hover:text-white'
              }`}
            >
              <Building2 size={13} />
              <span>Kantor & Instansi</span>
            </button>
            <button
              onClick={() => setActiveCategory('large' as any)}
              className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === ('large' as any)
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] font-dhaksinarga font-bold shadow-md'
                  : 'bg-[#2D120F] border border-[#60241E] text-amber-200 hover:bg-[#3B1814] hover:text-white'
              }`}
            >
              <Package size={13} />
              <span>Pesanan Skala Besar (50+ Box)</span>
            </button>
          </div>

          {/* Testimonial Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-6 space-y-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-[#2D120F]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-[#2D120F] rounded-md w-3/4" />
                      <div className="h-3 bg-[#2D120F] rounded-md w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-[#2D120F] rounded-md w-1/3" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-[#2D120F] rounded-md w-full" />
                    <div className="h-3 bg-[#2D120F] rounded-md w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#60241E] bg-[#240E0C] p-12 text-center max-w-md mx-auto space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2D120F] text-amber-400 border border-[#60241E]">
                <MessageSquareQuote size={24} />
              </div>
              <h3 className="font-dhaksinarga tracking-wide text-base font-bold text-white">Tidak ada ulasan yang cocok</h3>
              <p className="text-xs text-amber-100/70">
                Coba ubah kata kunci pencarian atau filter kategori untuk melihat review pelanggan lainnya.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
                className="text-xs font-bold text-[#F59E0B] hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestimonials.map((item, idx) => {
                const gradient = avatarGradients[idx % avatarGradients.length]
                const initials = getInitials(item.name)

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-6 sm:p-7 shadow-xl hover:border-[#F59E0B]/50 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Card Header: Avatar & Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-sm shadow-xs font-dhaksinarga`}
                          >
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-dhaksinarga tracking-wide font-black text-white text-sm sm:text-base leading-tight">
                              {item.name}
                            </h3>
                            {item.institution ? (
                              <p className="text-xs font-semibold text-amber-300/80 mt-0.5 truncate max-w-[180px] sm:max-w-[200px]">
                                {item.institution}
                              </p>
                            ) : (
                              <p className="text-xs font-medium text-amber-100/60 mt-0.5">Pelanggan Katering</p>
                            )}
                          </div>
                        </div>

                        {/* Order Quantity Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#2D120F] border border-[#60241E] px-2.5 py-1 text-[11px] font-bold text-amber-300 shrink-0">
                          <Package size={12} className="text-[#F59E0B]" />
                          <span>{item.order_quantity}</span>
                        </span>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: item.rating }).map((_, r) => (
                          <Star key={r} size={16} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {/* Ordered Menu & Quantity Detail */}
                      <div className="rounded-2xl bg-[#1C0B09] border border-[#60241E] p-2.5 flex items-start gap-2.5 text-xs text-stone-200">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#60241E] text-amber-300 shadow-2xs mt-0.5">
                          <UtensilsCrossed size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
                            Menu yang Dinikmati:
                          </p>
                          {item.ordered_items && item.ordered_items.length > 0 ? (
                            <div className="mt-0.5 space-y-1">
                              {item.ordered_items.map((ord, i) => (
                                <div key={i} className="flex items-center justify-between text-xs font-black text-white gap-2">
                                  <span className="truncate">{ord.name}</span>
                                  <span className="inline-flex items-center rounded-md bg-[#2D120F] border border-[#60241E] px-1.5 py-0.5 text-[11px] font-black text-amber-300 shrink-0">
                                    {ord.quantity} Pcs
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="font-semibold text-white truncate mt-0.5">
                              {item.order_quantity || 'Paket Nasi Box Spesial Pawon Hara'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Testimonial Quote Message */}
                      <div className="relative">
                        <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed italic">
                          "{item.message}"
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Verified & Date */}
                    <div className="mt-5 pt-4 border-t border-[#60241E]/80 flex items-center justify-between text-[11px] text-amber-200/60 font-semibold">
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <BadgeCheck size={14} className="fill-emerald-400/20" />
                        <span>Pesanan Terverifikasi</span>
                      </span>
                      <span>{formatDateIndo(item.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* =====================================================
            3. SUBMISSION FORM (FORM REVIEW SHOPEE-STYLE)
        ====================================================== */}
        <div ref={formRef} id="tulis-ulasan" className="pt-6">
          <div className="max-w-3xl mx-auto">
            {isSubmitted ? (
              /* Success State Card */
              <div className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-8 sm:p-12 shadow-xl text-center animate-in fade-in zoom-in-95 text-stone-100">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2D120F] text-emerald-400 border border-[#60241E] mb-6">
                  <CheckCircle2 size={44} strokeWidth={2.2} />
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 px-3.5 py-1 text-xs font-black text-emerald-300 uppercase tracking-wider">
                  <Sparkles size={13} /> Ulasan Berhasil Dikirim
                </span>

                <h2 className="mt-4 text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black text-white">
                  Terima Kasih Banyak, Kak {name || orderData?.customers_name || 'Pelanggan Setia'}!
                </h2>

                <p className="mt-3 text-sm sm:text-base text-amber-100/80 max-w-lg mx-auto leading-relaxed">
                  Ulasan dan penilaian yang Anda berikan sangat berarti bagi seluruh kru dapur Pawon Hara untuk
                  terus menjaga cita rasa katering lezat dan pelayanan tepat waktu.
                </p>

                <div className="mt-6 flex justify-center gap-1 text-amber-400">
                  {Array.from({ length: rating }).map((_, r) => (
                    <Star key={r} size={24} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-[#60241E] flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <Link
                    to="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 py-3.5 text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] hover:brightness-110 transition shadow-md"
                  >
                    Kembali ke Beranda
                  </Link>
                  <Link
                    to="/menu"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-[#60241E] bg-[#2D120F] px-6 py-3.5 text-xs sm:text-sm font-bold text-amber-200 hover:bg-[#3B1814] hover:text-white transition"
                  >
                    Lihat Menu Katering
                  </Link>
                </div>
              </div>
            ) : hasReviewedAlready ? (
              /* Already Reviewed State Card */
              <div className="rounded-3xl border border-[#60241E] bg-[#240E0C] p-8 sm:p-12 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 text-stone-100">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2D120F] text-[#F59E0B] border border-[#60241E]">
                  <CheckCircle2 size={44} strokeWidth={2.2} />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2D120F] border border-[#60241E] px-3.5 py-1 text-xs font-black text-amber-300 uppercase tracking-wider">
                    <BadgeCheck size={14} /> Pesanan Sudah Pernah Diulas
                  </span>

                  <h2 className="mt-4 text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black text-white">
                    Terima Kasih, Kak {existingReview?.name || name || 'Pelanggan Setia'}!
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-amber-100/80 max-w-md mx-auto">
                    Anda sudah memberikan penilaian dan ulasan untuk pesanan ini. Masukan Anda sangat berharga bagi peningkatan mutu layanan Pawon Hara.
                  </p>
                </div>

                {existingReview && (
                  <div className="max-w-md mx-auto rounded-2xl bg-[#1C0B09] border border-[#60241E] p-5 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: existingReview.rating }).map((_, i) => (
                          <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-amber-200/60 font-semibold">
                        {formatDateIndo(existingReview.created_at)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-amber-100 italic">
                      "{existingReview.message}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#60241E] text-[11px] text-amber-200/70 font-semibold">
                      <span>Porsi: <strong>{existingReview.order_quantity}</strong></span>
                      {existingReview.institution && (
                        <span>Instansi: <strong>{existingReview.institution}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {orderData && orderData.items.length > 0 && (
                  <div className="max-w-md mx-auto rounded-2xl border border-[#60241E] bg-[#1C0B09] p-4 text-left space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <UtensilsCrossed size={12} className="text-[#F59E0B]" />
                      <span>Menu Katering Yang Dipesan:</span>
                    </p>
                    <div className="space-y-2">
                      {orderData.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs font-semibold text-stone-200">
                          <span className="truncate">{item.item_name}</span>
                          <span className="text-amber-300 font-bold shrink-0 ml-2">{item.quantity} Box</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 py-3.5 text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] hover:brightness-110 transition shadow-md"
                  >
                    Kembali ke Beranda
                  </Link>
                  <Link
                    to="/menu"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-[#60241E] bg-[#2D120F] px-6 py-3.5 text-xs sm:text-sm font-bold text-amber-200 hover:bg-[#3B1814] hover:text-white transition"
                  >
                    Pesan Katering Lagi
                  </Link>
                </div>
              </div>
            ) : (
              /* Shopee-Style Submission Form */
              <div className="rounded-3xl border border-[#60241E] bg-[#240E0C] shadow-2xl overflow-hidden text-stone-100">
                {/* Form Header */}
                <div className="relative bg-gradient-to-r from-[#60241E] via-[#95271D] to-[#2D120F] px-6 py-8 sm:px-10 sm:py-10 text-white overflow-hidden border-b border-[#60241E]">
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3.5 py-1 text-xs font-black text-amber-300 border border-amber-400/30 mb-2">
                      <Heart size={14} className="fill-amber-300" />
                      <span className="font-dhaksinarga tracking-widest text-xs">SUARA PELANGGAN PAWON HARA</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black text-white">
                      Beri Penilaian & Ulasan Pesanan
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-100/80 max-w-xl leading-relaxed">
                      Bagaimana rasa olahan ayam, kelezatan bento, porsi, dan ketepatan waktu pengantaran kami? Masukan Anda sangat berharga bagi kru dapur Pawon Hara.
                    </p>
                  </div>

                  <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none text-amber-200">
                    <MessageSquareQuote size={200} />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-7">
                  {/* Order Loading State */}
                  {isCheckingOrder && (
                    <div className="rounded-2xl border border-[#60241E] bg-[#1C0B09] p-6 flex items-center justify-center gap-3 text-amber-300 animate-pulse">
                      <Loader2 size={20} className="animate-spin text-[#F59E0B]" />
                      <span className="text-xs font-bold font-dhaksinarga">Memverifikasi pesanan & memuat menu Pawon Hara...</span>
                    </div>
                  )}

                  {/* Verified Order & Product Card */}
                  {orderData ? (
                    <div className="rounded-2xl border-2 border-[#60241E] bg-[#1C0B09] p-5 sm:p-6 shadow-xl space-y-4">
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#60241E] pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                            <ShieldCheck size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-dhaksinarga">
                                <BadgeCheck size={14} className="text-emerald-400" />
                                Pesanan Terverifikasi
                              </span>
                              <span className="rounded-lg bg-[#2D120F] border border-[#60241E] px-2 py-0.5 text-[11px] font-black text-amber-300">
                                #{orderData.order_code}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-amber-100/70 mt-0.5">
                              Pemesan: <strong className="text-white">{orderData.customers_name}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-[#2D120F] border border-[#60241E] px-3 py-1.5 text-xs font-black text-amber-300">
                            <Package size={13} className="text-[#F59E0B]" />
                            <span>Total {orderData.total_quantity} Box</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setOrderData(null)
                              setOrderLookupInput('')
                              setOrderCode('')
                              setIsManualMode(false)
                            }}
                            title="Ganti nomor pesanan"
                            className="p-1.5 text-stone-400 hover:text-white hover:bg-[#2D120F] rounded-lg transition cursor-pointer"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-300">
                          <span className="flex items-center gap-1.5 font-dhaksinarga">
                            <UtensilsCrossed size={13} className="text-[#F59E0B]" />
                            Produk Katering Yang Dipesan
                          </span>
                          <span className="text-[10px] text-amber-200/60 font-semibold lowercase">
                            (otomatis dari pesanan)
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {orderData.items.map((item) => {
                            const imgUrl = getImageUrl(item.product_image)
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3.5 rounded-2xl border border-[#60241E] bg-[#240E0C] p-3 sm:p-3.5 shadow-md hover:border-[#F59E0B]/50 transition group"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-[#60241E] bg-[#2D120F] flex items-center justify-center">
                                    {imgUrl ? (
                                      <img
                                        src={imgUrl}
                                        alt={item.item_name}
                                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                          e.currentTarget.parentElement?.classList.add('bg-[#2D120F]')
                                        }}
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-[#2D120F] text-amber-400">
                                        <UtensilsCrossed size={22} />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-white truncate">
                                      {item.item_name}
                                    </h4>
                                    <p className="text-xs font-bold text-[#F59E0B] mt-0.5">
                                      Rp {Number(item.price).toLocaleString('id-ID')} / box
                                    </p>
                                    <p className="text-[11px] text-amber-200/60 hidden sm:block">
                                      Kemasan Food-Grade & Higienis Pawon Hara
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="inline-flex items-center gap-1 rounded-xl bg-[#2D120F] border border-[#60241E] px-3 py-1 text-xs font-black text-amber-300">
                                    x{item.quantity} Box
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Auto-filled Notification Banner */}
                      <div className="rounded-xl bg-[#2D120F] border border-[#60241E] p-2.5 text-center text-xs font-bold text-amber-200 flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-[#F59E0B] shrink-0" />
                        <span>Nama pemesan, produk katering, dan jumlah pesanan telah terisi otomatis. Anda cukup memberikan penilaian bintang dan ulasan di bawah.</span>
                      </div>
                    </div>
                  ) : (
                    /* Order Lookup Card when opened directly without order parameter */
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#60241E] bg-[#1C0B09] p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={18} className="text-[#F59E0B]" />
                          <h3 className="text-xs font-dhaksinarga tracking-wide font-black uppercase text-amber-300">
                            Punya Nomor Pesanan Pawon Hara?
                          </h3>
                        </div>
                        <p className="text-xs text-amber-100/70 leading-relaxed">
                          Masukkan nomor pesanan Anda (contoh: <strong>PH-202609-0001</strong>) agar data nama, produk yang dipesan, dan jumlah porsi terisi otomatis seperti di Shopee.
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={orderLookupInput}
                            onChange={(e) => setOrderLookupInput(e.target.value.toUpperCase())}
                            placeholder="Contoh: PH-2026-XXXX"
                            className="flex-1 rounded-xl border border-[#60241E] bg-[#240E0C] px-3.5 py-2.5 text-xs font-black text-white placeholder-stone-500 uppercase tracking-wider focus:border-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                lookupOrder(orderLookupInput)
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={isCheckingOrder || !orderLookupInput.trim()}
                            onClick={() => lookupOrder(orderLookupInput)}
                            className="rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] hover:brightness-110 disabled:opacity-50 px-4 py-2.5 text-xs font-dhaksinarga tracking-wide font-black text-[#1C0B09] transition shadow-md cursor-pointer shrink-0"
                          >
                            {isCheckingOrder ? 'Memuat...' : 'Muat Pesanan'}
                          </button>
                        </div>

                        {orderError && (
                          <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 mt-1 bg-red-950/60 p-2 rounded-lg border border-red-800">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{orderError}</span>
                          </p>
                        )}
                      </div>

                      {/* Toggle for manual mode if customer does not have order code */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setIsManualMode(!isManualMode)}
                          className="text-xs font-bold text-amber-300 hover:text-[#F59E0B] underline underline-offset-4 cursor-pointer transition"
                        >
                          {isManualMode
                            ? 'Sembunyikan form manual'
                            : 'Tidak memiliki nomor pesanan? Tulis ulasan manual'}
                        </button>
                      </div>

                      {isManualMode && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#1C0B09] border border-[#60241E] animate-in fade-in">
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-amber-100/80 mb-1.5 flex items-center gap-1.5">
                              <User size={13} className="text-[#F59E0B]" />
                              Nama Lengkap *
                            </label>
                            <input
                              type="text"
                              required={isManualMode}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Contoh: Dian Safitri"
                              className="w-full rounded-xl border border-[#60241E] bg-[#240E0C] px-3.5 py-2.5 text-xs font-medium text-white placeholder-stone-500 focus:border-[#F59E0B] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-amber-100/80 mb-1.5 flex items-center gap-1.5">
                              <Package size={13} className="text-[#F59E0B]" />
                              Jumlah Pesanan / Box *
                            </label>
                            <input
                              type="text"
                              required={isManualMode}
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(e.target.value)}
                              placeholder="Contoh: 85 Box Bento"
                              className="w-full rounded-xl border border-[#60241E] bg-[#240E0C] px-3.5 py-2.5 text-xs font-medium text-white placeholder-stone-500 focus:border-[#F59E0B] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1. Rating Bintang Interaktif */}
                  <div className="rounded-2xl bg-[#1C0B09] border border-[#60241E] p-5 sm:p-6 text-center space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-300/80 font-dhaksinarga">
                      Penilaian Keseluruhan (Bintang) *
                    </label>

                    <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled = starValue <= activeRating
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="group relative p-1 focus:outline-none transition-transform active:scale-95 cursor-pointer"
                            aria-label={`Beri nilai ${starValue} bintang`}
                          >
                            <Star
                              size={38}
                              className={`transition-all duration-200 ${
                                isFilled
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm scale-110'
                                  : 'text-stone-600 group-hover:text-amber-300'
                              }`}
                            />
                          </button>
                        )
                      })}
                    </div>

                    <div className="text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-white">
                      {activeRatingDesc.title} —{' '}
                      <span className="font-medium text-amber-200/70">{activeRatingDesc.subtitle}</span>
                    </div>
                  </div>

                  {/* 2. Teks Ulasan */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-100/80 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageSquareQuote size={14} className="text-[#F59E0B]" />
                        Ulasan Pengalaman Katering Anda *
                      </span>
                      <span className="text-[11px] font-normal text-stone-500">
                        {message.length}/1000 karakter
                      </span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      maxLength={1000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ceritakan kepuasan Anda mengenai kelezatan bento, porsi, ketepatan pengantaran, atau respon admin Pawon Hara..."
                      className="w-full rounded-2xl border border-[#60241E] bg-[#1C0B09] px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 transition resize-y"
                    />
                  </div>

                  {/* 3. Instansi / Acara (Opsional) */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-100/80 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-[#F59E0B]" />
                        Nama Instansi / Acara (Opsional)
                      </span>
                      <span className="text-[11px] font-normal text-stone-500 normal-case">
                        Untuk dicantumkan di kartu testimoni
                      </span>
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Contoh: HR PT Mandiri / Syukuran Keluarga"
                      className="w-full rounded-2xl border border-[#60241E] bg-[#1C0B09] px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 transition"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] hover:brightness-110 active:scale-[0.99] px-6 py-4 text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] transition shadow-lg shadow-[#F59E0B]/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-[#1C0B09]" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Mengirim Ulasan...
                        </span>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Kirim Testimoni Sekarang</span>
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-[11px] text-amber-200/60">
                      Ulasan Anda membantu pelanggan lain memilih paket katering terbaik di Pawon Hara.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
