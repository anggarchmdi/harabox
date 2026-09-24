import { useState, useEffect } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  // Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Package,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Order, OrderStatus, PaymentStatus } from '../../types/orders'
import { ordersService } from '../../services/orders.service'
import { useThemeStore } from '../../stores/theme.store'
import OrderStatusBadge from '../../components/admin/orders/OrderStatusBadge'
import PaymentStatusBadge from '../../components/admin/orders/PaymentStatusBadge'
import useDebounce from '../../hooks/useDebounce'

function formatRupiah(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function toDateInputValue(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AdminOrderRecap() {
  const isDark = useThemeStore((state) => state.theme === 'dark')

  // Default range: awal bulan ini s/d akhir bulan ini
  const now = new Date()
  const defaultStartDate = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
  const defaultEndDate = toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0))

  // Date range filters
  const [startDate, setStartDate] = useState<string>(defaultStartDate)
  const [endDate, setEndDate] = useState<string>(defaultEndDate)
  const [activePreset, setActivePreset] = useState<string>('this_month')

  // Other filters
  const [dateType, setDateType] = useState<'event_date' | 'created_at'>('event_date')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search, 400)

  // Detail modal state & export state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [startDate, endDate, dateType, status, paymentStatus, debouncedSearch])

  // Presets handler
  const handleApplyPreset = (presetKey: string) => {
    setActivePreset(presetKey)
    const today = new Date()

    if (presetKey === 'today') {
      const todayStr = toDateInputValue(today)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (presetKey === 'last_7') {
      const past = new Date()
      past.setDate(today.getDate() - 6)
      setStartDate(toDateInputValue(past))
      setEndDate(toDateInputValue(today))
    } else if (presetKey === 'last_30') {
      const past = new Date()
      past.setDate(today.getDate() - 29)
      setStartDate(toDateInputValue(past))
      setEndDate(toDateInputValue(today))
    } else if (presetKey === 'this_month') {
      setStartDate(toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)))
      setEndDate(toDateInputValue(new Date(today.getFullYear(), today.getMonth() + 1, 0)))
    } else if (presetKey === 'last_month') {
      setStartDate(toDateInputValue(new Date(today.getFullYear(), today.getMonth() - 1, 1)))
      setEndDate(toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 0)))
    } else if (presetKey === 'this_year') {
      setStartDate(toDateInputValue(new Date(today.getFullYear(), 0, 1)))
      setEndDate(toDateInputValue(new Date(today.getFullYear(), 11, 31)))
    } else if (presetKey === 'all') {
      setStartDate('')
      setEndDate('')
    }
  }

  // Fetch recap data
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      'admin-order-recap',
      startDate,
      endDate,
      dateType,
      status,
      paymentStatus,
      debouncedSearch,
      page,
    ],
    queryFn: () =>
      ordersService.getRecap({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_type: dateType,
        status: status === 'all' ? undefined : status,
        payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
        search: debouncedSearch.trim() || undefined,
        page,
        per_page: 15,
      }),
  })

  const summary = data?.summary
  const orders = data?.orders?.data ?? []
  const pagination = data?.orders
  // const filterInfo = data?.filter_info

  // Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true)
      await ordersService.exportRecap({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        date_type: dateType,
        status: status === 'all' ? undefined : status,
        payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
        search: debouncedSearch.trim() || undefined,
      })
      toast.success('Berkas Excel (.csv) rekapan pesanan berhasil diunduh.')
    } catch {
      toast.error('Gagal mengunduh berkas rekapan. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className={`min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 transition-colors duration-300 ${isDark ? 'text-stone-100' : 'text-stone-900'
        }`}
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Laporan & Pembukuan
            </p>
          </div>
          <h1
            className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-stone-950'
              }`}
          >
            Rekapitulasi Data Pesanan
          </h1>
          <p
            className={`mt-1 text-xs sm:text-sm max-w-2xl ${isDark ? 'text-amber-100/70' : 'text-stone-500'
              }`}
          >
            Tarik data rekapan pesanan secara fleksibel antara rentang tanggal yang Anda tentukan, lalu unduh hasilnya dalam format Excel (.csv).
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer ${isDark
              ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
          >
            <RefreshCw
              size={14}
              className={isFetching ? 'animate-spin' : ''}
            />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-red-950/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet size={16} />
            <span>{isExporting ? 'Mengunduh...' : 'Unduh Rekap Excel (.csv)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-2xs ${isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
          }`}
      >
        {/* Filter Header & Active Period Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-4 border-b border-stone-200/60 dark:border-[#60241E]/60">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-red-600" />
            <h2 className="text-xs sm:text-sm font-bold tracking-tight">
              Rentang Tanggal & Filter Pesanan
            </h2>
            {isFetching && (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                <RefreshCw size={12} className="animate-spin" />
                <span>Memperbarui...</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(startDate || endDate || status !== 'all' || paymentStatus !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  handleApplyPreset('this_month')
                  setStatus('all')
                  setPaymentStatus('all')
                  setSearch('')
                }}
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition cursor-pointer ${isDark
                  ? 'border-[#60241E] text-stone-300 hover:text-white hover:bg-[#2D120F]'
                  : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="mb-4">
          <p
            className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
          >
            Pilihan Cepat Rentang Waktu:
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'last_7', label: '7 Hari Terakhir' },
              { id: 'last_30', label: '30 Hari Terakhir' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
              { id: 'this_year', label: 'Tahun Ini' },
              { id: 'all', label: 'Semua Waktu' },
            ].map((p) => {
              const isActive = activePreset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${isActive
                    ? 'bg-red-600 border-red-600 text-white shadow-xs'
                    : isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date Inputs & Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Start Date */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
            >
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setActivePreset('custom')
              }}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                }`}
            />
          </div>

          {/* End Date */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
            >
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value)
                setActivePreset('custom')
              }}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                }`}
            />
          </div>

          {/* Date Type Selector */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
            >
              Dasar Tanggal
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value as 'event_date' | 'created_at')}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                }`}
            >
              <option value="event_date" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>
                Tanggal Acara (Event Date)
              </option>
              <option value="created_at" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>
                Tanggal Pesanan Dibuat
              </option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
            >
              Status Pesanan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                }`}
            >
              <option value="all" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Semua Status</option>
              <option value="pending" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Menunggu Konfirmasi</option>
              <option value="confirmed" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Dikonfirmasi</option>
              <option value="processing" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Diproses Dapur</option>
              <option value="completed" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Selesai</option>
              <option value="cancelled" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Dibatalkan</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
            >
              Status Pembayaran
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | 'all')}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                }`}
            >
              <option value="all" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Semua Pembayaran</option>
              <option value="paid" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Lunas</option>
              <option value="dp" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>DP Masuk</option>
              <option value="unpaid" className={isDark ? 'bg-[#1C0B09]' : 'bg-white'}>Belum Bayar</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
            >
              Cari Pesanan
            </label>
            <div className="relative">
              <Search
                size={14}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-400' : 'text-stone-400'
                  }`}
              />
              <input
                type="text"
                placeholder="Kode / Pemesan / Telp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full rounded-xl border pl-8.5 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${isDark
                  ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                  : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                  }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Orders Card */}
        <div
          className={`rounded-2xl border p-4.5 shadow-2xs relative overflow-hidden ${isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
                }`}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Total Pesanan
              </p>
              <p className="text-xl font-extrabold tracking-tight">
                {isLoading ? '...' : (summary ? summary.total_orders.toLocaleString('id-ID') : '0')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-stone-100 dark:border-[#60241E]/40 text-[10px]">
            <span className="text-emerald-600 font-semibold">
              Selesai: {summary?.status_counts?.completed || 0}
            </span>
            <span className="text-stone-400">•</span>
            <span className="text-amber-500 font-semibold">
              Proses: {(summary?.status_counts?.processing || 0) + (summary?.status_counts?.confirmed || 0)}
            </span>
          </div>
        </div>

        {/* Total Portions Card */}
        <div
          className={`rounded-2xl border p-4.5 shadow-2xs relative overflow-hidden ${isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'
                }`}
            >
              <Package size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Total Porsi (Box)
              </p>
              <p className="text-xl font-extrabold tracking-tight">
                {isLoading ? '...' : (summary ? summary.total_portions.toLocaleString('id-ID') : '0')}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-[#60241E]/40">
            Akumulasi box katering dalam periode
          </p>
        </div>

        {/* Total Revenue Card */}
        <div
          className={`rounded-2xl border p-4.5 shadow-2xs relative overflow-hidden ${isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                }`}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Total Omset (Gross)
              </p>
              <p className="text-lg font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {isLoading ? '...' : (summary ? formatRupiah(summary.total_revenue) : 'Rp 0')}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-[#60241E]/40">
            Tidak termasuk order yang dibatalkan
          </p>
        </div>

        {/* Total Paid Card */}
        <div
          className={`rounded-2xl border p-4.5 shadow-2xs relative overflow-hidden ${isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'
                }`}
            >
              <Coins size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Pembayaran Masuk
              </p>
              <p className="text-lg font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {isLoading ? '...' : (summary ? formatRupiah(summary.total_paid) : 'Rp 0')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-[#60241E]/40">
            <span>Lunas: {summary?.payment_status_counts?.paid || 0}</span>
            <span>DP: {summary?.payment_status_counts?.dp || 0}</span>
          </div>
        </div>

        {/* Total Unpaid / Sisa Piutang Card */}
        <div
          className={`rounded-2xl border p-4.5 shadow-2xs relative overflow-hidden ${isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600'
                }`}
            >
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Sisa Tagihan (Piutang)
              </p>
              <p className="text-lg font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                {isLoading ? '...' : (summary ? formatRupiah(summary.total_unpaid) : 'Rp 0')}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-[#60241E]/40">
            Belum Lunas: {summary?.payment_status_counts?.unpaid || 0} order
          </p>
        </div>
      </div>

      {/* Data Table Preview */}
      <div
        className={`overflow-hidden rounded-2xl border shadow-2xs ${isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/80 bg-white'
          }`}
      >
        {/* Table Header Bar */}
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b gap-3 ${isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-stone-50/70'
            }`}
        >
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-2">
              <span>Daftar Pesanan ({pagination?.total ?? orders.length} Pesanan)</span>
              {isFetching && (
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Rincian transaksi yang sesuai dengan rentang tanggal dan filter aktif.
            </p>
          </div>

          {/* <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || orders.length === 0}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer disabled:opacity-40 ${isDark
              ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
          >
            <Download size={13} />
            <span>Ekspor Hasil Ini (.csv)</span>
          </button> */}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto relative">
          {isFetching && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-600/30 overflow-hidden">
              <div className="w-full h-full bg-red-600 animate-pulse" />
            </div>
          )}

          <table className="w-full text-left">
            <thead
              className={`border-b text-[11px] font-bold uppercase tracking-wider ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-amber-200/60'
                : 'border-stone-200/80 bg-stone-50/80 text-stone-400'
                }`}
            >
              <tr>
                <th className="px-5 py-3.5">No & ID Order</th>
                <th className="px-5 py-3.5">Pemesan</th>
                <th className="px-5 py-3.5">Tanggal Acara</th>
                <th className="px-5 py-3.5">Menu & Porsi</th>
                <th className="px-5 py-3.5">Total Tagihan</th>
                <th className="px-5 py-3.5">Status Pesanan</th>
                <th className="px-5 py-3.5">Pembayaran</th>
                <th className="px-5 py-3.5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#60241E]/40' : 'divide-stone-100'}`}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle
                        size={32}
                        className={isDark ? 'text-stone-600' : 'text-stone-300'}
                      />
                      <p className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Tidak ada pesanan ditemukan
                      </p>
                      <p className={`text-xs max-w-sm ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        Coba sesuaikan rentang tanggal atau ganti filter status pesanan.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const rowNumber = ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 15) + index + 1
                  const totalPortions = order.items?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${isDark ? 'hover:bg-[#2D120F]/50' : 'hover:bg-stone-50/80'
                        }`}
                    >
                      {/* ID & No */}
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-bold text-stone-400">
                          #{rowNumber}
                        </span>
                        <p className="font-mono text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
                          {order.order_code}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Dibuat: {formatDate(order.created_at)}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold">{order.customers_name}</p>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {order.customers_phone}
                        </p>
                      </td>

                      {/* Event Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar size={13} className="text-red-500 shrink-0" />
                          <span>{formatDate(order.event_date)}</span>
                        </div>
                        {order.event_time && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                            <Clock size={11} />
                            <span>{order.event_time} WIB</span>
                          </div>
                        )}
                      </td>

                      {/* Menu & Portions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {totalPortions} Box
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-1">
                          {order.items && order.items.length > 0
                            ? order.items.map((i) => `${i.item_name} (${i.quantity}x)`).join(', ')
                            : 'Menu Katering'}
                        </p>
                      </td>

                      {/* Total Bill */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold">{formatRupiah(order.total)}</p>
                        {Number(order.delivery_fee) > 0 && (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            + Ongkir {formatRupiah(order.delivery_fee)}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <PaymentStatusBadge status={order.payment_status} />
                        {order.payment_status === 'dp' && (
                          <p className="text-[10px] text-amber-500 font-semibold mt-1">
                            DP: {formatRupiah(order.paid_amount)}
                          </p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                            : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                            }`}
                          title="Lihat Detail Pesanan"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="lg:hidden p-3 divide-y divide-stone-100 dark:divide-[#60241E]/40 space-y-3">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Tidak ada pesanan untuk rentang tanggal yang dipilih.
            </div>
          ) : (
            orders.map((order) => {
              const totalPortions = order.items?.reduce((acc, curr) => acc + (curr.quantity || 0), 0) || 0

              return (
                <div key={order.id} className="pt-3 first:pt-0 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      {order.order_code}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">{order.customers_name}</p>
                    <p className="text-[11px] text-stone-400">{order.customers_phone}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span>Tgl: {formatDate(order.event_date)}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {totalPortions} Porsi
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-extrabold">{formatRupiah(order.total)}</p>
                      <PaymentStatusBadge status={order.payment_status} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-200'
                        : 'border-stone-200 bg-stone-50 text-stone-700'
                        }`}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.last_page > 1 && (
          <div
            className={`flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 text-xs ${isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-stone-50/50'
              }`}
          >
            <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
              Menampilkan halaman <span className="font-bold text-red-600">{pagination.current_page}</span> dari{' '}
              <span className="font-bold">{pagination.last_page}</span> ({pagination.total} pesanan)
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1}
                className={`p-2 rounded-lg border transition disabled:opacity-30 cursor-pointer ${isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: pagination.last_page }).map((_, i) => {
                const pageNum = i + 1
                if (
                  pageNum === 1 ||
                  pageNum === pagination.last_page ||
                  (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${pagination.current_page === pageNum
                        ? 'bg-red-600 text-white'
                        : isDark
                          ? 'border border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                          : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                } else if (
                  pageNum === pagination.current_page - 2 ||
                  pageNum === pagination.current_page + 2
                ) {
                  return (
                    <span key={pageNum} className="px-1 text-stone-400">
                      ...
                    </span>
                  )
                }
                return null
              })}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page}
                className={`p-2 rounded-lg border transition disabled:opacity-30 cursor-pointer ${isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl transition-all ${isDark ? 'border-[#60241E] bg-[#1C0B09] text-stone-100' : 'border-stone-200 bg-white text-stone-900'
              }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-[#60241E]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                  Rincian Data Pesanan
                </span>
                <h3 className="text-xl font-extrabold mt-0.5">{selectedOrder.order_code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={`p-2 rounded-full border transition cursor-pointer ${isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-400 hover:text-white'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-900'
                  }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-4 space-y-5">
              {/* Order Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`p-3.5 rounded-2xl border ${isDark ? 'border-[#60241E]/60 bg-[#240E0C]' : 'border-stone-100 bg-stone-50'
                    }`}
                >
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Informasi Pemesan
                  </p>
                  <p className="text-sm font-bold">{selectedOrder.customers_name}</p>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">{selectedOrder.customers_phone}</p>
                  <p className="text-xs text-stone-500 mt-2">
                    <span className="font-semibold">Alamat:</span> {selectedOrder.delivery_address}
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${isDark ? 'border-[#60241E]/60 bg-[#240E0C]' : 'border-stone-100 bg-stone-50'
                    }`}
                >
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Waktu & Status
                  </p>
                  <p className="text-xs">
                    <span className="text-stone-400">Tgl Acara:</span>{' '}
                    <span className="font-bold">{formatDate(selectedOrder.event_date)}</span>{' '}
                    {selectedOrder.event_time && `(${selectedOrder.event_time} WIB)`}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <span className="text-stone-400">Dibuat:</span> {formatDate(selectedOrder.created_at)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <OrderStatusBadge status={selectedOrder.status} />
                    <PaymentStatusBadge status={selectedOrder.payment_status} />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Daftar Menu Pesanan
                </h4>
                <div
                  className={`rounded-2xl border divide-y overflow-hidden ${isDark
                    ? 'border-[#60241E]/60 divide-[#60241E]/40 bg-[#240E0C]'
                    : 'border-stone-200 divide-stone-100 bg-white'
                    }`}
                >
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold">
                          {item.item_name}{' '}
                          <span className="text-red-600 font-semibold">x{item.quantity}</span>
                        </p>
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.addons.map((a, aIdx) => (
                              <span
                                key={aIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-md ${isDark
                                  ? 'bg-[#1C0B09] text-amber-300 border border-[#60241E]'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                              >
                                {a.addon_group_name ? `${a.addon_group_name}: ` : ''}
                                {a.addon_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold shrink-0">{formatRupiah(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs ${isDark ? 'border-[#60241E]/60 bg-[#240E0C]' : 'border-stone-200 bg-stone-50'
                  }`}
              >
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal Menu:</span>
                  <span className="font-semibold">{formatRupiah(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold">{formatRupiah(selectedOrder.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-stone-200 dark:border-[#60241E]">
                  <span>Total Tagihan:</span>
                  <span className="text-red-600 dark:text-red-400">{formatRupiah(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold">
                  <span>Nominal Dibayar:</span>
                  <span>{formatRupiah(selectedOrder.paid_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                  <span>Sisa Tagihan:</span>
                  <span>
                    {formatRupiah(
                      Math.max(0, Number(selectedOrder.total) - Number(selectedOrder.paid_amount || 0))
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200 dark:border-[#60241E] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${isDark
                  ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                  : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
