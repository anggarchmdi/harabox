import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Clock4,
  ChefHat,
  PackageCheck,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Truck,
  FileText,
  BadgeCheck,
  CheckCircle2,
  Coins,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Order, OrderStatus } from '../types/orders'
import { ordersService } from '../services/orders.service'
import { getImageUrl } from '../utils/image'
import PageLoader from '../components/ui/PageLoader'
import PaymentStatusBadge from '../components/admin/orders/PaymentStatusBadge'

// Fallback images
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'

function getItemImage(name: string, imageUrl?: string | null): string {
  const uploaded = getImageUrl(imageUrl)
  if (uploaded) return uploaded

  const n = name.toLowerCase()
  if (n.includes('katsu') || n.includes('bento')) return BentoKatsuImg
  if (n.includes('telur')) return BentoTelurImg
  if (n.includes('kuning') && n.includes('paha')) return NasiKuningPahaImg
  if (n.includes('kuning')) return NasiKuningBaladoImg
  if (n.includes('rames') && n.includes('paha')) return RamesPahaImg
  if (n.includes('rames')) return RamesBaladoImg
  if (n.includes('dada')) return KrisbarDadaImg
  if (n.includes('krisbar')) return KrisbarPahaImg
  if (n.includes('ekonomis')) return EkonomisBaladoImg
  return BentoKatsuImg
}

function formatRupiah(value: number | string): string {
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

interface StatusTheme {
  title: string
  subtext: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  icon: any
  gradient: string
  ringColor: string
  glowShadow: string
  accentColor: string
  stepIndex: number
  cardBgGradient: string
  cardBorderColor: string
}

const STATUS_CONFIG: Record<OrderStatus, StatusTheme> = {
  pending: {
    title: 'Pesanan Menunggu Konfirmasi',
    subtext: 'Pesanan Anda telah tercatat di sistem Hara. Tim admin sedang memverifikasi ketersediaan jadwal & bahan.',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    icon: Clock4,
    gradient: 'from-amber-500 via-amber-600 to-orange-500',
    ringColor: 'ring-amber-400',
    glowShadow: 'shadow-amber-500/20',
    accentColor: 'text-amber-600',
    stepIndex: 0,
    cardBgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    cardBorderColor: 'border-amber-200',
  },
  confirmed: {
    title: 'Pesanan Dikonfirmasi Resmi',
    subtext: 'Jadwal & slot katering acara Anda telah disetujui dan dikunci dalam antrean produksi resmi kami.',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    icon: ShieldCheck,
    gradient: 'from-blue-600 via-indigo-600 to-sky-500',
    ringColor: 'ring-blue-400',
    glowShadow: 'shadow-blue-500/20',
    accentColor: 'text-blue-600',
    stepIndex: 1,
    cardBgGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    cardBorderColor: 'border-blue-200',
  },
  processing: {
    title: 'Sedang Dimasak di Dapur',
    subtext: 'Dapur Hara Chicken sedang meracik hidangan segar dan menyusun paket box katering Anda dengan higienis.',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-300',
    icon: ChefHat,
    gradient: 'from-orange-500 via-amber-500 to-red-500',
    ringColor: 'ring-orange-400',
    glowShadow: 'shadow-orange-500/20',
    accentColor: 'text-orange-600',
    stepIndex: 2,
    cardBgGradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
    cardBorderColor: 'border-orange-200',
  },
  completed: {
    title: 'Pesanan Selesai / Terkirim',
    subtext: 'Seluruh paket katering telah selesai disiapkan dan diantarkan ke lokasi acara. Selamat menikmati hidangan!',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    icon: PackageCheck,
    gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
    ringColor: 'ring-emerald-400',
    glowShadow: 'shadow-emerald-500/20',
    accentColor: 'text-emerald-600',
    stepIndex: 3,
    cardBgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    cardBorderColor: 'border-emerald-200',
  },
  cancelled: {
    title: 'Pesanan Dibatalkan',
    subtext: 'Pesanan ini telah dibatalkan. Silakan hubungi customer service kami via WhatsApp jika membutuhkan bantuan.',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    icon: XCircle,
    gradient: 'from-rose-500 to-red-600',
    ringColor: 'ring-rose-400',
    glowShadow: 'shadow-rose-500/20',
    accentColor: 'text-rose-600',
    stepIndex: -1,
    cardBgGradient: 'from-rose-500/10 via-red-500/5 to-transparent',
    cardBorderColor: 'border-rose-200',
  },
}

const TIMELINE_STEPS = [
  {
    key: 'pending',
    stepNum: '01',
    title: 'Pesanan Masuk',
    subtitle: 'Tercatat di sistem',
    icon: FileText,
    colorGradient: 'from-amber-500 to-orange-500',
    glowShadow: 'shadow-amber-500/30',
    ringColor: 'ring-amber-400',
    badgeText: 'text-amber-800',
    badgeBg: 'bg-amber-100',
  },
  {
    key: 'confirmed',
    stepNum: '02',
    title: 'Dikonfirmasi',
    subtitle: 'Slot katering terkunci',
    icon: ShieldCheck,
    colorGradient: 'from-blue-600 to-indigo-600',
    glowShadow: 'shadow-blue-500/30',
    ringColor: 'ring-blue-400',
    badgeText: 'text-blue-800',
    badgeBg: 'bg-blue-100',
  },
  {
    key: 'processing',
    stepNum: '03',
    title: 'Dimasak Dapur',
    subtitle: 'Racikan hidangan segar',
    icon: ChefHat,
    colorGradient: 'from-orange-500 to-amber-500',
    glowShadow: 'shadow-orange-500/30',
    ringColor: 'ring-orange-400',
    badgeText: 'text-orange-800',
    badgeBg: 'bg-orange-100',
  },
  {
    key: 'completed',
    stepNum: '04',
    title: 'Selesai / Terkirim',
    subtitle: 'Siap dinikmati di lokasi',
    icon: Truck,
    colorGradient: 'from-emerald-500 to-teal-600',
    glowShadow: 'shadow-emerald-500/30',
    ringColor: 'ring-emerald-400',
    badgeText: 'text-emerald-800',
    badgeBg: 'bg-emerald-100',
  },
]

export default function OrderTrackingPage() {
  const { orderCode: routeOrderCode } = useParams<{ orderCode?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCode = routeOrderCode || searchParams.get('code') || ''
  const initialPhone = searchParams.get('phone') || ''

  const [inputCode, setInputCode] = useState(initialCode)
  const [inputPhone, setInputPhone] = useState(initialPhone)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchOrder = async (codeToFetch: string, phoneToVerify?: string) => {
    const cleanCode = codeToFetch.trim().toUpperCase()
    if (!cleanCode) {
      toast.error('Masukkan kode pesanan terlebih dahulu.')
      return
    }

    try {
      setLoading(true)
      setHasSearched(true)
      const data = await ordersService.trackOrder(cleanCode, phoneToVerify?.trim() || undefined)
      setOrder(data)
      setSearchParams({ code: cleanCode, ...(phoneToVerify ? { phone: phoneToVerify.trim() } : {}) })
    } catch (err: any) {
      console.error(err)
      setOrder(null)
      const msg = err?.response?.data?.message || 'Pesanan tidak ditemukan. Periksa kembali kode pesanan Anda.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Auto-search on mount if code param is present
  useEffect(() => {
    if (initialCode) {
      fetchOrder(initialCode, initialPhone)
    }
  }, [initialCode])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrder(inputCode, inputPhone)
  }

  const handleCopyCode = () => {
    if (!order) return
    navigator.clipboard.writeText(order.order_code)
    setCopied(true)
    toast.success('Kode pesanan berhasil disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const currentTheme = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending
  const currentStep = order ? currentTheme.stepIndex : 0
  const isCancelled = order?.status === 'cancelled'

  const progressPercentage = isCancelled
    ? 0
    : currentStep === 0
      ? 15
      : currentStep === 1
        ? 45
        : currentStep === 2
          ? 75
          : 100

  const totalPortions = order?.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0

  const waAskAdminUrl = order
    ? `https://wa.me/6289669743193?text=${encodeURIComponent(
        `Halo Admin Hara Chicken, saya ingin menanyakan perkembangan pesanan katering saya:\n\n` +
          `• *No. Pesanan:* ${order.order_code}\n` +
          `• *Nama Pemesan:* ${order.customers_name}\n` +
          `• *Tanggal Acara:* ${formatDateIndo(order.event_date)}\n\n` +
          `Bisa dibantu cek status terbarunya? Terima kasih!`,
      )}`
    : 'https://wa.me/6289669743193'

  return (
    <main className="min-h-screen bg-[#fafaf9] pt-24 sm:pt-28 pb-28 text-stone-900 selection:bg-red-600 selection:text-white print:bg-white print:pt-0 print:pb-0">
      {/* Branded Loading Overlay */}
      <PageLoader
        isLoading={loading}
        text="Melacak Status Pesanan..."
        subtext="Memeriksa antrean produksi, jadwal dapur, dan rincian katering Hara Chicken"
        minDuration={500}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header (Hidden in Print) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-600 shadow-2xs transition hover:bg-stone-50 hover:text-stone-900"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Menu Katering</span>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Tracker Sistem Hara Chicken</span>
          </div>
        </div>

        {/* Hero Search Section (Hidden in Print) */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs print:hidden">
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3.5 py-1 text-xs font-bold text-red-700 mb-3 shadow-2xs">
              <Sparkles size={13} className="text-red-600 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Real-Time Catering Tracking</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-stone-900">
              Lacak Status Pesanan Katering
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed">
              Pantau persiapan dapur katering, konfirmasi slot, dan jadwal pengiriman pesanan Anda secara transparan.
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:gap-2.5 text-left">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Kode Pesanan (HB-20260915-XXXXXX)"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 pl-10 pr-4 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-900 placeholder:font-normal placeholder:normal-case placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10"
                />
              </div>

              <div className="relative sm:w-56">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="No. WA Pemesan (opsional)"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 pl-10 pr-4 py-3.5 text-xs sm:text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 hover:bg-red-600 px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Lacak Pesanan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* =========================================================================
            FOUND ORDER DETAILS & THEMED CARDS
        ========================================================================== */}
        {order ? (
          <div className="space-y-6">
            {/* 1. Dynamic Hero Status Card with Rich Color Palette */}
            <div
              className={`relative overflow-hidden rounded-3xl border ${currentTheme.cardBorderColor} bg-white p-6 sm:p-8 shadow-sm transition-all`}
            >
              {/* Colored ambient glow backdrop */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${currentTheme.cardBgGradient}`}
              />

              <div className="relative z-10">
                {/* Header Row: Code & Live Status Badge */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/70 pb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Kode Pesanan
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200/90 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 active:scale-95 transition print:hidden"
                        title="Salin kode pesanan"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <h2 className="mt-1 font-mono text-2xl sm:text-3xl font-black tracking-tight text-stone-900">
                      {order.order_code}
                    </h2>
                  </div>

                  {/* Dynamic Status & Payment Badges */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
                    <PaymentStatusBadge
                      status={order.payment_status}
                      paidAmount={order.paid_amount}
                      paymentMethod={order.payment_method}
                    />

                    <div
                      className={`inline-flex items-center gap-2 rounded-full border ${currentTheme.badgeBorder} ${currentTheme.badgeBg} ${currentTheme.badgeText} px-4 py-2 text-xs font-bold shadow-2xs`}
                    >
                      <span className="flex h-2.5 w-2.5 relative">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isCancelled
                              ? 'bg-rose-500'
                              : order.status === 'completed'
                                ? 'bg-emerald-500'
                                : order.status === 'processing'
                                  ? 'bg-orange-500'
                                  : order.status === 'confirmed'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            isCancelled
                              ? 'bg-rose-600'
                              : order.status === 'completed'
                                ? 'bg-emerald-600'
                                : order.status === 'processing'
                                  ? 'bg-orange-600'
                                  : order.status === 'confirmed'
                                    ? 'bg-blue-600'
                                    : 'bg-amber-600'
                          }`}
                        />
                      </span>
                      <span>{currentTheme.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition print:hidden"
                      title="Cetak nota pesanan"
                    >
                      <Printer size={14} />
                      <span>Cetak Nota</span>
                    </button>
                  </div>
                </div>

                {/* Status Explanation Banner */}
                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/80 p-4 border border-stone-200/60 shadow-2xs backdrop-blur-xs">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.gradient} text-white shadow-sm`}
                  >
                    <currentTheme.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{currentTheme.title}</h3>
                    <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">{currentTheme.subtext}</p>
                  </div>
                </div>

                {/* 2. Interactive Step Timeline with Dynamic Progress Colors */}
                {!isCancelled ? (
                  <div className="mt-8 pt-2">
                    {/* Horizontal Connector Line (Desktop) */}
                    <div className="relative hidden sm:block mb-8">
                      {/* Base Track */}
                      <div className="absolute top-5 inset-x-8 h-1.5 rounded-full bg-stone-200/80 -translate-y-1/2" />
                      {/* Active Progress Gradient Bar */}
                      <div
                        style={{ width: `${progressPercentage}%` }}
                        className="absolute top-5 left-8 h-1.5 rounded-full bg-gradient-to-r from-amber-500 via-blue-500 via-orange-500 to-emerald-500 -translate-y-1/2 transition-all duration-700 ease-out shadow-xs"
                      />
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const Icon = step.icon
                        const isDone = currentStep >= idx
                        const isCurrent = currentStep === idx

                        return (
                          <div
                            key={step.key}
                            className={`flex sm:flex-col items-start gap-3.5 rounded-2xl p-3.5 transition-all ${
                              isCurrent
                                ? `${currentTheme.cardBgGradient} border-2 ${currentTheme.cardBorderColor} bg-white shadow-sm scale-[1.02]`
                                : isDone
                                  ? 'bg-stone-50/80 border border-stone-200/70'
                                  : 'bg-stone-50/40 border border-transparent opacity-60'
                            }`}
                          >
                            {/* Step Icon Badge */}
                            <div
                              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold transition-all shadow-xs ${
                                isCurrent
                                  ? `bg-gradient-to-br ${step.colorGradient} text-white ring-4 ${step.ringColor} ${step.glowShadow}`
                                  : isDone
                                    ? `bg-gradient-to-br ${step.colorGradient} text-white`
                                    : 'bg-stone-200 text-stone-400'
                              }`}
                            >
                              <Icon size={19} />
                              {isDone && !isCurrent && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              )}
                            </div>

                            {/* Step Description */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                  Langkah {step.stepNum}
                                </span>
                                {isCurrent && (
                                  <span
                                    className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider ${step.badgeBg} ${step.badgeText}`}
                                  >
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <h4
                                className={`text-xs sm:text-sm font-bold mt-0.5 ${
                                  isCurrent ? 'text-stone-950 font-black' : isDone ? 'text-stone-800' : 'text-stone-400'
                                }`}
                              >
                                {step.title}
                              </h4>
                              <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                                {step.subtitle}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5 flex items-start gap-3.5 text-rose-900">
                    <XCircle size={24} className="shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Pesanan Telah Dibatalkan</h4>
                      <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                        Pesanan ini berstatus batal di sistem kami. Jika ada perubahan atau ingin melakukan pemesanan ulang untuk jadwal acara baru, silakan hubungi tim kami melalui tombol WhatsApp di bawah.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Detailed Information (2-Column Responsive Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 Cols): Event & Delivery Information */}
              <div className="lg:col-span-5 space-y-6">
                {/* Event Schedule Card */}
                <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">Jadwal Acara & Pengantaran</h3>
                      <span className="text-[11px] text-stone-400">Waktu pelaksanaan catering</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-stone-400 block">
                        Hari & Tanggal Acara
                      </span>
                      <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                        {formatDateIndo(order.event_date)}
                      </span>
                    </div>

                    {order.event_time && (
                      <div>
                        <span className="text-[11px] font-semibold text-stone-400 block">
                          Waktu Santap / Jam Tiba
                        </span>
                        <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-800">
                          <Clock4 size={13} className="text-stone-500" />
                          <span>Pukul {order.event_time} WIB</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[11px] font-semibold text-stone-400 block">
                        Alamat Pengiriman / Lokasi Acara
                      </span>
                      <div className="mt-1 flex items-start gap-2.5 rounded-2xl bg-stone-50 p-3.5 border border-stone-200/70">
                        <MapPin size={16} className="shrink-0 text-red-600 mt-0.5" />
                        <span className="text-stone-800 font-medium leading-relaxed">
                          {order.delivery_address}
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <div>
                        <span className="text-[11px] font-semibold text-stone-400 block">
                          Catatan Khusus Pemesan
                        </span>
                        <div className="mt-1 rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/70 text-amber-900 text-xs leading-relaxed italic">
                          "{order.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <User size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">Data Pemesan</h3>
                      <span className="text-[11px] text-stone-400">Kontak penerima pesanan</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-stone-500">Nama Pemesan</span>
                      <span className="font-bold text-stone-900">{order.customers_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-stone-100">
                      <span className="text-stone-500">Nomor WhatsApp</span>
                      <span className="font-mono font-bold text-stone-900">{order.customers_phone}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-stone-100">
                      <span className="text-stone-500">Waktu Order Dibuat</span>
                      <span className="font-semibold text-stone-700">
                        {new Date(order.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Action Card (Hidden in Print) */}
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-6 shadow-xs print:hidden">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                      <MessageCircle size={22} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-emerald-950">
                        Butuh Bantuan atau Perubahan Menu?
                      </h4>
                      <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                        Tim admin Hara Chicken siap membantu penyesuaian porsi, konfirmasi bukti pembayaran, atau jadwal pengiriman.
                      </p>
                      <a
                        href={waAskAdminUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                      >
                        <MessageCircle size={15} />
                        <span>Chat Admin via WhatsApp</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols): Items List & Billing */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">Rincian Paket Menu</h3>
                        <span className="text-[11px] text-stone-400">
                          {order.items?.length || 0} Menu • {totalPortions} Porsi Total
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">
                      {totalPortions} Box Katering
                    </span>
                  </div>

                  {/* Item Rows */}
                  <div className="divide-y divide-stone-100 mt-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        const imageSrc = getItemImage(item.item_name)

                        return (
                          <div key={item.id || index} className="py-4.5 flex gap-3.5 sm:gap-4 items-start">
                            <img
                              src={imageSrc}
                              alt={item.item_name}
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-stone-200/80 shrink-0 bg-stone-100 shadow-2xs"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                                  {item.item_name}
                                </h4>
                                <span className="text-xs sm:text-sm font-black text-stone-900">
                                  {formatRupiah(item.subtotal)}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-2 text-xs text-stone-500 font-medium">
                                <span className="rounded-md bg-stone-100 px-2 py-0.5 font-bold text-stone-800">
                                  {item.quantity} Porsi
                                </span>
                                <span>@ {formatRupiah(item.price)}</span>
                              </div>

                              {/* Item Addons */}
                              {item.addons && item.addons.length > 0 && (
                                <div className="mt-2.5 rounded-xl bg-stone-50/80 p-2.5 border border-stone-200/50 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                    Pilihan Variasi / Add-on:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.addons.map((a, aIdx) => (
                                      <span
                                        key={a.id || aIdx}
                                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 border border-stone-200/80 shadow-2xs"
                                      >
                                        <span className="text-stone-400">•</span>
                                        <span>
                                          {a.addon_group_name ? `${a.addon_group_name}: ` : ''}
                                          {a.addon_name}
                                        </span>
                                        {Number(a.price) > 0 && (
                                          <span className="text-red-600 font-bold">
                                            (+{formatRupiah(a.price)})
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 text-center text-xs text-stone-400">
                        Tidak ada item pesanan yang tercatat.
                      </div>
                    )}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="mt-6 border-t border-stone-100 pt-5 space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal Menu</span>
                      <span className="font-semibold text-stone-900">{formatRupiah(order.subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-stone-600">
                      <span>Estimasi Ongkos Kirim</span>
                      <span className="font-semibold text-stone-900">
                        {Number(order.delivery_fee) > 0 ? formatRupiah(order.delivery_fee) : 'Gratis'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-stone-200 pt-3 text-base sm:text-lg font-black text-stone-900">
                      <span>Total Pembayaran</span>
                      <span className="text-red-600 font-black">{formatRupiah(order.total)}</span>
                    </div>

                    {/* Payment Status & Breakdown Card */}
                    <div className="mt-4 pt-3 border-t border-dashed border-stone-200">
                      {order.payment_status === 'paid' ? (
                        <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200/90 p-4 flex items-start gap-3.5 shadow-2xs">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                Pembayaran Lunas
                              </span>
                              <span className="text-xs font-mono font-black text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                {formatRupiah(order.paid_amount || order.total)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-emerald-800/90 leading-relaxed">
                              Pembayaran katering Anda telah terverifikasi lunas
                              {order.payment_method ? ` melalui ${order.payment_method}` : ''}.
                              Pesanan siap diproduksi dan dikirim sesuai jadwal!
                            </p>
                          </div>
                        </div>
                      ) : order.payment_status === 'dp' ? (
                        <div className="rounded-2xl bg-amber-50/90 border border-amber-300/80 p-4 space-y-3 shadow-2xs">
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                              <Coins size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                                  DP / Uang Muka Masuk
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
                                  {formatRupiah(order.paid_amount || 0)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-amber-800/90">
                                DP telah tercatat di sistem kami
                                {order.payment_method ? ` via ${order.payment_method}` : ''}.
                              </p>
                            </div>
                          </div>

                          <div className="rounded-xl bg-white/90 border border-amber-200/90 p-3 flex justify-between items-center text-xs">
                            <span className="font-bold text-stone-700">Sisa Tagihan Pelunasan:</span>
                            <span className="font-mono font-black text-sm text-red-600">
                              {formatRupiah(Math.max(0, Number(order.total) - Number(order.paid_amount || 0)))}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800/80 leading-snug">
                            * Sisa pembayaran dapat dilunasi saat serah terima pesanan atau sesuai kesepakatan dengan admin.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 flex items-start gap-3.5 shadow-2xs">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-400 text-white shadow-xs">
                            <Clock4 size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                                Status Pembayaran
                              </span>
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 rounded-md px-2 py-0.5">
                                Menunggu Konfirmasi / DP
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                              Sistem belum mencatat pelunasan atau DP untuk pesanan ini. Silakan kirimkan bukti transfer ke WhatsApp admin agar pesanan Anda dapat segera masuk antrean dapur.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quality & Hygiene Guarantee */}
                  <div className="mt-6 rounded-2xl bg-stone-50 p-4 border border-stone-200/70 flex items-center gap-3 text-xs text-stone-600">
                    <BadgeCheck size={20} className="text-emerald-600 shrink-0" />
                    <span>
                      Seluruh paket diproduksi segar di hari pengantaran, terjamin halal, dan disegel rapi sesuai standar mutu katering Hara Chicken.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : hasSearched && !loading ? (
          /* Empty State when order not found */
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-lg mx-auto shadow-2xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-stone-900">Pesanan Tidak Ditemukan</h3>
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
              Mohon periksa kembali kode pesanan Anda seperti yang tertera pada pesan WhatsApp (contoh format: <span className="font-mono font-bold text-stone-700">HB-YYYYMMDD-XXXXXX</span>).
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/menu"
                className="rounded-2xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition shadow-xs"
              >
                Jelajahi Menu Katering
              </Link>
            </div>
          </div>
        ) : (
          /* Initial Guide */
          <div className="rounded-3xl border border-stone-200/80 bg-white/70 p-8 sm:p-10 shadow-2xs text-center max-w-xl mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <FileText size={28} />
            </div>
            <h3 className="mt-4 text-base sm:text-lg font-bold text-stone-900">
              Cara Menemukan Kode Pesanan Anda
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Kode pesanan unik diterbitkan otomatis saat Anda menyelesaikan pesanan di keranjang belanja, serta tercantum pada pesan WhatsApp admin katering Hara Chicken. Masukkan kode di kolom pencarian di atas untuk melihat live tracking statusnya.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
