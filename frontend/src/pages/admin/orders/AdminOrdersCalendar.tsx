import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Boxes,
  ShoppingBag,
  X,
  MapPin,
  Ban,
  FileSpreadsheet,
  Utensils,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  UserCheck,
  Wallet,
  ExternalLink,
  Lock,
  RefreshCw,
  Flame,
  Check,
  ChefHat,
} from 'lucide-react'

import { ordersService } from '../../../services/orders.service'
import type { CalendarDayData, Order, CalendarItemBreakdown } from '../../../types/orders'
import { useThemeStore } from '../../../stores/theme.store'
import PageLoader from '../../../components/ui/PageLoader'

const DAYS_HEADER_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const DAYS_HEADER_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function formatRupiah(amount: number | string): string {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`
}

export default function AdminOrdersCalendar() {
  const navigate = useNavigate()
  const isDark = useThemeStore((state) => state.theme === 'dark')

  // Current year & month state
  const today = useMemo(() => new Date(), [])
  const todayDateStr = useMemo(() => {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [today])

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1) // 1-12

  // Selected date modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'orders' | 'items'>('orders')

  const monthParam = useMemo(() => {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  }, [currentYear, currentMonth])

  // Fetch calendar orders data
  const { data: calendarData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-orders-calendar', monthParam],
    queryFn: () => ordersService.getCalendar(monthParam),
  })

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleCurrentMonth = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth() + 1)
  }

  // Calculate calendar grid days
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    // Day of week: JS Sunday = 0, Monday = 1. We want Monday = 0
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7

    const cells: {
      type: 'empty' | 'day'
      dayNumber?: number
      dateStr?: string
    }[] = []

    // Leading empty cells
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({ type: 'empty' })
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        type: 'day',
        dayNumber: d,
        dateStr,
      })
    }

    // Trailing empty cells to complete week row (multiple of 7)
    const remainder = cells.length % 7
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ type: 'empty' })
      }
    }

    return cells
  }, [currentYear, currentMonth])

  const selectedDayData: CalendarDayData | null = useMemo(() => {
    if (!selectedDate || !calendarData?.days) return null
    return calendarData.days[selectedDate] ?? null
  }, [selectedDate, calendarData])

  // Formatted date string for modal header
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return ''
    const parts = selectedDate.split('-')
    if (parts.length !== 3) return selectedDate
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    const dayName = DAYS_HEADER_FULL[(d.getDay() + 6) % 7]
    const monthName = MONTH_NAMES_ID[d.getMonth()]
    return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`
  }, [selectedDate])

  const monthlySummary = calendarData?.monthly_summary

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Kalender Pesanan..."
        subtext="Memuat jadwal pengiriman dan rekap menu per tanggal"
        minDuration={350}
      />

      <div className={`min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 ${
        isDark ? 'text-stone-100' : 'text-stone-900'
      }`}>
        {/* =====================================================
            TOP HEADER & ACTION BUTTONS
        ====================================================== */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider border ${
                isDark
                  ? 'bg-red-950/60 text-red-400 border-red-900/50'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <CalendarClock size={13} className="shrink-0" />
                <span>Jadwal & Tracking Pengiriman</span>
              </div>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}>
              Kalender Pesanan Katering
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl font-medium ${
              isDark ? 'text-amber-100/70' : 'text-stone-600'
            }`}>
              Pantau jadwal pesanan siap kirim tiap tanggal, pantau akumulasi porsi box dapur, serta cek detail rekap menu terjual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-98 disabled:opacity-50 ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-stone-200 hover:bg-[#25100D] hover:text-white'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400'
              }`}
              title="Perbarui data kalender"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-98 ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-stone-200 hover:bg-[#25100D] hover:text-white'
                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400'
              }`}
            >
              <Package size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
              <span>Daftar Pesanan</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/orders/recap')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-98 ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-stone-200 hover:bg-[#25100D] hover:text-white'
                  : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400'
              }`}
            >
              <FileSpreadsheet size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
              <span>Rekap Pesanan</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            MONTHLY SUMMARY CARDS (HIGH CONTRAST & PREMIUM)
        ====================================================== */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Total Orders */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
              isDark
                ? 'bg-[#220E0B] border-[#5E221C]'
                : 'bg-white border-stone-300 hover:border-stone-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-stone-400' : 'text-stone-600'
              }`}>
                Pesanan Bulan Ini
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              }`}>
                <CalendarCheck size={18} />
              </div>
            </div>
            <p className={`mt-2.5 text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}>
              {monthlySummary?.total_orders ?? 0}
            </p>
            <p className={`mt-1.5 text-xs font-semibold ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>
                {monthlySummary?.active_orders ?? 0}
              </strong>{' '}
              aktif / terkonfirmasi
            </p>
          </div>

          {/* Card 2: Total Portions / Boxes */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
              isDark
                ? 'bg-[#220E0B] border-[#5E221C]'
                : 'bg-white border-stone-300 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}>
                Total Box / Porsi
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}>
                <Boxes size={18} />
              </div>
            </div>
            <p className={`mt-2.5 text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              isDark ? 'text-amber-400' : 'text-amber-600'
            }`}>
              {monthlySummary?.total_portions ?? 0}{' '}
              <span className="text-sm font-extrabold uppercase tracking-normal">Box</span>
            </p>
            <p className={`mt-1.5 text-xs font-semibold ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Akumulasi katering diproduksi
            </p>
          </div>

          {/* Card 3: Revenue Estimate */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
              isDark
                ? 'bg-[#220E0B] border-[#5E221C]'
                : 'bg-white border-stone-300 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                Estimasi Omzet
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              }`}>
                <Wallet size={18} />
              </div>
            </div>
            <p className={`mt-2.5 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight truncate ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              {formatRupiah(monthlySummary?.total_revenue ?? 0)}
            </p>
            <p className={`mt-1.5 text-xs font-semibold ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Dari pesanan aktif bulan ini
            </p>
          </div>

          {/* Card 4: Top Menu Item */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
              isDark
                ? 'bg-[#220E0B] border-[#5E221C]'
                : 'bg-white border-stone-300 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-purple-400' : 'text-purple-800'
              }`}>
                Menu Terfavorit
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
              }`}>
                <Flame size={18} />
              </div>
            </div>
            <p
              className={`mt-2.5 text-sm sm:text-base font-extrabold truncate ${
                isDark ? 'text-white' : 'text-stone-950'
              }`}
              title={monthlySummary?.top_sold_items?.[0]?.name}
            >
              {monthlySummary?.top_sold_items?.[0]?.name ?? 'Belum ada data'}
            </p>
            <p className={`mt-1.5 text-xs font-semibold ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {monthlySummary?.top_sold_items?.[0] ? (
                <span className={`inline-flex items-center gap-1 font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  <Flame size={12} className="shrink-0 text-amber-500" />
                  <span>{monthlySummary.top_sold_items[0].quantity} box terjual</span>
                </span>
              ) : (
                'Menunggu pesanan masuk'
              )}
            </p>
          </div>
        </div>

        {/* =====================================================
            CALENDAR MAIN CARD & MONTH NAVIGATION
        ====================================================== */}
        <div
          className={`rounded-3xl border shadow-sm overflow-hidden ${
            isDark ? 'bg-[#180A08] border-[#5E221C]' : 'bg-white border-stone-300'
          }`}
        >
          {/* Month Bar Header */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3.5 p-4 sm:p-5 border-b ${
              isDark ? 'border-[#5E221C] bg-[#220E0B]' : 'border-stone-300 bg-stone-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
              }`}>
                <Calendar size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-stone-950'
                  }`}>
                    {MONTH_NAMES_ID[currentMonth - 1]} {currentYear}
                  </h2>
                  {isFetching && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  )}
                </div>
                <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Klik kotak tanggal untuk membuka rincian pesanan & rekap menu
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={`p-2 rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
                  isDark
                    ? 'border-[#5E221C] bg-[#180A08] text-stone-200 hover:bg-[#25100D]'
                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400'
                }`}
                title="Bulan sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 ${
                  isDark
                    ? 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <CalendarDays size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                <span>Bulan Ini</span>
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className={`p-2 rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
                  isDark
                    ? 'border-[#5E221C] bg-[#180A08] text-stone-200 hover:bg-[#25100D]'
                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400'
                }`}
                title="Bulan berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Legend Banner (Crisp & Informative) */}
          <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold ${
            isDark ? 'border-[#5E221C]/60 bg-[#1c0a08] text-stone-300' : 'border-stone-200 bg-white text-stone-700'
          }`}>
            <span className="text-stone-500 font-extrabold uppercase tracking-wider text-[10px]">
              Petunjuk Status:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} className="text-amber-500 shrink-0" />
                <span>Menunggu</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={12} className="text-blue-500 shrink-0 stroke-[3]" />
                <span>Dikonfirmasi</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ChefHat size={12} className="text-purple-500 shrink-0" />
                <span>Diproses Dapur</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span>Selesai</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Ban size={12} className="text-rose-500 shrink-0" />
                <span>Libur Dapur</span>
              </span>
            </div>
          </div>

          {/* Calendar Days of Week Header */}
          <div className={`grid grid-cols-7 border-b text-center text-xs font-black py-2.5 ${
            isDark ? 'border-[#5E221C] bg-[#220E0B]' : 'border-stone-300 bg-stone-100'
          }`}>
            {DAYS_HEADER_FULL.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-1 text-[11px] sm:text-xs uppercase tracking-wider ${
                  idx >= 5
                    ? isDark ? 'text-rose-400 font-black' : 'text-rose-600 font-black'
                    : isDark ? 'text-stone-300' : 'text-stone-800'
                }`}
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{DAYS_HEADER_ID[idx]}</span>
              </div>
            ))}
          </div>

          {/* =====================================================
              CALENDAR GRID CELLS (TEGAS, CRISP, & KOTAK-KOTAK)
          ====================================================== */}
          <div className={`grid grid-cols-7 border-t border-l ${
            isDark ? 'border-[#5E221C]/80' : 'border-stone-300'
          }`}>
            {calendarGrid.map((cell, idx) => {
              // Empty Cell (Inactive / Outside Month)
              if (cell.type === 'empty') {
                return (
                  <div
                    key={`empty-${idx}`}
                    className={`min-h-[95px] sm:min-h-[135px] p-2 border-r border-b ${
                      isDark
                        ? 'border-[#5E221C]/80 bg-[#120504]/80'
                        : 'border-stone-300 bg-stone-100/60'
                    }`}
                  />
                )
              }

              const dateStr = cell.dateStr!
              const dayData = calendarData?.days?.[dateStr]
              const isToday = dateStr === todayDateStr
              const isClosed = dayData?.is_closed
              const hasOrders = (dayData?.order_count ?? 0) > 0

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`group relative min-h-[95px] sm:min-h-[135px] p-2 sm:p-2.5 border-r border-b transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isDark ? 'border-[#5E221C]/80' : 'border-stone-300'
                  } ${
                    isToday
                      ? isDark
                        ? 'bg-gradient-to-b from-amber-950/40 to-[#180A08] ring-2 ring-inset ring-amber-500'
                        : 'bg-amber-50/90 ring-2 ring-inset ring-amber-500 shadow-xs'
                      : hasOrders
                        ? isDark
                          ? 'bg-gradient-to-b from-[#26100D] to-[#180A08] hover:from-[#2F1410] hover:to-[#220E0B]'
                          : 'bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 hover:from-amber-100/70 hover:to-amber-50/70'
                        : isClosed
                          ? isDark
                            ? 'bg-rose-950/20 hover:bg-rose-950/30'
                            : 'bg-rose-50/50 hover:bg-rose-100/60'
                          : isDark
                            ? 'bg-[#180A08] hover:bg-[#25100D]'
                            : 'bg-white hover:bg-amber-50/40'
                  }`}
                >
                  {/* Top Bar: Date Number + Order Badge / Libur Badge */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-xs sm:text-sm font-black transition ${
                          isToday
                            ? 'bg-red-600 text-white shadow-xs'
                            : isDark
                              ? 'text-stone-200 group-hover:text-amber-400'
                              : 'text-stone-900 group-hover:text-amber-700'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {isToday && (
                        <span className={`hidden sm:inline-block text-[10px] font-extrabold ${
                          isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          Hari Ini
                        </span>
                      )}
                    </div>

                    {isClosed ? (
                      <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold border ${
                        isDark
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-rose-100 text-rose-700 border-rose-300'
                      }`}>
                        <Ban size={9} />
                        <span>Libur</span>
                      </span>
                    ) : hasOrders && dayData ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-black shadow-2xs border ${
                        isDark
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-amber-100 text-amber-950 border-amber-300'
                      }`}>
                        <ShoppingBag size={10} className={isDark ? 'text-amber-400 shrink-0' : 'text-amber-700 shrink-0'} />
                        <span>{dayData.order_count}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Middle Content: Total Portion Boxes & Status Badges */}
                  <div className="my-1.5 space-y-1.5">
                    {hasOrders && dayData ? (
                      <>
                        {/* Portion Counter Badge */}
                        <div
                          className={`rounded-lg px-2 py-1 text-[11px] sm:text-xs font-black flex items-center justify-between shadow-2xs ${
                            isDark
                              ? 'bg-[#2E120E] border border-amber-500/30 text-amber-200'
                              : 'bg-amber-100/90 border border-amber-300 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <Boxes size={12} className={isDark ? 'shrink-0 text-amber-400' : 'shrink-0 text-amber-700'} />
                            <span className="truncate">{dayData.total_portions} Box</span>
                          </div>
                        </div>

                        {/* Order status visual badges */}
                        <div className="flex flex-wrap items-center gap-1">
                          {dayData.status_counts.pending > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                isDark
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                              title={`${dayData.status_counts.pending} Pesanan Menunggu`}
                            >
                              <Clock size={9} className="shrink-0" />
                              <span>{dayData.status_counts.pending}</span>
                            </span>
                          )}
                          {dayData.status_counts.confirmed > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                isDark
                                  ? 'bg-blue-950/80 text-blue-300 border-blue-700/60'
                                  : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}
                              title={`${dayData.status_counts.confirmed} Pesanan Terkonfirmasi`}
                            >
                              <Check size={9} className="shrink-0 stroke-[3]" />
                              <span>{dayData.status_counts.confirmed}</span>
                            </span>
                          )}
                          {dayData.status_counts.processing > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                isDark
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                                  : 'bg-purple-100 text-purple-900 border-purple-300'
                              }`}
                              title={`${dayData.status_counts.processing} Pesanan Diproses Dapur`}
                            >
                              <ChefHat size={9} className="shrink-0" />
                              <span>{dayData.status_counts.processing}</span>
                            </span>
                          )}
                          {dayData.status_counts.completed > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                isDark
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}
                              title={`${dayData.status_counts.completed} Pesanan Selesai`}
                            >
                              <CheckCircle2 size={9} className="shrink-0" />
                              <span>{dayData.status_counts.completed}</span>
                            </span>
                          )}
                        </div>

                        {/* Top item preview for desktop */}
                        {dayData.items_breakdown?.[0] && (
                          <div className={`hidden sm:flex items-center gap-1 text-[10px] truncate font-medium ${
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          }`}>
                            <Utensils size={10} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                            <span className="truncate">{dayData.items_breakdown[0].name}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="hidden sm:block text-[11px] text-stone-400/40 text-center py-2 font-medium">
                        Kosong
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Revenue & Detail CTA Hint */}
                  {hasOrders && dayData ? (
                    <div className="pt-1 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black rounded-md px-1.5 py-0.5 truncate shadow-2xs border ${
                        isDark
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        <Wallet size={10} className={`shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span className="truncate">{formatRupiah(dayData.total_revenue)}</span>
                      </span>

                      <span className={`hidden sm:inline-block text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}>
                        Detail →
                      </span>
                    </div>
                  ) : (
                    <div className="h-3" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* =====================================================
            DATE DETAIL MODAL (HIGH CONTRAST & RICH DETAILS)
        ====================================================== */}
        {selectedDate && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDate(null)
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              className={`relative w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                isDark
                  ? 'bg-[#180A08] border-[#5E221C] text-stone-100 shadow-black/80'
                  : 'bg-white border-stone-300 text-stone-900 shadow-stone-900/20'
              }`}
            >
              {/* Modal Header */}
              <div
                className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
                  isDark
                    ? 'border-[#5E221C] bg-[#220E0B]'
                    : 'border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                    isDark
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                  }`}>
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-xl font-black ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}>
                      {formattedSelectedDate}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      {selectedDayData?.is_closed && (
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black border ${
                          isDark
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          <Lock size={10} /> Dapur Libur / Tutup
                        </span>
                      )}
                      <span className={`font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        <strong>{selectedDayData?.order_count ?? 0} Pesanan</strong> •{' '}
                        <strong className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                          {selectedDayData?.total_portions ?? 0} Box
                        </strong>{' '}
                        •{' '}
                        <strong className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {formatRupiah(selectedDayData?.total_revenue ?? 0)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className={`rounded-full p-2 transition cursor-pointer ${
                    isDark
                      ? 'text-stone-400 hover:text-white hover:bg-white/10'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200'
                  }`}
                  title="Tutup dialog"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Segmented Pill Tabs Navigation */}
              <div className={`p-3 sm:px-5 border-b shrink-0 ${
                isDark ? 'border-[#5E221C]/60 bg-[#1e0c0a]' : 'border-stone-200 bg-stone-100/60'
              }`}>
                <div className={`p-1 rounded-2xl flex gap-1 border ${
                  isDark
                    ? 'bg-[#180A08] border-[#5E221C]'
                    : 'bg-stone-200/70 border-stone-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('orders')}
                    className={`flex-1 py-2 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                      activeModalTab === 'orders'
                        ? isDark
                          ? 'bg-[#381612] text-amber-300 shadow-xs border border-amber-500/30'
                          : 'bg-white text-stone-950 shadow-xs border border-stone-300'
                        : isDark
                          ? 'text-stone-400 hover:text-stone-200'
                          : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <Package size={15} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>Daftar Pesanan ({selectedDayData?.order_count ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab('items')}
                    className={`flex-1 py-2 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                      activeModalTab === 'items'
                        ? isDark
                          ? 'bg-[#381612] text-amber-300 shadow-xs border border-amber-500/30'
                          : 'bg-white text-stone-950 shadow-xs border border-stone-300'
                        : isDark
                          ? 'text-stone-400 hover:text-stone-200'
                          : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <UtensilsCrossed size={15} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>Rekap Menu Terjual ({selectedDayData?.items_breakdown?.length ?? 0})</span>
                  </button>
                </div>
              </div>

              {/* Modal Body / Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {!selectedDayData || selectedDayData.order_count === 0 ? (
                  <div className="py-14 text-center space-y-3">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${
                      isDark
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      <CalendarX size={28} />
                    </div>
                    <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-stone-950'}`}>
                      Tidak Ada Pesanan Terjadwal
                    </h4>
                    <p className={`text-xs max-w-sm mx-auto font-medium ${
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      Belum ada pesanan katering yang dijadwalkan untuk dikirim pada tanggal ini.
                    </p>
                  </div>
                ) : activeModalTab === 'orders' ? (
                  /* =====================================================
                     TAB 1: DAFTAR PESANAN LENGKAP
                  ====================================================== */
                  <div className="space-y-3.5">
                    {selectedDayData.orders.map((order: Order) => {
                      const waLink = order.customers_phone
                        ? `https://wa.me/${order.customers_phone.replace(/^0/, '62').replace(/\D/g, '')}`
                        : null

                      return (
                        <div
                          key={order.id}
                          className={`rounded-2xl border p-4 sm:p-4.5 transition-all space-y-3.5 shadow-xs ${
                            isDark
                              ? 'bg-[#220E0B] border-[#5E221C] hover:border-amber-500/40'
                              : 'bg-white border-stone-300 hover:border-amber-400'
                          }`}
                        >
                          {/* Order Top: Time, Code, Status Badges */}
                          <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${
                            isDark ? 'border-[#5E221C]' : 'border-stone-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black border ${
                                isDark
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-amber-100 text-amber-950 border-amber-300'
                              }`}>
                                <Clock size={12} className={isDark ? 'text-amber-400' : 'text-amber-700'} />
                                {order.event_time ? `${order.event_time} WIB` : 'Jam Belum Ditentukan'}
                              </span>

                              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-md border ${
                                isDark
                                  ? 'bg-[#180A08] border-[#5E221C] text-stone-200'
                                  : 'bg-stone-100 border-stone-300 text-stone-900'
                              }`}>
                                #{order.order_code}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-black">
                              {/* Order Status Badge */}
                              <span className={`rounded-full px-2.5 py-0.5 border ${
                                order.status === 'completed'
                                  ? isDark
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : order.status === 'processing'
                                    ? isDark
                                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                      : 'bg-blue-100 text-blue-900 border-blue-300'
                                    : order.status === 'confirmed'
                                      ? isDark
                                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                                        : 'bg-sky-100 text-sky-900 border-sky-300'
                                      : order.status === 'cancelled'
                                        ? isDark
                                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                          : 'bg-rose-100 text-rose-900 border-rose-300'
                                        : isDark
                                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                          : 'bg-amber-100 text-amber-950 border-amber-300'
                              }`}>
                                {order.status === 'completed' ? 'SELESAI' :
                                 order.status === 'processing' ? 'DIPROSES DAPUR' :
                                 order.status === 'confirmed' ? 'TERKONFIRMASI' :
                                 order.status === 'cancelled' ? 'DIBATALKAN' : 'MENUNGGU KONFIRMASI'}
                              </span>

                              {/* Payment Status Badge */}
                              <span className={`rounded-full px-2 py-0.5 border ${
                                order.payment_status === 'paid'
                                  ? isDark
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : isDark
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-amber-100 text-amber-950 border-amber-300'
                              }`}>
                                {order.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                              </span>
                            </div>
                          </div>

                          {/* Customer Info & WhatsApp Direct */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <UserCheck size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                                <span className={`font-black text-sm ${
                                  isDark ? 'text-white' : 'text-stone-950'
                                }`}>
                                  {order.customers_name}
                                </span>
                              </div>

                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-2.5 py-1 shadow-2xs transition"
                                  title="Buka WhatsApp Pelanggan"
                                >
                                  <MessageCircle size={12} />
                                  <span>{order.customers_phone}</span>
                                </a>
                              )}
                            </div>

                            {order.delivery_address && (
                              <p className={`flex items-start gap-1.5 text-xs font-medium ${
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              }`}>
                                <MapPin size={13} className="shrink-0 mt-0.5 text-red-500" />
                                <span>{order.delivery_address}</span>
                              </p>
                            )}
                          </div>

                          {/* Ordered Items List */}
                          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isDark
                              ? 'bg-[#180A08] border-[#5E221C]'
                              : 'bg-stone-50 border-stone-300'
                          }`}>
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                              Item Katering yang Dipesan:
                            </p>
                            {order.items?.map((it, i) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <span className={`font-semibold ${
                                  isDark ? 'text-stone-200' : 'text-stone-800'
                                }`}>
                                  <span className={`inline-block px-1.5 py-0.5 rounded font-black text-[11px] mr-1.5 ${
                                    isDark
                                      ? 'bg-amber-900/40 text-amber-300'
                                      : 'bg-amber-200/60 text-amber-950'
                                  }`}>
                                    {it.quantity}x
                                  </span>
                                  {it.item_name || it.product?.name}
                                </span>
                                <span className={`font-extrabold font-mono ${
                                  isDark ? 'text-amber-200' : 'text-stone-950'
                                }`}>
                                  {formatRupiah(it.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Special Instructions Note (if any) */}
                          {order.notes && (
                            <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                              isDark
                                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                                : 'bg-amber-50 border-amber-200 text-amber-900'
                            }`}>
                              <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                              <p className="font-medium">
                                <strong className="font-bold">Catatan:</strong> {order.notes}
                              </p>
                            </div>
                          )}

                          {/* Order Bottom / Total Payment & Link */}
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className={`font-semibold ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                              Total Tagihan:
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`font-black font-mono text-base ${
                                isDark ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                {formatRupiah(order.total)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDate(null)
                                  navigate(`/admin/orders?search=${order.order_code}`)
                                }}
                                className={`inline-flex items-center gap-1 text-[11px] font-extrabold rounded-lg px-2.5 py-1 border transition cursor-pointer ${
                                  isDark
                                    ? 'border-[#5E221C] bg-[#180A08] text-amber-400 hover:bg-[#25100D]'
                                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-amber-400'
                                }`}
                              >
                                <span>Lihat di Order</span>
                                <ExternalLink size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* =====================================================
                     TAB 2: REKAP MENU TERJUAL ("TERJUAL APA AJA")
                  ====================================================== */
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        Rincian varian menu & total porsi katering yang harus dimasak dapur pada tanggal ini:
                      </p>
                    </div>

                    <div className={`rounded-2xl border overflow-hidden shadow-xs ${
                      isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-300'
                    }`}>
                      <table className="w-full text-left text-xs">
                        <thead className={`border-b ${
                          isDark ? 'border-[#5E221C] bg-[#180A08]' : 'border-stone-300 bg-stone-100'
                        }`}>
                          <tr>
                            <th className={`px-4 py-3 font-black uppercase text-[10px] ${
                              isDark ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              Menu Katering
                            </th>
                            <th className={`px-4 py-3 font-black uppercase text-[10px] text-center ${
                              isDark ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              Jumlah Terjual
                            </th>
                            <th className={`px-4 py-3 font-black uppercase text-[10px] text-right ${
                              isDark ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              Total Nilai
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          isDark ? 'divide-[#5E221C]/60' : 'divide-stone-200'
                        }`}>
                          {selectedDayData.items_breakdown?.map((item: CalendarItemBreakdown, idx: number) => (
                            <tr
                              key={idx}
                              className={`transition ${
                                isDark ? 'hover:bg-[#28110D]' : 'hover:bg-amber-50/50'
                              }`}
                            >
                              <td className="px-4 py-3.5 font-medium">
                                <div className="flex items-center gap-2.5">
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black ${
                                    idx === 0
                                      ? 'bg-amber-500 text-white shadow-2xs'
                                      : isDark
                                        ? 'bg-[#381612] text-amber-300'
                                        : 'bg-stone-200 text-stone-800'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <UtensilsCrossed size={13} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                    <span className={`font-bold ${isDark ? 'text-stone-100' : 'text-stone-950'}`}>
                                      {item.name}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black border ${
                                  isDark
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-amber-100 text-amber-950 border-amber-300'
                                }`}>
                                  <Boxes size={11} className={isDark ? 'text-amber-400' : 'text-amber-700'} />
                                  <span>{item.quantity} Box</span>
                                </span>
                              </td>
                              <td className={`px-4 py-3.5 text-right font-black font-mono whitespace-nowrap ${
                                isDark ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                {formatRupiah(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className={`border-t font-black ${
                          isDark ? 'border-[#5E221C] bg-[#180A08]' : 'border-stone-300 bg-stone-100'
                        }`}>
                          <tr>
                            <td className={`px-4 py-3.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                              Total Porsi & Omzet Hari Ini
                            </td>
                            <td className={`px-4 py-3.5 text-center text-sm ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}>
                              {selectedDayData.total_portions} Box
                            </td>
                            <td className={`px-4 py-3.5 text-right text-sm font-mono ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}>
                              {formatRupiah(selectedDayData.total_revenue)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                className={`p-3.5 sm:p-4 border-t flex items-center justify-between shrink-0 ${
                  isDark
                    ? 'border-[#5E221C] bg-[#220E0B]'
                    : 'border-stone-300 bg-stone-50'
                }`}
              >
                <div className={`flex items-center gap-1.5 text-xs font-bold ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <CheckCircle2 size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                  <span>{selectedDayData?.order_count ?? 0} transaksi terjadwal</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer shadow-xs active:scale-95 ${
                    isDark
                      ? 'bg-stone-800 text-stone-100 hover:bg-stone-700'
                      : 'bg-stone-200 text-stone-900 hover:bg-stone-300'
                  }`}
                >
                  Tutup Kalender
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
