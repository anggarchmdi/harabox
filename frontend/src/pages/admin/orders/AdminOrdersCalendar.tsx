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
import { getWhatsAppInvoiceUrl } from '../../../utils/whatsappInvoice'

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
        <div className="flex flex-col justify-between gap-3.5 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 dark:text-amber-400/90 uppercase tracking-wider">
              <CalendarClock size={13} className="shrink-0" />
              <span>Operasional • Jadwal Pengiriman</span>
            </div>

            <h1 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}>
              Kalender Pesanan Katering
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl font-normal ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Pantau jadwal pesanan siap kirim tiap tanggal, akumulasi porsi box dapur, dan rekap menu terjual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 ${
                isDark
                  ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white hover:bg-[#281A18]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Perbarui data kalender"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin text-amber-500' : 'text-amber-500'} />
              <span className="hidden xs:inline">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
                isDark
                  ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white hover:bg-[#281A18]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Package size={13} className="text-amber-500 shrink-0" />
              <span>Daftar Pesanan</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/orders/recap')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
                isDark
                  ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white hover:bg-[#281A18]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Rekap Pesanan</span>
              <span className="sm:hidden">Rekap</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            MONTHLY SUMMARY CARDS (REFINED & HARMONIOUS)
        ====================================================== */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Total Orders */}
          <div
            className={`rounded-2xl border p-3.5 sm:p-4.5 transition-all shadow-2xs ${
              isDark
                ? 'bg-[#18100F] border-[#382321]'
                : 'bg-white border-stone-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}>
                Pesanan Bulan Ini
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <CalendarCheck size={16} />
              </div>
            </div>
            <p className={`mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}>
              {monthlySummary?.total_orders ?? 0}
            </p>
            <p className={`mt-1 text-[11px] sm:text-xs font-medium truncate ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              <strong className={isDark ? 'text-amber-300 font-bold' : 'text-amber-700 font-bold'}>
                {monthlySummary?.active_orders ?? 0}
              </strong>{' '}
              aktif / terkonfirmasi
            </p>
          </div>

          {/* Card 2: Total Portions / Boxes */}
          <div
            className={`rounded-2xl border p-3.5 sm:p-4.5 transition-all shadow-2xs ${
              isDark
                ? 'bg-[#18100F] border-[#382321]'
                : 'bg-white border-stone-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-400/90' : 'text-amber-700'
              }`}>
                Total Box / Porsi
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Boxes size={16} />
              </div>
            </div>
            <p className={`mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${
              isDark ? 'text-amber-400' : 'text-amber-600'
            }`}>
              {monthlySummary?.total_portions ?? 0}{' '}
              <span className="text-xs sm:text-sm font-bold uppercase tracking-normal">Box</span>
            </p>
            <p className={`mt-1 text-[11px] sm:text-xs font-medium truncate ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              Akumulasi katering diproduksi
            </p>
          </div>

          {/* Card 3: Revenue Estimate */}
          <div
            className={`rounded-2xl border p-3.5 sm:p-4.5 transition-all shadow-2xs ${
              isDark
                ? 'bg-[#18100F] border-[#382321]'
                : 'bg-white border-stone-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-emerald-400/90' : 'text-emerald-700'
              }`}>
                Estimasi Omzet
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <Wallet size={16} />
              </div>
            </div>
            <p className={`mt-2 text-lg sm:text-xl lg:text-2xl font-extrabold font-mono tracking-tight truncate ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              {formatRupiah(monthlySummary?.total_revenue ?? 0)}
            </p>
            <p className={`mt-1 text-[11px] sm:text-xs font-medium truncate ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              Dari pesanan aktif bulan ini
            </p>
          </div>

          {/* Card 4: Top Menu Item */}
          <div
            className={`rounded-2xl border p-3.5 sm:p-4.5 transition-all shadow-2xs ${
              isDark
                ? 'bg-[#18100F] border-[#382321]'
                : 'bg-white border-stone-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}>
                Menu Terfavorit
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-[#95271D]/20 text-rose-400 border-[#95271D]/40'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                <Flame size={16} />
              </div>
            </div>
            <p
              className={`mt-2 text-xs sm:text-sm font-extrabold truncate ${
                isDark ? 'text-white' : 'text-stone-950'
              }`}
              title={monthlySummary?.top_sold_items?.[0]?.name}
            >
              {monthlySummary?.top_sold_items?.[0]?.name ?? 'Belum ada data'}
            </p>
            <p className={`mt-1 text-[11px] sm:text-xs font-medium truncate ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}>
              {monthlySummary?.top_sold_items?.[0] ? (
                <span className={`inline-flex items-center gap-1 font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  <Flame size={11} className="shrink-0 text-amber-500" />
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
          className={`rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden ${
            isDark ? 'bg-[#18100F] border-[#382321]' : 'bg-white border-stone-200/90'
          }`}
        >
          {/* Month Bar Header (Clean Responsive Row) */}
          <div
            className={`flex items-center justify-between gap-2 p-3 sm:p-4 border-b ${
              isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-stone-50/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Calendar size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className={`text-base sm:text-xl font-extrabold tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-stone-950'
                  }`}>
                    {MONTH_NAMES_ID[currentMonth - 1]} {currentYear}
                  </h2>
                  {isFetching && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent shrink-0" />
                  )}
                </div>
                <p className={`text-[10px] sm:text-xs font-medium truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Sentuh tanggal untuk detail & rekap menu
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer shadow-2xs active:scale-95 ${
                  isDark
                    ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white hover:bg-[#281A18]'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
                title="Bulan sebelumnya"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1 ${
                  isDark
                    ? 'border-[#F59E0B]/30 bg-amber-950/25 text-amber-300 hover:bg-amber-900/35'
                    : 'border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <CalendarDays size={13} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                <span className="hidden xs:inline">Bulan Ini</span>
                <span className="xs:hidden">Kini</span>
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer shadow-2xs active:scale-95 ${
                  isDark
                    ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white hover:bg-[#281A18]'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
                title="Bulan berikutnya"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Legend Banner (Clean & Horizontal Scrollable on Mobile) */}
          <div className={`px-3 sm:px-4 py-2 border-b flex items-center gap-3 sm:gap-4 overflow-x-auto text-[11px] font-medium no-scrollbar ${
            isDark ? 'border-[#382321]/70 bg-[#160E0D] text-stone-300' : 'border-stone-200/80 bg-stone-50/50 text-stone-600'
          }`}>
            <span className="text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider text-[10px] shrink-0">
              Status:
            </span>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>Menunggu</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span>Dikonfirmasi</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                <span>Diproses Dapur</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Selesai</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span>Libur Dapur</span>
              </span>
            </div>
          </div>

          {/* Calendar Days of Week Header */}
          <div className={`grid grid-cols-7 border-b text-center text-xs font-bold py-2 ${
            isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200 bg-stone-100/70'
          }`}>
            {DAYS_HEADER_FULL.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-0.5 text-[10px] sm:text-xs uppercase tracking-wider ${
                  idx >= 5
                    ? isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold'
                    : isDark ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{DAYS_HEADER_ID[idx]}</span>
              </div>
            ))}
          </div>

          {/* =====================================================
              CALENDAR GRID CELLS (RESPONSIVE & CLEAN)
          ====================================================== */}
          <div className={`grid grid-cols-7 border-l ${
            isDark ? 'border-[#382321]/60' : 'border-stone-200'
          }`}>
            {calendarGrid.map((cell, idx) => {
              // Empty Cell (Inactive / Outside Month)
              if (cell.type === 'empty') {
                return (
                  <div
                    key={`empty-${idx}`}
                    className={`h-[68px] sm:h-auto sm:min-h-[130px] p-1.5 sm:p-2.5 border-r border-b ${
                      isDark
                        ? 'border-[#382321]/60 bg-[#120B0A]/70'
                        : 'border-stone-200 bg-stone-50/50'
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
                  className={`group relative h-[68px] sm:h-auto sm:min-h-[130px] p-1 sm:p-2.5 border-r border-b transition-colors duration-150 cursor-pointer flex flex-col justify-between ${
                    isDark ? 'border-[#382321]/60' : 'border-stone-200'
                  } ${
                    isToday
                      ? isDark
                        ? 'bg-amber-950/20 ring-1.5 ring-inset ring-amber-500/80'
                        : 'bg-amber-50/70 ring-1.5 ring-inset ring-amber-500/80 shadow-2xs'
                      : hasOrders
                        ? isDark
                          ? 'bg-[#1D1210] hover:bg-[#251715]'
                          : 'bg-amber-50/30 hover:bg-amber-50/70'
                        : isClosed
                          ? isDark
                            ? 'bg-rose-950/15 hover:bg-rose-950/25'
                            : 'bg-rose-50/40 hover:bg-rose-50/70'
                          : isDark
                            ? 'bg-[#18100F] hover:bg-[#201413]'
                            : 'bg-white hover:bg-stone-50'
                  }`}
                >
                  {/* =========================================
                      MOBILE PRESENTATION (< 640px)
                  ========================================== */}
                  <div className="flex sm:hidden flex-col items-center justify-between h-full py-0.5">
                    {/* Top: Day Number + Order Indicator */}
                    <div className="w-full flex items-center justify-between px-1">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold transition ${
                          isToday
                            ? 'bg-gradient-to-r from-[#95271D] to-[#7D1E16] text-white shadow-2xs font-black'
                            : isDark
                              ? 'text-stone-300 group-hover:text-amber-400'
                              : 'text-stone-800 group-hover:text-amber-700'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasOrders && dayData && (
                        <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 leading-none">
                          {dayData.order_count}ord
                        </span>
                      )}
                    </div>

                    {/* Middle & Bottom: Portion & Status Dots */}
                    {isClosed ? (
                      <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 leading-tight">
                        Libur
                      </span>
                    ) : hasOrders && dayData ? (
                      <div className="w-full flex flex-col items-center gap-0.5 mt-auto">
                        <span className="text-[10px] font-extrabold font-mono text-amber-600 dark:text-amber-300 truncate leading-none">
                          {dayData.total_portions}<span className="text-[8px] font-normal font-sans">bx</span>
                        </span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {dayData.status_counts.pending > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />}
                          {dayData.status_counts.confirmed > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                          {dayData.status_counts.processing > 0 && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />}
                          {dayData.status_counts.completed > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        </div>
                      </div>
                    ) : (
                      <div className="h-1" />
                    )}
                  </div>

                  {/* =========================================
                      DESKTOP PRESENTATION (>= 640px)
                  ========================================== */}
                  <div className="hidden sm:flex flex-col justify-between h-full">
                    {/* Top Bar: Date Number + Order Badge / Libur Badge */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition ${
                            isToday
                              ? 'bg-gradient-to-r from-[#95271D] to-[#7D1E16] text-white shadow-2xs font-black'
                              : isDark
                                ? 'text-stone-300 group-hover:text-amber-400'
                                : 'text-stone-800 group-hover:text-amber-700'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {isToday && (
                          <span className={`text-[10px] font-bold ${
                            isDark ? 'text-rose-400' : 'text-rose-600'
                          }`}>
                            Hari Ini
                          </span>
                        )}
                      </div>

                      {isClosed ? (
                        <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${
                          isDark
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <Ban size={9} />
                          <span>Libur</span>
                        </span>
                      ) : hasOrders && dayData ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          isDark
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
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
                            className={`rounded-lg px-2 py-1 text-xs font-bold flex items-center justify-between shadow-2xs ${
                              isDark
                                ? 'bg-[#281816] border border-amber-500/20 text-amber-200'
                                : 'bg-amber-50/90 border border-amber-200 text-amber-950'
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
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  isDark
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                                    : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}
                                title={`${dayData.status_counts.pending} Pesanan Menunggu`}
                              >
                                <Clock size={9} className="shrink-0" />
                                <span>{dayData.status_counts.pending}</span>
                              </span>
                            )}
                            {dayData.status_counts.confirmed > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  isDark
                                    ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                                    : 'bg-blue-50 text-blue-900 border-blue-200'
                                }`}
                                title={`${dayData.status_counts.confirmed} Pesanan Terkonfirmasi`}
                              >
                                <Check size={9} className="shrink-0 stroke-[3]" />
                                <span>{dayData.status_counts.confirmed}</span>
                              </span>
                            )}
                            {dayData.status_counts.processing > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  isDark
                                    ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                                    : 'bg-purple-50 text-purple-900 border-purple-200'
                                }`}
                                title={`${dayData.status_counts.processing} Pesanan Diproses Dapur`}
                              >
                                <ChefHat size={9} className="shrink-0" />
                                <span>{dayData.status_counts.processing}</span>
                              </span>
                            )}
                            {dayData.status_counts.completed > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  isDark
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
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
                            <div className={`flex items-center gap-1 text-[10px] truncate font-medium ${
                              isDark ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              <Utensils size={10} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                              <span className="truncate">{dayData.items_breakdown[0].name}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] text-stone-400/40 text-center py-2 font-medium">
                          -
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Revenue & Detail CTA Hint */}
                    {hasOrders && dayData ? (
                      <div className="pt-1 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono rounded-md px-1.5 py-0.5 truncate shadow-2xs border ${
                          isDark
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <Wallet size={10} className={`shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className="truncate">{formatRupiah(dayData.total_revenue)}</span>
                        </span>

                        <span className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDark ? 'text-amber-400' : 'text-amber-600'
                        }`}>
                          Detail →
                        </span>
                      </div>
                    ) : (
                      <div className="h-3" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* =====================================================
            DATE DETAIL MODAL (REFINED & INTENTIONAL)
        ====================================================== */}
        {selectedDate && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDate(null)
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                isDark
                  ? 'bg-[#18100F] border-[#382321] text-stone-100 shadow-black/80'
                  : 'bg-white border-stone-200 text-stone-900 shadow-xl'
              }`}
            >
              {/* Modal Header */}
              <div
                className={`p-3.5 sm:p-4.5 border-b flex items-center justify-between shrink-0 ${
                  isDark
                    ? 'border-[#382321] bg-[#140D0C]'
                    : 'border-stone-200 bg-stone-50/90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    isDark
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    <CalendarDays size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-base sm:text-lg font-extrabold tracking-tight truncate ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}>
                      {formattedSelectedDate}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 text-xs">
                      {selectedDayData?.is_closed && (
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                          isDark
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <Lock size={9} /> Dapur Libur
                        </span>
                      )}
                      <span className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        <strong className="text-stone-200 dark:text-stone-200">{selectedDayData?.order_count ?? 0} Pesanan</strong> •{' '}
                        <strong className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                          {selectedDayData?.total_portions ?? 0} Box
                        </strong>{' '}
                        •{' '}
                        <strong className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatRupiah(selectedDayData?.total_revenue ?? 0)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className={`rounded-xl p-2 transition cursor-pointer shrink-0 ${
                    isDark
                      ? 'text-stone-400 hover:text-white hover:bg-stone-800'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  title="Tutup dialog"
                  aria-label="Tutup dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Segmented Pill Tabs Navigation */}
              <div className={`p-2.5 sm:p-3 border-b shrink-0 ${
                isDark ? 'border-[#382321] bg-[#160E0D]' : 'border-stone-200 bg-stone-50/50'
              }`}>
                <div className={`p-1 rounded-xl flex gap-1 border ${
                  isDark
                    ? 'bg-[#120B0A] border-[#382321]'
                    : 'bg-stone-100 border-stone-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('orders')}
                    className={`flex-1 py-1.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeModalTab === 'orders'
                        ? isDark
                          ? 'bg-[#281816] text-amber-300 shadow-2xs border border-amber-500/30'
                          : 'bg-white text-stone-950 shadow-2xs border border-stone-200'
                        : isDark
                          ? 'text-stone-400 hover:text-stone-200'
                          : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <Package size={14} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>Daftar Pesanan ({selectedDayData?.order_count ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab('items')}
                    className={`flex-1 py-1.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeModalTab === 'items'
                        ? isDark
                          ? 'bg-[#281816] text-amber-300 shadow-2xs border border-amber-500/30'
                          : 'bg-white text-stone-950 shadow-2xs border border-stone-200'
                        : isDark
                          ? 'text-stone-400 hover:text-stone-200'
                          : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    <UtensilsCrossed size={14} className={`shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>Rekap Menu ({selectedDayData?.items_breakdown?.length ?? 0})</span>
                  </button>
                </div>
              </div>

              {/* Modal Body / Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                {!selectedDayData || selectedDayData.order_count === 0 ? (
                  <div className="py-12 text-center space-y-2.5">
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      isDark
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      <CalendarX size={24} />
                    </div>
                    <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-stone-950'}`}>
                      Tidak Ada Pesanan Terjadwal
                    </h4>
                    <p className={`text-xs max-w-sm mx-auto font-normal ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}>
                      Belum ada pesanan katering yang dijadwalkan untuk dikirim pada tanggal ini.
                    </p>
                  </div>
                ) : activeModalTab === 'orders' ? (
                  /* =====================================================
                     TAB 1: DAFTAR PESANAN LENGKAP
                  ====================================================== */
                  <div className="space-y-3">
                    {selectedDayData.orders.map((order: Order) => {
                      const waLink = order.customers_phone
                        ? getWhatsAppInvoiceUrl(order)
                        : null

                      return (
                        <div
                          key={order.id}
                          className={`rounded-2xl border p-3.5 sm:p-4 transition-all space-y-3 shadow-2xs ${
                            isDark
                              ? 'bg-[#1E1413] border-[#382321] hover:border-[#F59E0B]/30'
                              : 'bg-white border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          {/* Order Top: Time, Code, Status Badges */}
                          <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${
                            isDark ? 'border-[#382321]' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold border ${
                                isDark
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                  : 'bg-amber-50 text-amber-950 border-amber-200'
                              }`}>
                                <Clock size={11} className={isDark ? 'text-amber-400' : 'text-amber-700'} />
                                <span>{order.event_time ? `${order.event_time} WIB` : 'Jam Belum Diatur'}</span>
                              </span>

                              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                                isDark
                                  ? 'bg-[#140D0C] border-[#382321] text-stone-300'
                                  : 'bg-stone-50 border-stone-200 text-stone-700'
                              }`}>
                                #{order.order_code}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              {/* Order Status Badge */}
                              <span className={`rounded-full px-2 py-0.5 border ${
                                order.status === 'completed'
                                  ? isDark
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.status === 'processing'
                                    ? isDark
                                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/25'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                    : order.status === 'confirmed'
                                      ? isDark
                                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                      : order.status === 'cancelled'
                                        ? isDark
                                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                        : isDark
                                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {order.status === 'completed' ? 'Selesai' :
                                 order.status === 'processing' ? 'Diproses Dapur' :
                                 order.status === 'confirmed' ? 'Dikonfirmasi' :
                                 order.status === 'cancelled' ? 'Dibatalkan' : 'Menunggu'}
                              </span>

                              {/* Payment Status Badge */}
                              <span className={`rounded-full px-2 py-0.5 border ${
                                order.payment_status === 'paid'
                                  ? isDark
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isDark
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {order.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                              </span>
                            </div>
                          </div>

                          {/* Customer Info & WhatsApp Direct */}
                          <div className="space-y-1 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <UserCheck size={13} className="text-amber-500 shrink-0" />
                                <span className={`font-bold text-sm ${
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
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2 py-0.5 shadow-2xs transition"
                                  title="Buka WhatsApp Pelanggan"
                                >
                                  <MessageCircle size={11} />
                                  <span>{order.customers_phone}</span>
                                </a>
                              )}
                            </div>

                            {order.delivery_address && (
                              <p className={`flex items-start gap-1.5 text-xs font-normal ${
                                isDark ? 'text-stone-300' : 'text-stone-600'
                              }`}>
                                <MapPin size={12} className="shrink-0 mt-0.5 text-red-500" />
                                <span className="truncate">{order.delivery_address}</span>
                              </p>
                            )}
                          </div>

                          {/* Ordered Items List */}
                          <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                            isDark
                              ? 'bg-[#140D0C] border-[#382321]'
                              : 'bg-stone-50 border-stone-200'
                          }`}>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              Item Katering yang Dipesan:
                            </p>
                            {order.items?.map((it, i) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <span className={`font-medium ${
                                  isDark ? 'text-stone-200' : 'text-stone-800'
                                }`}>
                                  <span className={`inline-block px-1.5 py-0.2 rounded font-bold text-[11px] mr-1.5 ${
                                    isDark
                                      ? 'bg-amber-950/40 text-amber-300'
                                      : 'bg-amber-100 text-amber-950'
                                  }`}>
                                    {it.quantity}x
                                  </span>
                                  {it.item_name || it.product?.name}
                                </span>
                                <span className={`font-bold font-mono ${
                                  isDark ? 'text-amber-200' : 'text-stone-900'
                                }`}>
                                  {formatRupiah(it.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Special Instructions Note (if any) */}
                          {order.notes && (
                            <div className={`p-2 rounded-xl border text-xs flex items-start gap-1.5 ${
                              isDark
                                ? 'bg-amber-950/15 border-amber-800/30 text-amber-200'
                                : 'bg-amber-50/70 border-amber-200 text-amber-900'
                            }`}>
                              <AlertCircle size={12} className="shrink-0 mt-0.5 text-amber-600" />
                              <p className="font-normal">
                                <strong className="font-bold">Catatan:</strong> {order.notes}
                              </p>
                            </div>
                          )}

                          {/* Order Bottom / Total Payment & Link */}
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className={`font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              Total Tagihan:
                            </span>
                            <div className="flex items-center gap-2.5">
                              <span className={`font-extrabold font-mono text-sm sm:text-base ${
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
                                className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 border transition cursor-pointer ${
                                  isDark
                                    ? 'border-[#382321] bg-[#140D0C] text-stone-300 hover:text-white hover:bg-[#281A18]'
                                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
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
                  <div className="space-y-3">
                    <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      Rincian varian menu & total porsi katering yang harus dimasak dapur pada tanggal ini:
                    </p>

                    <div className={`rounded-xl border overflow-hidden shadow-2xs ${
                      isDark ? 'bg-[#1E1413] border-[#382321]' : 'bg-white border-stone-200'
                    }`}>
                      <table className="w-full text-left text-xs">
                        <thead className={`border-b ${
                          isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200 bg-stone-50'
                        }`}>
                          <tr>
                            <th className={`px-3 sm:px-4 py-2.5 font-bold uppercase text-[10px] ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Menu Katering
                            </th>
                            <th className={`px-3 sm:px-4 py-2.5 font-bold uppercase text-[10px] text-center ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Jumlah
                            </th>
                            <th className={`px-3 sm:px-4 py-2.5 font-bold uppercase text-[10px] text-right ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Total Nilai
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          isDark ? 'divide-[#382321]/60' : 'divide-stone-100'
                        }`}>
                          {selectedDayData.items_breakdown?.map((item: CalendarItemBreakdown, idx: number) => (
                            <tr
                              key={idx}
                              className={`transition ${
                                isDark ? 'hover:bg-[#251715]' : 'hover:bg-amber-50/40'
                              }`}
                            >
                              <td className="px-3 sm:px-4 py-2.5 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                                    idx === 0
                                      ? 'bg-amber-500 text-white'
                                      : isDark
                                        ? 'bg-[#281816] text-amber-300'
                                        : 'bg-stone-100 text-stone-700'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <UtensilsCrossed size={12} className="shrink-0 text-amber-500" />
                                    <span className={`font-bold truncate ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                                      {item.name}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                                  isDark
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                                    : 'bg-amber-50 text-amber-950 border-amber-200'
                                }`}>
                                  <Boxes size={10} className="text-amber-500" />
                                  <span>{item.quantity} Box</span>
                                </span>
                              </td>
                              <td className={`px-3 sm:px-4 py-2.5 text-right font-bold font-mono whitespace-nowrap ${
                                isDark ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                {formatRupiah(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className={`border-t font-bold ${
                          isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200 bg-stone-50'
                        }`}>
                          <tr>
                            <td className={`px-3 sm:px-4 py-2.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                              Total Porsi & Omzet
                            </td>
                            <td className={`px-3 sm:px-4 py-2.5 text-center text-xs ${
                              isDark ? 'text-amber-400 font-extrabold' : 'text-amber-700 font-extrabold'
                            }`}>
                              {selectedDayData.total_portions} Box
                            </td>
                            <td className={`px-3 sm:px-4 py-2.5 text-right text-xs font-mono font-extrabold ${
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
                className={`p-3 sm:p-4 border-t flex items-center justify-between shrink-0 ${
                  isDark
                    ? 'border-[#382321] bg-[#140D0C]'
                    : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>{selectedDayData?.order_count ?? 0} transaksi terjadwal</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
                    isDark
                      ? 'bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white'
                      : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                  }`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
