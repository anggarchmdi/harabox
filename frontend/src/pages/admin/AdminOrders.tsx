import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  FileSpreadsheet,
  LayoutGrid,
  MapPin,
  MessageCircle,
  PackageCheck,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  User,
  X,
  XCircle,
  Check,
  Plus,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Order, OrderStatus, PaymentStatus } from '../../types/orders'
import { ordersService } from '../../services/orders.service'
import { useThemeStore } from '../../stores/theme.store'
import OrderTable, {
  getWhatsAppInvoiceUrl,
  getWhatsAppTestimonialUrl,
} from '../../components/admin/orders/OrderTable'
import OrderStatusBadge from '../../components/admin/orders/OrderStatusBadge'
import PaymentStatusBadge from '../../components/admin/orders/PaymentStatusBadge'
import PageLoader from '../../components/ui/PageLoader'
import useDebounce from '../../hooks/useDebounce'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRupiah(value: string | number) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

function OrderTableSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-2xs ${
        isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/80 bg-white'
      }`}
    >
      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead
            className={`border-b text-[11px] font-bold uppercase tracking-wider ${
              isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-amber-200/60'
                : 'border-stone-200/80 bg-stone-50/80 text-stone-400'
            }`}
          >
            <tr>
              <th className="px-5 py-3.5">ID & Tgl Pesan</th>
              <th className="px-5 py-3.5">Pemesan</th>
              <th className="px-5 py-3.5">Menu & Porsi</th>
              <th className="px-5 py-3.5">Acara & Alamat</th>
              <th className="px-5 py-3.5">Total Tagihan</th>
              <th className="px-5 py-3.5">Status Pesanan</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#60241E]/40' : 'divide-stone-100'}`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-20 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-14 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-28 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-20 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-36 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-32 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-4 w-16 rounded-full ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-6 w-28 rounded-full ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className={`h-7 w-7 rounded-lg ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                    <div className={`h-7 w-7 rounded-lg ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Skeletons */}
      <div className="lg:hidden p-3 divide-y divide-stone-100 dark:divide-[#60241E]/40 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="pt-3 first:pt-0 animate-pulse space-y-2.5">
            <div className="flex items-center justify-between">
              <div className={`h-3.5 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
              <div className={`h-5 w-20 rounded-full ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
            </div>
            <div className={`h-3.5 w-40 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
            <div className={`h-3 w-32 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
            <div className="flex items-center justify-between pt-1">
              <div className={`h-4 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
              <div className={`h-7 w-16 rounded-lg ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const isDark = useThemeStore((state) => state.theme === 'dark')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | ''>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedStatus, selectedPaymentStatus])

  const [paymentForm, setPaymentForm] = useState<{
    payment_status: PaymentStatus
    paid_amount: string
    payment_method: string
    payment_note: string
  }>({
    payment_status: 'unpaid',
    paid_amount: '0',
    payment_method: 'Transfer BCA',
    payment_note: '',
  })

  useEffect(() => {
    if (selectedOrder) {
      setPaymentForm({
        payment_status: selectedOrder.payment_status || 'unpaid',
        paid_amount: String(selectedOrder.paid_amount || '0'),
        payment_method: selectedOrder.payment_method || 'Transfer BCA',
        payment_note: selectedOrder.payment_note || '',
      })
    }
  }, [selectedOrder])

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-orders', page, selectedStatus, selectedPaymentStatus, debouncedSearch],
    queryFn: () =>
      ordersService.getAll({
        page,
        per_page: 15,
        status: selectedStatus || undefined,
        payment_status: selectedPaymentStatus || undefined,
        search: debouncedSearch.trim() || undefined,
      }),
  })

  const orders = data?.orders ?? []
  const pagination = data?.pagination

  const handleUpdateStatus = async (status: OrderStatus, force?: boolean) => {
    if (!selectedOrder) return

    try {
      setUpdatingStatus(true)
      const updated = await ordersService.updateStatus(
        selectedOrder.id,
        status,
        force,
      )
      setSelectedOrder(updated)
      toast.success(
        `Status order ${updated.order_code} berhasil diubah ke "${status}".`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-today-capacity'] })
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-overview'] })
    } catch (err: any) {
      if (err.response?.data?.requires_confirmation) {
        const confirmForce = window.confirm(
          `${err.response.data.message}\n\nApakah Anda ingin tetap memproses pesanan ini melebihi kuota dapur?`
        )
        if (confirmForce) {
          await handleUpdateStatus(status, true)
          return
        }
      } else {
        toast.error(err.response?.data?.message || 'Gagal memperbarui status order.')
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleUpdatePayment = async (overrideStatus?: PaymentStatus, overrideAmount?: number) => {
    if (!selectedOrder) return

    const statusToSet = overrideStatus || paymentForm.payment_status
    let amountToSet =
      overrideAmount !== undefined
        ? overrideAmount
        : Number(paymentForm.paid_amount) || 0

    if (statusToSet === 'paid' && amountToSet <= 0) {
      amountToSet = Number(selectedOrder.total)
    }

    try {
      setUpdatingPayment(true)
      const updated = await ordersService.updatePayment(selectedOrder.id, {
        payment_status: statusToSet,
        paid_amount: amountToSet,
        payment_method: paymentForm.payment_method.trim() || undefined,
        payment_note: paymentForm.payment_note.trim() || undefined,
      })
      setSelectedOrder(updated)
      setPaymentForm({
        payment_status: updated.payment_status,
        paid_amount: String(updated.paid_amount || '0'),
        payment_method: updated.payment_method || 'Transfer BCA',
        payment_note: updated.payment_note || '',
      })
      toast.success(
        `Status pembayaran berhasil diperbarui ke "${
          updated.payment_status === 'paid'
            ? 'Lunas'
            : updated.payment_status === 'dp'
              ? 'DP Masuk'
              : 'Belum Bayar'
        }".`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch {
      toast.error('Gagal memperbarui status pembayaran.')
    } finally {
      setUpdatingPayment(false)
    }
  }

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        text="Memuat Pesanan Katering Masuk..."
        subtext="Sinkronisasi status dan rincian pesanan pelanggan"
        minDuration={400}
      />
      <div
        className={`min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 transition-colors duration-300 ${
          isDark ? 'text-stone-100' : 'text-stone-900'
        }`}
      >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Catering Management
            </p>
          </div>
          <h1
            className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}
          >
            Daftar Pesanan Masuk
          </h1>
          <p
            className={`mt-1 text-xs sm:text-sm max-w-2xl ${
              isDark ? 'text-amber-100/70' : 'text-stone-500'
            }`}
          >
            Pantau pesanan katering, kirim invoice WhatsApp ke pemesan, serta perbarui status pengerjaan secara berkala.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            to="/admin/orders/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-amber-950/20 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Pesanan Manual / Offline</span>
          </Link>

          <Link
            to="/admin/orders/recap"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-red-950/20 transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Tarik Rekap Bulanan (Excel)</span>
          </Link>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer ${
              isDark
                ? 'border-[#60241E] bg-[#240E0C] text-stone-200 hover:bg-[#2D120F]'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <RefreshCw
              size={14}
              className={isFetching ? 'animate-spin' : ''}
            />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className={`rounded-2xl border p-5 shadow-2xs ${
            isDark
              ? 'border-[#60241E]/80 bg-[#240E0C]'
              : 'border-stone-200/90 bg-white'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
              }`}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <p
                className={`text-xs font-medium ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Total Pesanan
              </p>
              <p
                className={`mt-0.5 text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {pagination?.total ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-2xs ${
            isDark
              ? 'border-[#60241E]/80 bg-[#240E0C]'
              : 'border-stone-200/90 bg-white'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Clock size={20} />
            </div>
            <div>
              <p
                className={`text-xs font-medium ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Status Aktif
              </p>
              <p
                className={`mt-0.5 text-sm font-bold capitalize ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {selectedStatus ? selectedStatus : 'Semua Pesanan'}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-2xs ${
            isDark
              ? 'border-[#60241E]/80 bg-[#240E0C]'
              : 'border-stone-200/90 bg-white'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <PackageCheck size={20} />
            </div>
            <div>
              <p
                className={`text-xs font-medium ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Halaman Saat Ini
              </p>
              <p
                className={`mt-0.5 text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {pagination?.current_page ?? 1}{' '}
                <span
                  className={`text-xs font-normal ${
                    isDark ? 'text-amber-200/50' : 'text-stone-400'
                  }`}
                >
                  / {pagination?.last_page ?? 1}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`rounded-2xl border p-4 shadow-2xs space-y-3 ${
          isDark
            ? 'border-[#60241E]/80 bg-[#240E0C]'
            : 'border-stone-200/90 bg-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs (No Emojis!) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: 'Semua', value: '', icon: LayoutGrid },
              { label: 'Menunggu', value: 'pending', icon: Clock },
              { label: 'Diproses', value: 'processing', icon: ChefHat },
              { label: 'Selesai', value: 'completed', icon: CheckCircle2 },
              { label: 'Dibatalkan', value: 'cancelled', icon: XCircle },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isActive = selectedStatus === tab.value

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(tab.value as OrderStatus | '')
                    setPage(1)
                  }}
                  className={`inline-flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-[#95271D] to-[#60241E] text-white shadow-md border border-[#F59E0B]/30'
                        : 'bg-stone-900 text-white shadow-2xs'
                      : isDark
                        ? 'bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] border border-[#60241E]'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-950 border border-stone-200/80'
                  }`}
                >
                  <TabIcon
                    size={13}
                    className={
                      isActive
                        ? 'text-white'
                        : isDark
                          ? 'text-amber-200/60'
                          : 'text-stone-400'
                    }
                  />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-amber-200/60' : 'text-stone-400'
              }`}
            />
            <input
              type="text"
              placeholder="Cari kode order / nama / WA..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className={`h-10 w-full rounded-xl border pl-9 pr-8 text-xs font-medium outline-none transition ${
                isDark
                  ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30'
                  : 'border-stone-200 bg-stone-50/70 text-stone-900 placeholder:text-stone-400 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600'
              }`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter: Payment Status */}
        <div
          className={`flex flex-wrap items-center gap-1.5 pt-2.5 border-t text-xs ${
            isDark ? 'border-[#60241E]/60' : 'border-stone-100'
          }`}
        >
          <span
            className={`text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1 ${
              isDark ? 'text-amber-200/60' : 'text-stone-400'
            }`}
          >
            <Coins size={12} /> Status Bayar:
          </span>
          {[
            { label: 'Semua Status Bayar', value: '' },
            { label: 'Belum Bayar', value: 'unpaid' },
            { label: 'DP Masuk', value: 'dp' },
            { label: 'Lunas', value: 'paid' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setSelectedPaymentStatus(item.value as PaymentStatus | '')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedPaymentStatus === item.value
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : isDark
                    ? 'bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] border border-[#60241E]'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table & Mobile Cards */}
      {isLoading ? (
        <OrderTableSkeleton isDark={isDark} />
      ) : isError ? (
        <div
          className={`rounded-2xl border p-8 text-center shadow-2xs ${
            isDark
              ? 'border-red-900/60 bg-[#240E0C]'
              : 'border-red-200 bg-white'
          }`}
        >
          <p className="text-sm font-bold text-red-500">Gagal memuat data pesanan.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs ${
              isDark
                ? 'bg-stone-800 text-white hover:bg-stone-700'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <OrderTable
            orders={orders}
            onView={(order) => setSelectedOrder(order)}
            onStatusUpdated={() => refetch()}
          />

          {/* Pagination Controls */}
          {pagination && pagination.last_page > 1 && (
            <div
              className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              <p>
                Menampilkan{' '}
                <span
                  className={`font-bold ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {pagination.from ?? 0}
                </span>{' '}
                -{' '}
                <span
                  className={`font-bold ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {pagination.to ?? 0}
                </span>{' '}
                dari{' '}
                <span
                  className={`font-bold ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {pagination.total}
                </span>{' '}
                pesanan
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!pagination.prev_page_url}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40 cursor-pointer ${
                    isDark
                      ? 'border-[#60241E] text-stone-300 hover:bg-[#2D120F]'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>

                <span
                  className={`px-3 font-semibold ${
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  }`}
                >
                  {pagination.current_page} / {pagination.last_page}
                </span>

                <button
                  type="button"
                  disabled={!pagination.next_page_url}
                  onClick={() => setPage((p) => p + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40 cursor-pointer ${
                    isDark
                      ? 'border-[#60241E] text-stone-300 hover:bg-[#2D120F]'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================
          ORDER DETAIL & INVOICE MODAL
      ====================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs transition-opacity">
          <div
            className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${
              isDark
                ? 'border-[#60241E] bg-[#240E0C] text-white shadow-black/80'
                : 'border-stone-200 bg-white text-stone-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${
                isDark ? 'border-[#60241E]/60 bg-[#1C0B09]' : 'border-stone-100 bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${
                    isDark ? 'bg-[#2D120F] text-amber-400 border border-[#60241E]' : 'bg-stone-900 text-white'
                  }`}
                >
                  <Receipt size={18} />
                </div>
                <div>
                  <h3
                    className={`font-bold text-base ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    Detail Pesanan: {selectedOrder.order_code}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-amber-200/50' : 'text-stone-400'}`}>
                    Masuk pada {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={`rounded-lg p-1.5 transition ${
                  isDark
                    ? 'text-stone-400 hover:bg-[#2D120F] hover:text-stone-200'
                    : 'text-stone-400 hover:bg-stone-200 hover:text-stone-700'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Status Row & Changer */}
              <div
                className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isDark ? 'border-[#60241E]/80 bg-[#1C0B09]/70' : 'border-stone-200 bg-stone-50/70'
                }`}
              >
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-amber-200/60' : 'text-stone-400'
                    }`}
                  >
                    Status Pesanan Saat Ini
                  </p>
                  <div className="mt-1">
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                {/* Status Switch Buttons */}
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-amber-200/60' : 'text-stone-400'
                    }`}
                  >
                    Ubah Status Cepat:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { status: 'pending', label: 'Menunggu' },
                      { status: 'processing', label: 'Diproses Dapur' },
                      { status: 'completed', label: 'Selesai' },
                      { status: 'cancelled', label: 'Dibatalkan' },
                    ].map((st) => (
                      <button
                        key={st.status}
                        type="button"
                        disabled={updatingStatus || selectedOrder.status === st.status}
                        onClick={() =>
                          handleUpdateStatus(st.status as OrderStatus)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          selectedOrder.status === st.status
                            ? isDark
                              ? 'bg-gradient-to-r from-[#95271D] to-[#60241E] text-white shadow-md border border-[#F59E0B]/30'
                              : 'bg-stone-900 text-white shadow-2xs'
                            : isDark
                              ? 'bg-[#240E0C] border border-[#60241E] text-stone-300 hover:bg-[#2D120F]'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        } disabled:opacity-50`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial & Payment Tracking Card */}
              <div
                className={`rounded-2xl border p-4.5 shadow-2xs space-y-4 ${
                  isDark ? 'border-[#60241E]/80 bg-[#1C0B09]' : 'border-stone-200 bg-white'
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 ${
                    isDark ? 'border-[#60241E]/60' : 'border-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <Coins size={16} />
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDark ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        Catatan Keuangan & Pembayaran
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-amber-200/50' : 'text-stone-400'}`}>
                        Status verifikasi transfer dari pelanggan via WA
                      </p>
                    </div>
                  </div>

                  <PaymentStatusBadge
                    status={selectedOrder.payment_status}
                    paidAmount={selectedOrder.paid_amount}
                    paymentMethod={selectedOrder.payment_method}
                  />
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() => handleUpdatePayment('paid', Number(selectedOrder.total))}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    <span>Tandai Lunas ({formatRupiah(selectedOrder.total)})</span>
                  </button>

                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() => handleUpdatePayment('dp', Math.round(Number(selectedOrder.total) * 0.5))}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-600 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Coins size={13} />
                    <span>Catat DP 50% ({formatRupiah(Math.round(Number(selectedOrder.total) * 0.5))})</span>
                  </button>

                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() => handleUpdatePayment('unpaid', 0)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold active:scale-95 transition disabled:opacity-50 cursor-pointer ${
                      isDark
                        ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Clock size={13} />
                    <span>Reset Belum Bayar</span>
                  </button>
                </div>

                {/* Detailed Payment Form */}
                <div className="grid gap-3 sm:grid-cols-3 pt-1 text-xs">
                  {/* Status Dropdown */}
                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-amber-200/60' : 'text-stone-500'
                      }`}
                    >
                      Status Bayar
                    </label>
                    <select
                      value={paymentForm.payment_status}
                      onChange={(e) => {
                        const newStatus = e.target.value as PaymentStatus
                        setPaymentForm((prev) => ({
                          ...prev,
                          payment_status: newStatus,
                          paid_amount:
                            newStatus === 'paid'
                              ? String(selectedOrder.total)
                              : newStatus === 'unpaid'
                                ? '0'
                                : prev.paid_amount,
                        }))
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${
                        isDark
                          ? 'border-[#60241E] bg-[#240E0C] text-white focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-stone-50/80 text-stone-900 focus:border-red-600 focus:bg-white'
                      }`}
                    >
                      <option value="unpaid">Belum Bayar</option>
                      <option value="dp">DP Masuk</option>
                      <option value="paid">Lunas Penuh</option>
                    </select>
                  </div>

                  {/* Nominal Terbayar */}
                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-amber-200/60' : 'text-stone-500'
                      }`}
                    >
                      Nominal Terbayar (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={paymentForm.paid_amount}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paid_amount: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold outline-none ${
                        isDark
                          ? 'border-[#60241E] bg-[#240E0C] text-white focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-stone-50/80 text-stone-900 focus:border-red-600 focus:bg-white'
                      }`}
                    />
                  </div>

                  {/* Metode Pembayaran */}
                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-amber-200/60' : 'text-stone-500'
                      }`}
                    >
                      Metode Transfer
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${
                        isDark
                          ? 'border-[#60241E] bg-[#240E0C] text-white focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-stone-50/80 text-stone-900 focus:border-red-600 focus:bg-white'
                      }`}
                    >
                      <option value="Transfer BCA">Transfer BCA</option>
                      <option value="Transfer Mandiri">Transfer Mandiri</option>
                      <option value="Transfer BRI">Transfer BRI</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Tunai / COD">Tunai / COD</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Sisa Tagihan & Notes */}
                <div className="grid gap-3 sm:grid-cols-3 pt-1 text-xs items-end">
                  <div className="sm:col-span-2">
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-amber-200/60' : 'text-stone-500'
                      }`}
                    >
                      Catatan Pembayaran / Pengirim
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: DP 50% via BCA a.n. Ibu Siti"
                      value={paymentForm.payment_note}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_note: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium outline-none ${
                        isDark
                          ? 'border-[#60241E] bg-[#240E0C] text-white placeholder:text-stone-500 focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-red-600 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <div
                      className={`flex-1 rounded-xl p-2 text-center ${
                        isDark ? 'bg-[#240E0C] border border-[#60241E]' : 'bg-stone-100'
                      }`}
                    >
                      <span className={`text-[10px] block ${isDark ? 'text-amber-200/50' : 'text-stone-400'}`}>
                        Sisa Tagihan
                      </span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          isDark ? 'text-white' : 'text-stone-800'
                        }`}
                      >
                        {formatRupiah(Math.max(0, Number(selectedOrder.total) - Number(paymentForm.paid_amount || 0)))}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={updatingPayment}
                      onClick={() => handleUpdatePayment()}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-red-700 transition active:scale-95 disabled:opacity-50 h-[38px] cursor-pointer"
                    >
                      {updatingPayment ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>Simpan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer & Event Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-xl border p-4 space-y-2 ${
                    isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-amber-200/60' : 'text-stone-400'
                    }`}
                  >
                    Informasi Pemesan
                  </p>
                  <div className="space-y-1">
                    <p
                      className={`font-bold text-sm flex items-center gap-1.5 ${
                        isDark ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      <User size={15} className={isDark ? 'text-amber-200/60' : 'text-stone-400'} />
                      {selectedOrder.customers_name}
                    </p>
                    <a
                      href={`https://wa.me/${selectedOrder.customers_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1.5"
                    >
                      <MessageCircle size={14} />
                      {selectedOrder.customers_phone}
                    </a>
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-4 space-y-2 ${
                    isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-amber-200/60' : 'text-stone-400'
                    }`}
                  >
                    Jadwal & Lokasi Acara
                  </p>
                  <p
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    <Calendar size={14} className={isDark ? 'text-amber-200/60' : 'text-stone-400'} />
                    {formatDate(selectedOrder.event_date)}{' '}
                    {selectedOrder.event_time && `(${selectedOrder.event_time})`}
                  </p>
                  <p
                    className={`text-xs flex items-start gap-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    <MapPin size={14} className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-200/60' : 'text-stone-400'}`} />
                    <span>{selectedOrder.delivery_address || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div
                  className={`rounded-xl border p-3.5 text-xs ${
                    isDark
                      ? 'border-amber-900/60 bg-amber-950/30 text-amber-200'
                      : 'border-amber-200 bg-amber-50/60 text-amber-900'
                  }`}
                >
                  <span className="font-bold">Catatan Pemesan:</span> {selectedOrder.notes}
                </div>
              )}

              {/* Menu Items Table */}
              <div
                className={`rounded-xl border overflow-hidden ${
                  isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200'
                }`}
              >
                <div
                  className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-[#240E0C] border-[#60241E] text-amber-200/70'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  Rincian Item Menu Katering
                </div>
                <div className={`divide-y p-2 ${isDark ? 'divide-[#60241E]/50' : 'divide-stone-100'}`}>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 text-xs"
                      >
                        <div>
                          <p
                            className={`font-semibold ${
                              isDark ? 'text-stone-100' : 'text-stone-900'
                            }`}
                          >
                            {item.item_name}
                          </p>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {item.addons.map((a, idx) => (
                                <div
                                  key={idx}
                                  className={`rounded-md px-2 py-1 text-[11px] font-medium border inline-block mr-1.5 ${
                                    isDark
                                      ? 'bg-[#240E0C] border-[#60241E] text-stone-300'
                                      : 'bg-stone-50 border-stone-200 text-stone-700'
                                  }`}
                                >
                                  <span
                                    className={`font-bold ${
                                      isDark ? 'text-amber-300' : 'text-stone-900'
                                    }`}
                                  >
                                    + {a.addon_name}
                                  </span>{' '}
                                  <span
                                    className={`font-mono ${
                                      isDark ? 'text-stone-400' : 'text-stone-500'
                                    }`}
                                  >
                                    (+{formatRupiah(a.price)} × {a.quantity || item.quantity} = +{formatRupiah(a.subtotal || String(Number(a.price) * item.quantity))})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <p
                            className={`font-mono text-[11px] mt-1 ${
                              isDark ? 'text-stone-500' : 'text-stone-400'
                            }`}
                          >
                            Paket dasar: {formatRupiah(item.price)} x {item.quantity} porsi
                          </p>
                        </div>
                        <p
                          className={`font-bold font-mono text-sm ${
                            isDark ? 'text-white' : 'text-stone-950'
                          }`}
                        >
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`p-4 text-center text-xs ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}
                    >
                      Item pesanan tidak tersedia.
                    </div>
                  )}
                </div>

                {/* Cost Breakdown Footer */}
                <div
                  className={`p-4 border-t space-y-1 text-xs ${
                    isDark ? 'bg-[#240E0C] border-[#60241E]' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div
                    className={`flex justify-between ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    <span>Subtotal Menu</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  <div
                    className={`flex justify-between ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    <span>Ongkos Kirim</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.delivery_fee)}</span>
                  </div>
                  <div
                    className={`flex justify-between text-sm font-bold pt-2 border-t ${
                      isDark
                        ? 'text-white border-[#60241E]'
                        : 'text-stone-950 border-stone-200'
                    }`}
                  >
                    <span>Total Tagihan Invoice</span>
                    <span className="text-red-500 font-mono">
                      {formatRupiah(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              className={`border-t px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                isDark ? 'border-[#60241E]/60 bg-[#1C0B09]' : 'border-stone-100 bg-stone-50'
              }`}
            >
              <p className={`text-xs ${isDark ? 'text-amber-200/50' : 'text-stone-400'}`}>
                Kirimkan invoice resmi langsung ke nomor WhatsApp pemesan.
              </p>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'border-[#60241E] text-stone-300 hover:bg-[#240E0C]'
                      : 'border-stone-200 text-stone-700 hover:bg-white'
                  }`}
                >
                  Tutup
                </button>

                {selectedOrder.status === 'completed' && (
                  <a
                    href={getWhatsAppTestimonialUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs hover:bg-amber-600 transition"
                    title="Kirim link ulasan ke nomor WhatsApp pemesan"
                  >
                    <Star size={14} className="fill-white" />
                    <span>Kirim Link Testimoni (WA)</span>
                  </a>
                )}

                <a
                  href={getWhatsAppInvoiceUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
                >
                  <Receipt size={14} />
                  <span>Kirim Invoice WA</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
