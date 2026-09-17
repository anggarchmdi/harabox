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
  MessageSquareQuote,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Order, OrderStatus } from '../types/orders'
import { ordersService } from '../services/orders.service'
import { useThemeStore } from '../stores/theme.store'
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
    subtext: 'Pesanan Anda telah tercatat di sistem Pawon Hara. Tim admin sedang memverifikasi ketersediaan jadwal & bahan.',
    badgeBg: 'bg-amber-950/60',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700/80',
    icon: Clock4,
    gradient: 'from-amber-500 via-amber-600 to-orange-500',
    ringColor: 'ring-amber-400',
    glowShadow: 'shadow-amber-500/20',
    accentColor: 'text-amber-400',
    stepIndex: 0,
    cardBgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    cardBorderColor: 'border-amber-700/60',
  },
  confirmed: {
    title: 'Pesanan Dikonfirmasi Resmi',
    subtext: 'Jadwal & slot katering acara Anda telah disetujui dan dikunci dalam antrean produksi Pawon Hara.',
    badgeBg: 'bg-blue-950/60',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-700/80',
    icon: ShieldCheck,
    gradient: 'from-blue-600 via-indigo-600 to-sky-500',
    ringColor: 'ring-blue-400',
    glowShadow: 'shadow-blue-500/20',
    accentColor: 'text-blue-400',
    stepIndex: 1,
    cardBgGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    cardBorderColor: 'border-blue-700/60',
  },
  processing: {
    title: 'Sedang Dimasak di Dapur',
    subtext: 'Dapur Pawon Hara sedang meracik hidangan segar dan menyusun paket katering Anda dengan higienis.',
    badgeBg: 'bg-orange-950/60',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-700/80',
    icon: ChefHat,
    gradient: 'from-[#F59E0B] via-[#E77B49] to-[#95271D]',
    ringColor: 'ring-[#F59E0B]',
    glowShadow: 'shadow-[#F59E0B]/20',
    accentColor: 'text-[#F59E0B]',
    stepIndex: 2,
    cardBgGradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
    cardBorderColor: 'border-orange-700/60',
  },
  completed: {
    title: 'Pesanan Selesai / Terkirim',
    subtext: 'Seluruh paket katering telah selesai disiapkan dan diantarkan ke lokasi acara. Selamat menikmati hidangan Pawon Hara!',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700/80',
    icon: PackageCheck,
    gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
    ringColor: 'ring-emerald-400',
    glowShadow: 'shadow-emerald-500/20',
    accentColor: 'text-emerald-400',
    stepIndex: 3,
    cardBgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    cardBorderColor: 'border-emerald-700/60',
  },
  cancelled: {
    title: 'Pesanan Dibatalkan',
    subtext: 'Pesanan ini telah dibatalkan. Silakan hubungi admin Pawon Hara via WhatsApp jika membutuhkan bantuan.',
    badgeBg: 'bg-rose-950/60',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-700/80',
    icon: XCircle,
    gradient: 'from-rose-500 to-red-600',
    ringColor: 'ring-rose-400',
    glowShadow: 'shadow-rose-500/20',
    accentColor: 'text-rose-400',
    stepIndex: -1,
    cardBgGradient: 'from-rose-500/10 via-red-500/5 to-transparent',
    cardBorderColor: 'border-rose-700/60',
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
  {
    key: 'review',
    stepNum: '05',
    title: 'Ulasan & Rating',
    subtitle: 'Bagikan cerita rasa Anda',
    icon: Star,
    colorGradient: 'from-amber-400 via-amber-500 to-orange-500',
    glowShadow: 'shadow-amber-500/30',
    ringColor: 'ring-amber-400',
    badgeText: 'text-amber-800',
    badgeBg: 'bg-amber-100',
  },
]

export default function OrderTrackingPage() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'
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
      ? 12
      : currentStep === 1
        ? 35
        : currentStep === 2
          ? 65
          : 90

  const totalPortions = order?.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0

  const testimonialBaseUrl = order
    ? `/testimoni?name=${encodeURIComponent(order.customers_name)}&order=${encodeURIComponent(
        order.order_code,
      )}&qty=${encodeURIComponent(`${totalPortions} Box`)}`
    : '/testimoni'

  const waAskAdminUrl = order
    ? `https://wa.me/6289669743193?text=${encodeURIComponent(
        `Halo Admin Pawon Hara, saya ingin menanyakan perkembangan pesanan katering saya:\n\n` +
          `• *No. Pesanan:* ${order.order_code}\n` +
          `• *Nama Pemesan:* ${order.customers_name}\n` +
          `• *Tanggal Acara:* ${formatDateIndo(order.event_date)}\n\n` +
          `Bisa dibantu cek status terbarunya? Terima kasih!`,
      )}`
    : 'https://wa.me/6289669743193'

  return (
    <main className={`min-h-screen pt-24 sm:pt-28 pb-28 transition-colors duration-300 print:bg-white print:pt-0 print:pb-0 ${
      isDark
        ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
        : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-white'
    }`}>
      {/* Branded Loading Overlay */}
      <PageLoader
        isLoading={loading}
        text="Melacak Status Pesanan..."
        subtext="Memeriksa antrean produksi, jadwal dapur, dan rincian katering Pawon Hara"
        minDuration={500}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header (Hidden in Print) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/menu"
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-2xs transition ${
              isDark
                ? 'border border-[#60241E] bg-[#2D120F] text-amber-200 hover:bg-[#3B1814] hover:text-white hover:border-[#F59E0B]'
                : 'border border-[#E6DACD] bg-white text-[#5C3831] hover:bg-[#FAF5EE] hover:text-[#2B120E] hover:border-[#D97706]'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Menu Katering</span>
          </Link>

          <div className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs border ${
            isDark
              ? 'border-[#60241E] bg-[#2D120F] text-amber-300'
              : 'border-[#E6DACD] bg-white text-[#5C3831]'
          }`}>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Tracker Pawon Hara</span>
          </div>
        </div>

        {/* Hero Search Section (Hidden in Print) */}
        <section className={`relative mb-8 overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-xl print:hidden ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
        }`}>
          {/* Ambient background glow */}
          <div className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl ${
            isDark ? 'bg-[#60241E]/40' : 'bg-amber-200/30'
          }`} />
          <div className={`pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full blur-3xl ${
            isDark ? 'bg-[#F59E0B]/15' : 'bg-orange-200/30'
          }`} />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold mb-3 shadow-2xs ${
              isDark ? 'border-[#60241E] bg-[#2D120F] text-amber-400' : 'border-[#E6DACD] bg-[#FAF5EE] text-[#D97706]'
            }`}>
              <Sparkles size={13} className={isDark ? 'text-[#F59E0B] animate-spin' : 'text-[#D97706] animate-spin'} style={{ animationDuration: '8s' }} />
              <span className="font-dhaksinarga tracking-widest text-xs">PELACAKAN STATUS REAL-TIME</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-dhaksinarga tracking-wide font-black ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}>
              Lacak Status Pesanan Katering
            </h1>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-amber-100/70' : 'text-[#5C3831]'
            }`}>
              Pantau persiapan dapur katering, konfirmasi slot, dan jadwal pengiriman pesanan Anda dari Pawon Hara secara transparan.
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:gap-2.5 text-left">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-amber-400' : 'text-[#D97706]'
                  }`}
                />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Kode Pesanan (PH-20260915-XXXXXX)"
                  className={`w-full rounded-2xl border pl-10 pr-4 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider outline-none transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:font-normal placeholder:normal-case placeholder:text-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                      : 'border-[#E6DACD] bg-[#FAF5EE] text-[#2B120E] placeholder:font-normal placeholder:normal-case placeholder:text-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                  }`}
                />
              </div>

              <div className="relative sm:w-56">
                <Phone
                  size={16}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-amber-400' : 'text-[#D97706]'
                  }`}
                />
                <input
                  type="text"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="No. WA Pemesan (opsional)"
                  className={`w-full rounded-2xl border pl-10 pr-4 py-3.5 text-xs sm:text-sm font-semibold outline-none transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:font-normal placeholder:text-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                      : 'border-[#E6DACD] bg-[#FAF5EE] text-[#2B120E] placeholder:font-normal placeholder:text-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-7 py-3.5 text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 transition duration-300 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
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
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-xl transition-all ${
                isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-100'
                  : 'border-[#E6DACD] bg-white text-[#2B120E]'
              }`}
            >
              {/* Colored ambient glow backdrop */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
                  isDark ? currentTheme.cardBgGradient : 'from-amber-500/5 via-orange-500/5 to-transparent'
                }`}
              />

              <div className="relative z-10">
                {/* Header Row: Code & Live Status Badge */}
                <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6 ${
                  isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                      }`}>
                        Kode Pesanan
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold shadow-2xs active:scale-95 transition print:hidden cursor-pointer ${
                          isDark
                            ? 'border-[#60241E] bg-[#2D120F] text-amber-200 hover:bg-[#3B1814]'
                            : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831] hover:bg-[#F5EDE4]'
                        }`}
                        title="Salin kode pesanan"
                      >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <h2 className={`mt-1 font-dhaksinarga text-2xl sm:text-3xl font-black tracking-wide ${
                      isDark ? 'text-white' : 'text-[#2B120E]'
                    }`}>
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
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-2xs ${
                        isDark
                          ? `${currentTheme.badgeBorder} ${currentTheme.badgeBg} ${currentTheme.badgeText}`
                          : 'border-amber-300 bg-amber-50 text-amber-900'
                      }`}
                    >
                      <span className="flex h-2.5 w-2.5 relative">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isCancelled
                              ? 'bg-rose-500'
                              : order.status === 'completed'
                                ? 'bg-emerald-500'
                                : order.status === 'processing'
                                  ? 'bg-[#F59E0B]'
                                  : order.status === 'confirmed'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            isCancelled
                              ? 'bg-rose-500'
                              : order.status === 'completed'
                                ? 'bg-emerald-500'
                                : order.status === 'processing'
                                  ? 'bg-[#F59E0B]'
                                  : order.status === 'confirmed'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                          }`}
                        />
                      </span>
                      <span className="font-dhaksinarga tracking-wide">{currentTheme.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs transition print:hidden cursor-pointer ${
                        isDark
                          ? 'border-[#60241E] bg-[#2D120F] text-amber-200 hover:bg-[#3B1814] hover:text-white'
                          : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831] hover:bg-[#F5EDE4] hover:text-[#2B120E]'
                      }`}
                      title="Cetak nota pesanan"
                    >
                      <Printer size={14} />
                      <span>Cetak Nota</span>
                    </button>
                  </div>
                </div>

                {/* Status Explanation Banner */}
                <div className={`mt-5 flex items-start gap-3 rounded-2xl p-4 border shadow-2xs ${
                  isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-[#FAF5EE] border-[#E6DACD]'
                }`}>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentTheme.gradient} text-[#1C0B09] font-black shadow-sm`}
                  >
                    <currentTheme.icon size={20} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-dhaksinarga tracking-wide font-bold ${
                      isDark ? 'text-white' : 'text-[#2B120E]'
                    }`}>{currentTheme.title}</h3>
                    <p className={`mt-0.5 text-xs leading-relaxed ${
                      isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}>{currentTheme.subtext}</p>
                  </div>
                </div>

                {/* 2. Interactive Step Timeline with Dynamic Progress Colors */}
                {!isCancelled ? (
                  <div className="mt-8 pt-2">
                    {/* Horizontal Connector Line (Desktop) */}
                    <div className="relative hidden sm:block mb-8">
                      {/* Base Track */}
                      <div className={`absolute top-5 inset-x-8 h-1.5 rounded-full -translate-y-1/2 ${
                        isDark ? 'bg-[#3B1814]' : 'bg-[#E6DACD]'
                      }`} />
                      {/* Active Progress Gradient Bar */}
                      <div
                        style={{ width: `${progressPercentage}%` }}
                        className="absolute top-5 left-8 h-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] -translate-y-1/2 transition-all duration-700 ease-out shadow-xs"
                      />
                    </div>

                    {/* Steps Grid (5 Steps: Masuk, Dikonfirmasi, Diproses, Selesai, Ulasan) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5 relative">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const Icon = step.icon
                        const isReviewStep = step.key === 'review'
                        const isOrderCompleted = order?.status === 'completed'

                        // For review step: active if order completed
                        const isDone = isReviewStep ? false : currentStep > idx
                        const isCurrent = isReviewStep ? isOrderCompleted : currentStep === idx

                        const StepContainer = isReviewStep && isOrderCompleted ? Link : 'div'
                        const linkProps = isReviewStep && isOrderCompleted
                          ? { to: `${testimonialBaseUrl}&rating=5`, title: 'Klik untuk beri ulasan & rating' }
                          : {}

                        return (
                          <StepContainer
                            key={step.key}
                            {...(linkProps as any)}
                            className={`flex sm:flex-col items-start gap-3 rounded-2xl p-3.5 transition-all ${
                              isReviewStep && isOrderCompleted
                                ? isDark
                                  ? 'border-2 border-[#F59E0B] bg-gradient-to-br from-[#2D120F] via-[#3B1814] to-[#240E0C] shadow-lg scale-[1.02] hover:brightness-110 cursor-pointer ring-2 ring-[#F59E0B]/30'
                                  : 'border-2 border-[#D97706] bg-gradient-to-br from-white via-amber-50 to-orange-50 shadow-lg scale-[1.02] hover:brightness-105 cursor-pointer ring-2 ring-[#D97706]/30'
                                : isCurrent
                                ? isDark
                                  ? `border-2 border-[#F59E0B] bg-[#2D120F] shadow-md scale-[1.02] ring-2 ring-[#F59E0B]/20`
                                  : `border-2 border-[#D97706] bg-white shadow-md scale-[1.02] ring-2 ring-[#D97706]/20`
                                : isDone
                                ? isDark
                                  ? 'bg-[#2D120F] border border-[#60241E]'
                                  : 'bg-white border border-[#E6DACD]'
                                : isDark
                                  ? 'bg-[#1C0B09]/80 border border-[#60241E]/60 opacity-65'
                                  : 'bg-[#FAF5EE] border border-[#E6DACD]/80 opacity-70'
                            }`}
                          >
                            {/* Step Icon Badge */}
                            <div
                              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold transition-all shadow-xs ${
                                isReviewStep && isOrderCompleted
                                  ? 'bg-gradient-to-br from-[#F59E0B] to-[#E77B49] text-[#1C0B09] ring-4 ring-[#F59E0B]/50'
                                  : isCurrent
                                  ? `bg-gradient-to-br from-[#F59E0B] to-[#E77B49] text-[#1C0B09] ring-4 ring-[#F59E0B]/40`
                                  : isDone
                                  ? isDark
                                    ? `bg-[#60241E] text-amber-300`
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isDark
                                    ? 'bg-[#1C0B09] text-stone-500 border border-[#60241E]'
                                    : 'bg-[#FAF5EE] text-stone-400 border border-[#E6DACD]'
                              }`}
                            >
                              <Icon size={19} className={isReviewStep && isOrderCompleted ? 'fill-[#1C0B09]' : ''} />
                              {isDone && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              )}
                              {isReviewStep && isOrderCompleted && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F59E0B] text-[#1C0B09] shadow-xs animate-pulse">
                                  <Sparkles size={10} />
                                </span>
                              )}
                            </div>

                            {/* Step Description */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                                }`}>
                                  Langkah {step.stepNum}
                                </span>
                                {isReviewStep && isOrderCompleted ? (
                                  <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-[#F59E0B] text-[#1C0B09] animate-pulse font-dhaksinarga">
                                    Siap Diulas
                                  </span>
                                ) : isCurrent ? (
                                  <span
                                    className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-[#F59E0B] text-[#1C0B09] font-dhaksinarga"
                                  >
                                    Aktif
                                  </span>
                                ) : null}
                              </div>
                              <h4
                                className={`text-xs sm:text-sm font-dhaksinarga tracking-wide font-bold mt-0.5 ${
                                  isReviewStep && isOrderCompleted
                                    ? isDark ? 'text-[#F59E0B] font-black' : 'text-[#D97706] font-black'
                                    : isCurrent
                                    ? isDark ? 'text-white font-black' : 'text-[#2B120E] font-black'
                                    : isDone
                                    ? isDark ? 'text-amber-200' : 'text-[#5C3831]'
                                    : isDark ? 'text-stone-400' : 'text-[#8C4320]/60'
                                }`}
                              >
                                {step.title}
                              </h4>
                              <p className={`text-[11px] leading-snug mt-0.5 ${
                                isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                              }`}>
                                {isReviewStep && !isOrderCompleted ? 'Setelah hidangan tiba' : step.subtitle}
                              </p>
                            </div>
                          </StepContainer>
                        )
                      })}
                    </div>

                    {/* Review Callout Box when Order is Completed */}
                    {order?.status === 'completed' && (
                      <div className={`mt-7 rounded-3xl border p-5 sm:p-7 shadow-xl ${
                        isDark
                          ? 'border-[#60241E] bg-gradient-to-br from-[#2D120F] via-[#3B1814] to-[#240E0C]'
                          : 'border-[#E6DACD] bg-gradient-to-br from-white via-[#FAF5EE] to-[#F5EDE4]'
                      }`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                          <div className="flex items-start gap-3.5 sm:gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#E77B49] text-[#1C0B09] shadow-md ring-2 ring-[#F59E0B]/30">
                              <Star size={24} className="fill-[#1C0B09]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider font-dhaksinarga ${
                                  isDark
                                    ? 'bg-[#1C0B09] border-[#60241E] text-amber-300'
                                    : 'bg-white border-[#E6DACD] text-[#8C4320]'
                                }`}>
                                  <Sparkles size={11} /> Ulasan Pawon Hara
                                </span>
                                <span className={`text-xs font-semibold ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
                                  • {order.order_code}
                                </span>
                              </div>
                              <h3 className={`text-base sm:text-lg font-dhaksinarga tracking-wide font-black mt-1 ${
                                isDark ? 'text-white' : 'text-[#2B120E]'
                              }`}>
                                Pesanan Telah Tiba! Bagaimana Rasa Hidangan Kami?
                              </h3>
                              <p className={`text-xs sm:text-sm mt-1 leading-relaxed max-w-xl ${
                                isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                              }`}>
                                Penilaian rasa paket bento box, racikan bumbu khas Nusantara, porsi, dan ketepatan waktu pengantaran Anda sangat berarti bagi seluruh tim dapur Pawon Hara.
                              </p>

                              {/* Quick 5-Star Select */}
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-[#2B120E]'}`}>Pilih Rating Cepat:</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((starVal) => (
                                    <Link
                                      key={starVal}
                                      to={`${testimonialBaseUrl}&rating=${starVal}`}
                                      className="group p-1 text-amber-400 hover:scale-125 transition-transform"
                                      title={`Beri ${starVal} Bintang`}
                                    >
                                      <Star size={22} className="fill-amber-400 text-amber-400 group-hover:drop-shadow-sm" />
                                    </Link>
                                  ))}
                                </div>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                  isDark
                                    ? 'text-amber-300 bg-[#1C0B09] border-[#60241E]'
                                    : 'text-[#8C4320] bg-white border-[#E6DACD]'
                                }`}>
                                  Klik bintang untuk mulai
                                </span>
                              </div>
                            </div>
                          </div>

                          <Link
                            to={`${testimonialBaseUrl}&rating=5`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] hover:brightness-110 text-[#1C0B09] font-dhaksinarga tracking-wide font-black text-xs sm:text-sm shadow-lg shadow-[#F59E0B]/20 transition active:scale-95 shrink-0 cursor-pointer"
                          >
                            <MessageSquareQuote size={17} />
                            <span>Tulis Ulasan & Testimoni</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-rose-800 bg-rose-950/60 p-4 sm:p-5 flex items-start gap-3.5 text-rose-200">
                    <XCircle size={24} className="shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold font-dhaksinarga tracking-wide">Pesanan Telah Dibatalkan</h4>
                      <p className="mt-1 text-xs text-rose-300 leading-relaxed">
                        Pesanan ini berstatus batal di sistem kami. Jika ada perubahan atau ingin melakukan pemesanan ulang untuk jadwal acara baru, silakan hubungi admin kami melalui WhatsApp di bawah.
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
                <div className={`rounded-3xl border p-6 shadow-xl space-y-5 ${
                  isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-white text-[#2B120E]'
                }`}>
                  <div className={`flex items-center gap-2.5 border-b pb-3.5 ${
                    isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                  }`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                      isDark ? 'bg-[#2D120F] text-amber-400 border-[#60241E]' : 'bg-[#FAF5EE] text-[#D97706] border-[#E6DACD]'
                    }`}>
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-dhaksinarga tracking-wide font-bold ${
                        isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}>Jadwal Acara & Pengantaran</h3>
                      <span className={`text-[11px] ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>Waktu pelaksanaan katering</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className={`text-[11px] font-semibold block ${
                        isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                      }`}>
                        Hari & Tanggal Acara
                      </span>
                      <span className={`font-bold text-sm mt-0.5 block ${
                        isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}>
                        {formatDateIndo(order.event_date)}
                      </span>
                    </div>

                    {order.event_time && (
                      <div>
                        <span className={`text-[11px] font-semibold block ${
                          isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                        }`}>
                          Waktu Santap / Jam Tiba
                        </span>
                        <div className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                          isDark
                            ? 'bg-[#2D120F] border-[#60241E] text-amber-200'
                            : 'bg-[#FAF5EE] border-[#E6DACD] text-[#2B120E]'
                        }`}>
                          <Clock4 size={13} className={isDark ? 'text-amber-400' : 'text-[#D97706]'} />
                          <span>Pukul {order.event_time} WIB</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className={`text-[11px] font-semibold block ${
                        isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                      }`}>
                        Alamat Pengiriman / Lokasi Acara
                      </span>
                      <div className={`mt-1 flex items-start gap-2.5 rounded-2xl p-3.5 border ${
                        isDark ? 'bg-[#1C0B09] border-[#60241E] text-stone-200' : 'bg-[#FAF5EE] border-[#E6DACD] text-[#2B120E]'
                      }`}>
                        <MapPin size={16} className="shrink-0 text-[#E77B49] mt-0.5" />
                        <span className="font-medium leading-relaxed">
                          {order.delivery_address}
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <div>
                        <span className={`text-[11px] font-semibold block ${
                          isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                        }`}>
                          Catatan Khusus Pemesan
                        </span>
                        <div className={`mt-1 rounded-2xl p-3.5 border text-xs leading-relaxed italic ${
                          isDark ? 'bg-[#1C0B09] border-[#60241E] text-amber-200/90' : 'bg-[#FAF5EE] border-[#E6DACD] text-[#5C3831]'
                        }`}>
                          "{order.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className={`rounded-3xl border p-6 shadow-xl space-y-4 ${
                  isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-white text-[#2B120E]'
                }`}>
                  <div className={`flex items-center gap-2.5 border-b pb-3.5 ${
                    isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                  }`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                      isDark ? 'bg-[#2D120F] text-amber-400 border-[#60241E]' : 'bg-[#FAF5EE] text-[#D97706] border-[#E6DACD]'
                    }`}>
                      <User size={16} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-dhaksinarga tracking-wide font-bold ${
                        isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}>Data Pemesan</h3>
                      <span className={`text-[11px] ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>Kontak penerima pesanan</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className={isDark ? 'text-amber-100/70' : 'text-[#5C3831]'}>Nama Pemesan</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>{order.customers_name}</span>
                    </div>
                    <div className={`flex justify-between items-center py-1 border-t ${
                      isDark ? 'border-[#60241E]/80' : 'border-[#E6DACD]'
                    }`}>
                      <span className={isDark ? 'text-amber-100/70' : 'text-[#5C3831]'}>Nomor WhatsApp</span>
                      <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-[#B45309]'}`}>{order.customers_phone}</span>
                    </div>
                    <div className={`flex justify-between items-center py-1 border-t ${
                      isDark ? 'border-[#60241E]/80' : 'border-[#E6DACD]'
                    }`}>
                      <span className={isDark ? 'text-amber-100/70' : 'text-[#5C3831]'}>Waktu Order Dibuat</span>
                      <span className={`font-semibold ${isDark ? 'text-stone-300' : 'text-[#6B423A]'}`}>
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
                <div className={`rounded-3xl border p-6 shadow-xl print:hidden ${
                  isDark
                    ? 'border-[#60241E] bg-gradient-to-br from-[#2D120F] to-[#1C0B09]'
                    : 'border-[#E6DACD] bg-gradient-to-br from-white to-[#FAF5EE]'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                      <MessageCircle size={22} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-dhaksinarga tracking-wide font-bold ${
                        isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}>
                        Butuh Bantuan atau Perubahan Menu?
                      </h4>
                      <p className={`mt-1 text-xs leading-relaxed ${
                        isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                      }`}>
                        Tim admin Pawon Hara siap membantu penyesuaian porsi, konfirmasi bukti pembayaran, atau jadwal pengiriman.
                      </p>
                      <a
                        href={waAskAdminUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95 cursor-pointer"
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
                <div className={`rounded-3xl border p-6 sm:p-7 shadow-xl ${
                  isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-white text-[#2B120E]'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-4 ${
                    isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                        isDark ? 'bg-[#2D120F] text-[#F59E0B] border-[#60241E]' : 'bg-[#FAF5EE] text-[#D97706] border-[#E6DACD]'
                      }`}>
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-dhaksinarga tracking-wide font-bold ${
                          isDark ? 'text-white' : 'text-[#2B120E]'
                        }`}>Rincian Paket Menu</h3>
                        <span className={`text-[11px] ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>
                          {order.items?.length || 0} Menu • {totalPortions} Porsi Total
                        </span>
                      </div>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      isDark
                        ? 'bg-[#2D120F] border-[#60241E] text-amber-300'
                        : 'bg-amber-100 border-amber-300 text-amber-900'
                    }`}>
                      {totalPortions} Box Katering
                    </span>
                  </div>

                  {/* Item Rows */}
                  <div className={`divide-y mt-2 ${isDark ? 'divide-[#60241E]/80' : 'divide-[#E6DACD]'}`}>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        const imageSrc = getItemImage(item.item_name)

                        return (
                          <div key={item.id || index} className="py-4.5 flex gap-3.5 sm:gap-4 items-start">
                            <img
                              src={imageSrc}
                              alt={item.item_name}
                              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border shrink-0 shadow-2xs ${
                                isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#FAF5EE]'
                              }`}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <h4 className={`text-xs sm:text-sm font-dhaksinarga tracking-wide font-bold ${
                                  isDark ? 'text-white' : 'text-[#2B120E]'
                                }`}>
                                  {item.item_name}
                                </h4>
                                <span className={`text-xs sm:text-sm font-black ${
                                  isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
                                }`}>
                                  {formatRupiah(item.subtotal)}
                                </span>
                              </div>

                              <div className={`mt-1 flex items-center gap-2 text-xs font-medium ${
                                isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                              }`}>
                                <span className={`rounded-md border px-2 py-0.5 font-bold ${
                                  isDark ? 'bg-[#2D120F] border-[#60241E] text-amber-300' : 'bg-[#FAF5EE] border-[#E6DACD] text-[#8C4320]'
                                }`}>
                                  {item.quantity} Porsi
                                </span>
                                <span>@ {formatRupiah(item.price)}</span>
                              </div>

                              {/* Item Addons */}
                              {item.addons && item.addons.length > 0 && (
                                <div className={`mt-2.5 rounded-xl p-2.5 border space-y-1 ${
                                  isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-[#FAF5EE] border-[#E6DACD]'
                                }`}>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                                    isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                                  }`}>
                                    Pilihan Variasi / Add-on:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.addons.map((a, aIdx) => (
                                      <span
                                        key={a.id || aIdx}
                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold border ${
                                          isDark
                                            ? 'bg-[#2D120F] text-amber-100 border-[#60241E]'
                                            : 'bg-white text-[#5C3831] border-[#E6DACD]'
                                        }`}
                                      >
                                        <span className={isDark ? 'text-amber-400' : 'text-[#D97706]'}>•</span>
                                        <span>
                                          {a.addon_group_name ? `${a.addon_group_name}: ` : ''}
                                          {a.addon_name}
                                        </span>
                                        {Number(a.price) > 0 && (
                                          <span className={`font-bold ${isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'}`}>
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
                      <div className={`py-8 text-center text-xs ${isDark ? 'text-stone-400' : 'text-[#6B423A]'}`}>
                        Tidak ada item pesanan yang tercatat.
                      </div>
                    )}
                  </div>

                  {/* Payment Breakdown */}
                  <div className={`mt-6 border-t pt-5 space-y-2.5 text-xs sm:text-sm ${
                    isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                  }`}>
                    <div className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'}`}>
                      <span>Subtotal Menu</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>{formatRupiah(order.subtotal)}</span>
                    </div>

                    <div className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'}`}>
                      <span>Estimasi Ongkos Kirim</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                        {Number(order.delivery_fee) > 0 ? formatRupiah(order.delivery_fee) : 'Gratis'}
                      </span>
                    </div>

                    <div className={`flex justify-between items-center border-t pt-3 text-base sm:text-lg font-black ${
                      isDark ? 'border-[#60241E] text-white' : 'border-[#E6DACD] text-[#2B120E]'
                    }`}>
                      <span className="font-dhaksinarga tracking-wide">Total Pembayaran</span>
                      <span className="font-dhaksinarga tracking-wide text-[#F59E0B] text-xl sm:text-2xl font-black">
                        {formatRupiah(order.total)}
                      </span>
                    </div>

                    {/* Payment Status & Breakdown Card */}
                    <div className={`mt-4 pt-3 border-t border-dashed ${isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'}`}>
                      {order.payment_status === 'paid' ? (
                        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-800 p-4 flex items-start gap-3.5 shadow-2xs">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 font-dhaksinarga">
                                Pembayaran Lunas
                              </span>
                              <span className="text-xs font-mono font-black text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700">
                                {formatRupiah(order.paid_amount || order.total)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-emerald-200/90 leading-relaxed">
                              Pembayaran katering Anda telah terverifikasi lunas
                              {order.payment_method ? ` melalui ${order.payment_method}` : ''}.
                              Pesanan siap diproduksi dan dikirim sesuai jadwal!
                            </p>
                          </div>
                        </div>
                      ) : order.payment_status === 'dp' ? (
                        <div className={`rounded-2xl border p-4 space-y-3 shadow-2xs ${
                          isDark ? 'bg-[#2D120F] border-[#F59E0B]/50' : 'bg-amber-50 border-amber-300'
                        }`}>
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-[#1C0B09] font-bold shadow-xs">
                              <Coins size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className={`text-xs font-black uppercase tracking-wider font-dhaksinarga ${
                                  isDark ? 'text-amber-300' : 'text-amber-900'
                                }`}>
                                  DP / Uang Muka Masuk
                                </span>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                                  isDark ? 'bg-[#1C0B09] border-[#60241E] text-amber-300' : 'bg-white border-amber-200 text-amber-900'
                                }`}>
                                  {formatRupiah(order.paid_amount || 0)}
                                </span>
                              </div>
                              <p className={`mt-1 text-xs ${isDark ? 'text-amber-100/80' : 'text-amber-800'}`}>
                                DP telah tercatat di sistem kami
                                {order.payment_method ? ` via ${order.payment_method}` : ''}.
                              </p>
                            </div>
                          </div>

                          <div className={`rounded-xl border p-3 flex justify-between items-center text-xs ${
                            isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-white border-amber-200'
                          }`}>
                            <span className={`font-bold ${isDark ? 'text-amber-100' : 'text-[#2B120E]'}`}>Sisa Tagihan Pelunasan:</span>
                            <span className="font-mono font-black text-sm text-[#F59E0B]">
                              {formatRupiah(Math.max(0, Number(order.total) - Number(order.paid_amount || 0)))}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-snug ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>
                            * Sisa pembayaran dapat dilunasi saat serah terima pesanan atau sesuai kesepakatan dengan admin.
                          </p>
                        </div>
                      ) : (
                        <div className={`rounded-2xl border p-4 flex items-start gap-3.5 shadow-2xs ${
                          isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-[#FAF5EE] border-[#E6DACD]'
                        }`}>
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            isDark ? 'bg-[#2D120F] text-amber-400 border-[#60241E]' : 'bg-white text-[#D97706] border-[#E6DACD]'
                          }`}>
                            <Clock4 size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className={`text-xs font-bold uppercase tracking-wider font-dhaksinarga ${
                                isDark ? 'text-amber-300' : 'text-[#2B120E]'
                              }`}>
                                Status Pembayaran
                              </span>
                              <span className={`text-[11px] font-bold rounded-md px-2 py-0.5 border ${
                                isDark ? 'text-amber-300 bg-[#2D120F] border-[#60241E]' : 'text-amber-900 bg-amber-100 border-amber-300'
                              }`}>
                                Menunggu Konfirmasi / DP
                              </span>
                            </div>
                            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-amber-100/70' : 'text-[#5C3831]'}`}>
                              Sistem belum mencatat pelunasan atau DP untuk pesanan ini. Silakan kirimkan bukti transfer ke WhatsApp admin agar pesanan Anda dapat segera masuk antrean dapur.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quality & Hygiene Guarantee */}
                  <div className={`mt-6 rounded-2xl p-4 border flex items-center gap-3 text-xs ${
                    isDark ? 'bg-[#1C0B09] border-[#60241E] text-amber-100/80' : 'bg-[#FAF5EE] border-[#E6DACD] text-[#5C3831]'
                  }`}>
                    <BadgeCheck size={20} className="text-emerald-500 shrink-0" />
                    <span>
                      Seluruh hidangan diproduksi segar di hari pengantaran, terjamin halal, dan dikemas rapi sesuai standar mutu katering Pawon Hara.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : hasSearched && !loading ? (
          /* Empty State when order not found */
          <div className={`rounded-3xl border border-dashed p-12 text-center max-w-lg mx-auto shadow-xl ${
            isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-white text-[#2B120E]'
          }`}>
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
              isDark ? 'bg-[#2D120F] text-red-400 border-[#60241E]' : 'bg-red-50 text-red-500 border-red-200'
            }`}>
              <AlertCircle size={32} />
            </div>
            <h3 className={`mt-4 text-lg font-dhaksinarga tracking-wide font-bold ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}>Pesanan Tidak Ditemukan</h3>
            <p className={`mt-1.5 text-xs leading-relaxed ${
              isDark ? 'text-amber-100/70' : 'text-[#5C3831]'
            }`}>
              Mohon periksa kembali kode pesanan Anda seperti yang tertera pada invoice WhatsApp (contoh format: <span className="font-mono font-bold text-[#D97706]">PH-YYYYMMDD-XXXXXX</span>).
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/menu"
                className="rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] px-5 py-2.5 text-xs font-dhaksinarga tracking-wide font-black text-[#1C0B09] hover:brightness-110 transition shadow-xs"
              >
                Jelajahi Menu Katering
              </Link>
            </div>
          </div>
        ) : (
          /* Initial Guide */
          <div className={`rounded-3xl border p-8 sm:p-10 shadow-xl text-center max-w-xl mx-auto ${
            isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-white text-[#2B120E]'
          }`}>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${
              isDark ? 'bg-[#2D120F] text-amber-400 border-[#60241E]' : 'bg-[#FAF5EE] text-[#D97706] border-[#E6DACD]'
            }`}>
              <FileText size={28} />
            </div>
            <h3 className={`mt-4 text-base sm:text-lg font-dhaksinarga tracking-wide font-bold ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}>
              Cara Menemukan Kode Pesanan Anda
            </h3>
            <p className={`mt-2 text-xs leading-relaxed ${
              isDark ? 'text-amber-100/70' : 'text-[#5C3831]'
            }`}>
              Kode pesanan unik diterbitkan otomatis saat Anda menyelesaikan pesanan di keranjang belanja, serta tercantum pada pesan WhatsApp admin katering Pawon Hara. Masukkan kode di kolom pencarian di atas untuk melihat live tracking statusnya.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
