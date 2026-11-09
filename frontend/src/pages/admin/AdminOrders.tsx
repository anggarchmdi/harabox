import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock,
  Coins,
  FileSpreadsheet,
  LayoutGrid,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Trash2,
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
import { dashboardService } from '../../services/dashboard.service'
import { useThemeStore } from '../../stores/theme.store'
import OrderTable, {
  getWhatsAppInvoiceUrl,
  getWhatsAppTestimonialUrl,
} from '../../components/admin/orders/OrderTable'
import PrintOrderModal from '../../components/admin/orders/PrintOrderModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import OrderStatusBadge from '../../components/admin/orders/OrderStatusBadge'
import PaymentStatusBadge from '../../components/admin/orders/PaymentStatusBadge'
import PaymentProofSection from '../../components/admin/orders/PaymentProofSection'
import PageLoader from '../../components/ui/PageLoader'
import Pagination from '../../components/ui/Pagination'
import useDebounce from '../../hooks/useDebounce'

function formatDate(date: string) {
  if (!date) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return date
  }
}

function formatRupiah(value: string | number) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function OrderTableSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-xs ${
        isDark ? 'border-[#382321] bg-[#18100F]' : 'border-stone-200/90 bg-white'
      }`}
    >
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead
            className={`border-b text-[11px] font-bold uppercase tracking-wider ${
              isDark
                ? 'border-[#382321] bg-[#140D0C] text-stone-400'
                : 'border-stone-200/90 bg-[#FAF8F5] text-stone-500'
            }`}
          >
            <tr>
              <th className="px-5 py-3.5">ID & Waktu Pesan</th>
              <th className="px-5 py-3.5">Pemesan</th>
              <th className="px-5 py-3.5">Menu & Rincian</th>
              <th className="px-5 py-3.5">Jadwal Acara & Lokasi</th>
              <th className="px-5 py-3.5">Total Tagihan</th>
              <th className="px-5 py-3.5">Status Pesanan</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#2A1816]' : 'divide-stone-100'}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-24 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-16 rounded-md ${isDark ? 'bg-[#201312]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-28 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-20 rounded-md ${isDark ? 'bg-[#201312]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-36 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-24 rounded-md ${isDark ? 'bg-[#201312]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-24 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-2.5 w-32 rounded-md ${isDark ? 'bg-[#201312]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-3.5 w-24 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                  <div className={`mt-2 h-4 w-16 rounded-full ${isDark ? 'bg-[#261715]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-6 w-24 rounded-full ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                    <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                    <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Skeletons */}
      <div className="md:hidden p-3 divide-y divide-stone-100 dark:divide-[#2A1816] space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pt-3 first:pt-0 animate-pulse space-y-2.5">
            <div className="flex items-center justify-between">
              <div className={`h-4 w-28 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
              <div className={`h-5 w-20 rounded-full ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
            </div>
            <div className={`h-3.5 w-40 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
            <div className={`h-3 w-32 rounded-md ${isDark ? 'bg-[#201312]' : 'bg-stone-100'}`} />
            <div className="flex items-center justify-between pt-2">
              <div className={`h-4 w-24 rounded-md ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
              <div className="flex gap-1.5">
                <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
                <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#261715]' : 'bg-stone-200'}`} />
              </div>
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
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [isDeletingOrder, setIsDeletingOrder] = useState(false)

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
    payment_method: 'Transfer BSI',
    payment_note: '',
  })

  useEffect(() => {
    if (selectedOrder) {
      setPaymentForm({
        payment_status: selectedOrder.payment_status || 'unpaid',
        paid_amount: String(selectedOrder.paid_amount || '0'),
        payment_method: selectedOrder.payment_method || 'Transfer BSI',
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
        per_page: 10,
        status: selectedStatus || undefined,
        payment_status: selectedPaymentStatus || undefined,
        search: debouncedSearch.trim() || undefined,
      }),
  })

  // Polling data dashboard untuk metrik operasional terpadu (cached di React Query)
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.get,
    staleTime: 30_000,
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

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return

    try {
      setIsDeletingOrder(true)
      await ordersService.delete(orderToDelete.id)
      toast.success(`Pesanan ${orderToDelete.order_code} berhasil dihapus.`)

      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null)
      }
      setOrderToDelete(null)

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-today-capacity'] })
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin-order-recap'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pesanan.')
    } finally {
      setIsDeletingOrder(false)
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
        payment_method: updated.payment_method || 'Transfer BSI',
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

  const pendingCount =
    dashboardData?.summary?.pending_orders ??
    orders.filter((o) => o.status === 'pending').length

  const todayOrdersCount = dashboardData?.summary?.orders_today ?? 0

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        text="Memuat Pesanan Katering..."
        subtext="Sinkronisasi status dan rincian pesanan pelanggan"
        minDuration={400}
      />
      <div
        className={`min-h-screen space-y-6 sm:space-y-7 p-4 sm:p-6 lg:p-8 pb-24 transition-colors duration-300 ${
          isDark ? 'text-stone-100' : 'text-stone-900'
        }`}
      >
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Manajemen Katering • Operasional
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                Pesanan Masuk
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-[#241715] text-stone-300 border-[#3D2522]'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {pagination?.total ?? orders.length} pesanan
              </span>
            </div>

            <p
              className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              Pantau seluruh alur transaksi katering, koordinasikan produksi dapur, dan kirim dokumen invoice resmi pelanggan.
            </p>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              to="/admin/orders/create"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#95271D] to-[#7D1E16] hover:from-[#A82D22] hover:to-[#8E2219] text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-red-950/20 active:scale-95 transition cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>+ Buat Pesanan</span>
            </Link>

            <Link
              to="/admin/orders/recap"
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
                isDark
                  ? 'border-[#3D2522] bg-[#241715] text-stone-200 hover:bg-[#2D1C1A]'
                  : 'border-stone-200/90 bg-white text-stone-800 hover:bg-stone-50'
              }`}
            >
              <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Rekap Pesanan</span>
            </Link>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border p-2 sm:px-3 sm:py-2 text-xs font-semibold shadow-2xs transition disabled:opacity-50 active:scale-95 cursor-pointer ${
                isDark
                  ? 'border-[#3D2522] bg-[#241715] text-stone-300 hover:bg-[#2D1C1A]'
                  : 'border-stone-200/90 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Segarkan data pesanan"
            >
              <RefreshCw
                size={14}
                className={isFetching ? 'animate-spin text-amber-500' : ''}
              />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Summary Cards */}
        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Card 1: Total Orders */}
          <div
            onClick={() => {
              setSelectedStatus('')
              setSelectedPaymentStatus('')
              setSearch('')
              setPage(1)
            }}
            className={`rounded-2xl border p-4.5 shadow-xs transition-all cursor-pointer group ${
              isDark
                ? 'border-[#382321] bg-[#1C1312] hover:border-amber-600/40'
                : 'border-stone-200/90 bg-white hover:border-amber-600/40'
            }`}
            title="Klik untuk tampilkan semua pesanan"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isDark
                      ? 'bg-[#291A18] text-amber-400 group-hover:bg-[#34221F]'
                      : 'bg-stone-100 text-stone-700 group-hover:bg-amber-50 group-hover:text-amber-700'
                  }`}
                >
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Total Pesanan Masuk
                  </p>
                  <p className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {pagination?.total ?? orders.length}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-[#261513] text-stone-400' : 'bg-stone-100 text-stone-500'}`}>
                Semua
              </span>
            </div>
          </div>

          {/* Card 2: Menunggu Konfirmasi */}
          <div
            onClick={() => {
              setSelectedStatus('pending')
              setPage(1)
            }}
            className={`rounded-2xl border p-4.5 shadow-xs transition-all cursor-pointer group ${
              selectedStatus === 'pending'
                ? isDark
                  ? 'border-amber-600/70 bg-[#241715] ring-1 ring-amber-500/20'
                  : 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/30'
                : isDark
                  ? 'border-[#382321] bg-[#1C1312] hover:border-amber-600/40'
                  : 'border-stone-200/90 bg-white hover:border-amber-600/40'
            }`}
            title="Klik untuk filter pesanan yang menunggu konfirmasi"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isDark
                      ? 'bg-amber-950/40 text-amber-400 group-hover:bg-amber-900/40'
                      : 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                  }`}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Perlu Konfirmasi
                  </p>
                  <p className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    {pendingCount}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                pendingCount > 0
                  ? 'bg-amber-500 text-white font-bold animate-pulse'
                  : isDark ? 'bg-[#261513] text-stone-400' : 'bg-stone-100 text-stone-500'
              }`}>
                Menunggu
              </span>
            </div>
          </div>

          {/* Card 3: Pesanan Hari Ini */}
          <div
            className={`rounded-2xl border p-4.5 shadow-xs transition-all ${
              isDark
                ? 'border-[#382321] bg-[#1C1312]'
                : 'border-stone-200/90 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isDark
                      ? 'bg-emerald-950/40 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <Calendar size={18} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Pesanan Hari Ini
                  </p>
                  <p className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    {todayOrdersCount}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                Hari Ini
              </span>
            </div>
          </div>
        </div>

        {/* Unified Control & Filter Toolbar */}
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-3 transition-all ${
            isDark
              ? 'border-[#382321] bg-[#18100F]'
              : 'border-stone-200/90 bg-white'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Tabs Segmented Control */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { label: 'Semua', value: '', icon: LayoutGrid },
                { label: 'Menunggu', value: 'pending', icon: Clock, count: pendingCount },
                { label: 'Diproses Dapur', value: 'processing', icon: ChefHat },
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
                    className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-gradient-to-r from-[#95271D] to-[#7D1E16] text-white shadow-sm border border-[#F59E0B]/30'
                          : 'bg-stone-900 text-white shadow-xs'
                        : isDark
                          ? 'text-stone-300 hover:bg-[#251715] hover:text-white'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <TabIcon
                      size={13}
                      className={
                        isActive
                          ? 'text-white'
                          : isDark
                            ? 'text-stone-400'
                            : 'text-stone-400'
                      }
                    />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          isActive
                            ? 'bg-amber-400 text-stone-950'
                            : isDark
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search Input Box */}
            <div className="relative w-full lg:w-80">
              <Search
                size={14}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-stone-400' : 'text-stone-400'
                }`}
              />
              <input
                type="text"
                placeholder="Cari kode order, nama pemesan, no. WA..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className={`h-9 w-full rounded-xl border pl-9 pr-8 text-xs font-medium outline-none transition ${
                  isDark
                    ? 'border-[#382321] bg-[#1F1413] text-white placeholder:text-stone-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/20'
                    : 'border-stone-200 bg-stone-50/70 text-stone-900 placeholder:text-stone-400 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600/20'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filter: Payment Status & Reset Button */}
          <div
            className={`flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t text-xs ${
              isDark ? 'border-[#2D1B19]' : 'border-stone-100'
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-400'
                }`}
              >
                <Coins size={12} /> Status Bayar:
              </span>
              {[
                { label: 'Semua', value: '' },
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedPaymentStatus === item.value
                      ? isDark
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 font-semibold'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold shadow-2xs'
                      : isDark
                        ? 'bg-[#1F1413] text-stone-300 hover:bg-[#2A1B19] border border-[#382321]'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Quick Clear Filter Button */}
            {(Boolean(selectedStatus) || Boolean(selectedPaymentStatus) || Boolean(search)) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('')
                  setSelectedPaymentStatus('')
                  setSearch('')
                  setPage(1)
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark
                    ? 'bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 border border-rose-800/40'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
                title="Reset seluruh filter pencarian"
              >
                <X size={12} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Orders Table & Mobile Cards */}
        {isLoading ? (
          <OrderTableSkeleton isDark={isDark} />
        ) : isError ? (
          <div
            className={`rounded-2xl border p-8 text-center shadow-xs ${
              isDark
                ? 'border-red-900/60 bg-[#1C1211]'
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
              onPrint={(order) => setPrintingOrder(order)}
              onDelete={setOrderToDelete}
              onStatusUpdated={() => refetch()}
            />

            {/* Pagination Controls */}
            {pagination && (
              <Pagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                total={pagination.total}
                onPageChange={setPage}
                itemName="pesanan masuk"
                className="rounded-2xl mt-4"
              />
            )}
          </>
        )}

      {/* =====================================================
          ORDER DETAIL & INVOICE MODAL
      ====================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border shadow-2xl transition-all ${
              isDark
                ? 'border-[#382321] bg-[#18100F] text-stone-100 shadow-black/80'
                : 'border-stone-200/90 bg-white text-stone-900 shadow-stone-900/10'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4 shrink-0 ${
                isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/80 bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
                    isDark
                      ? 'bg-gradient-to-br from-[#95271D] to-[#60241E] text-amber-300 shadow-xs'
                      : 'bg-stone-900 text-white shadow-xs'
                  }`}
                >
                  <Receipt size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-mono font-bold text-sm sm:text-base tracking-tight truncate ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}
                  >
                    Detail: {selectedOrder.order_code}
                  </h3>
                  <p className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Masuk pada {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to={`/admin/orders/${selectedOrder.id}/edit`}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                    isDark
                      ? 'border-[#382321] bg-[#1E1413] text-stone-200 hover:bg-[#281A18] hover:text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                  title="Buka halaman edit lengkap pesanan"
                >
                  <Pencil size={13} className="text-amber-500" />
                  <span className="hidden sm:inline">Edit Pesanan</span>
                  <span className="sm:hidden">Edit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                    isDark
                      ? 'border-rose-800/40 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                  title="Hapus pesanan ini secara permanen"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Hapus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className={`rounded-xl p-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
                    isDark
                      ? 'text-stone-400 hover:bg-[#241715] hover:text-stone-200'
                      : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
                  }`}
                  title="Tutup jendela rincian"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain">
              {/* Status Row & Changer */}
              <div
                className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-[#FAF8F5]'
                }`}
              >
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-400'
                    }`}
                  >
                    Status Pesanan Saat Ini
                  </p>
                  <div>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                {/* Status Switch Buttons */}
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-400'
                    }`}
                  >
                    Ubah Status Cepat:
                  </p>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer text-center active:scale-95 ${
                          selectedOrder.status === st.status
                            ? isDark
                              ? 'bg-gradient-to-r from-[#95271D] to-[#7D1E16] text-white shadow-xs border border-[#F59E0B]/30'
                              : 'bg-stone-900 text-white shadow-xs'
                            : isDark
                              ? 'bg-[#1E1413] border border-[#382321] text-stone-300 hover:bg-[#281A18] hover:text-white'
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
                className={`rounded-2xl border p-3.5 sm:p-5 shadow-2xs space-y-4 ${
                  isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-[#FAF8F5]'
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b pb-3.5 ${
                    isDark ? 'border-[#2D1B19]' : 'border-stone-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                      <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
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

                {/* Quick Action Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() => handleUpdatePayment('paid', Number(selectedOrder.total))}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs active:scale-95 transition disabled:opacity-50 cursor-pointer text-center"
                  >
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span className="truncate">Tandai Lunas ({formatRupiah(selectedOrder.total)})</span>
                  </button>

                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() => handleUpdatePayment('dp', Math.round(Number(selectedOrder.total) * 0.5))}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs active:scale-95 transition disabled:opacity-50 cursor-pointer text-center"
                  >
                    <Coins size={13} className="shrink-0" />
                    <span className="truncate">Catat DP 50% ({formatRupiah(Math.round(Number(selectedOrder.total) * 0.5))})</span>
                  </button>

                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() => handleUpdatePayment('unpaid', 0)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold active:scale-95 transition disabled:opacity-50 cursor-pointer text-center ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:bg-[#281A18] hover:text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Clock size={13} className="shrink-0" />
                    <span className="truncate">Reset Belum Bayar</span>
                  </button>
                </div>

                {/* Detailed Payment Form */}
                <div className="grid gap-3 sm:grid-cols-3 pt-1 text-xs">
                  {/* Status Dropdown */}
                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-stone-300' : 'text-stone-500'
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
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition ${
                        isDark
                          ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-white text-stone-900 focus:border-red-600'
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
                        isDark ? 'text-stone-300' : 'text-stone-500'
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
                      className={`w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold outline-none transition ${
                        isDark
                          ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-white text-stone-900 focus:border-red-600'
                      }`}
                    />
                  </div>

                  {/* Metode Pembayaran */}
                  <div>
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      Metode Transfer
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition ${
                        isDark
                          ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-white text-stone-900 focus:border-red-600'
                      }`}
                    >
                      <option value="Transfer BSI">Transfer BSI</option>
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
                        isDark ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      Catatan Pembayaran / Pengirim
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: DP 50% via BSI a.n. Ibu Siti"
                      value={paymentForm.payment_note}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_note: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium outline-none transition ${
                        isDark
                          ? 'border-[#382321] bg-[#1E1413] text-white placeholder:text-stone-500 focus:border-[#F59E0B]'
                          : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-red-600'
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <div
                      className={`flex-1 rounded-xl p-2 text-center border ${
                        isDark ? 'bg-[#1E1413] border-[#382321]' : 'bg-white border-stone-200'
                      }`}
                    >
                      <span className={`text-[10px] block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Sisa Tagihan
                      </span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          isDark ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {formatRupiah(Math.max(0, Number(selectedOrder.total) - Number(paymentForm.paid_amount || 0)))}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={updatingPayment}
                      onClick={() => handleUpdatePayment()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#95271D] to-[#7D1E16] hover:from-[#A82D22] hover:to-[#8E2219] px-4 py-2 text-xs font-bold text-white shadow-2xs transition active:scale-95 disabled:opacity-50 h-[38px] cursor-pointer"
                    >
                      {updatingPayment ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>Simpan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bukti Transfer (Google Drive) */}
              <PaymentProofSection
                order={selectedOrder}
                isDark={isDark}
                onProofUpdated={(updatedProofs) => {
                  setSelectedOrder((prev) => (prev ? { ...prev, payment_proofs: updatedProofs } : null))
                  queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
                }}
              />

              {/* Customer & Event Details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div
                  className={`rounded-2xl border p-4 space-y-2 ${
                    isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-[#FAF8F5]'
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
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
                      <User size={15} className={isDark ? 'text-amber-400' : 'text-stone-400'} />
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
                  className={`rounded-2xl border p-4 space-y-2 ${
                    isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-[#FAF8F5]'
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    Jadwal & Lokasi Acara
                  </p>
                  <p
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    <Calendar size={14} className={isDark ? 'text-amber-400' : 'text-stone-400'} />
                    {formatDate(selectedOrder.event_date)}{' '}
                    {selectedOrder.event_time && `(${selectedOrder.event_time})`}
                  </p>
                  <p
                    className={`text-xs flex items-start gap-1.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    <MapPin size={14} className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-stone-400'}`} />
                    <span className="break-words">{selectedOrder.delivery_address || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs ${
                    isDark
                      ? 'border-amber-800/40 bg-amber-950/20 text-amber-200'
                      : 'border-amber-200 bg-amber-50/60 text-amber-900'
                  }`}
                >
                  <span className="font-bold">Catatan Pemesan:</span> {selectedOrder.notes}
                </div>
              )}

              {/* Menu Items Table */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-white'
                }`}
              >
                <div
                  className={`px-4 py-2.5 border-b text-xs font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-[#1A1110] border-[#382321] text-stone-300'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  Rincian Item Menu Katering
                </div>
                <div className={`divide-y ${isDark ? 'divide-[#281A18]' : 'divide-stone-100'}`}>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-3">
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
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium border inline-block mr-1.5 ${
                                    isDark
                                      ? 'bg-[#1E1413] border-[#382321] text-stone-300'
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
                              isDark ? 'text-stone-400' : 'text-stone-400'
                            }`}
                          >
                            Paket dasar: {formatRupiah(item.price)} x {item.quantity} porsi
                          </p>
                        </div>
                        <p
                          className={`font-bold font-mono text-sm shrink-0 ${
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
                  className={`p-4 border-t space-y-1.5 text-xs ${
                    isDark ? 'bg-[#1A1110] border-[#382321]' : 'bg-stone-50 border-stone-200'
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
                        ? 'text-white border-[#382321]'
                        : 'text-stone-950 border-stone-200'
                    }`}
                  >
                    <span>Total Tagihan Invoice</span>
                    <span className="text-[#95271D] dark:text-red-400 font-mono text-base font-extrabold">
                      {formatRupiah(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              className={`border-t px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 ${
                isDark ? 'border-[#382321] bg-[#140D0C]' : 'border-stone-200/90 bg-[#FAF8F5]'
              }`}
            >
              <p className={`text-xs hidden sm:block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Kirimkan invoice resmi langsung ke nomor WhatsApp pemesan.
              </p>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer text-center justify-center ${
                    isDark
                      ? 'border-[#382321] bg-[#1E1413] text-stone-200 hover:bg-[#281A18] hover:text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  Tutup
                </button>

                {selectedOrder.status === 'completed' && (
                  <a
                    href={getWhatsAppTestimonialUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition text-center"
                    title="Kirim link ulasan ke nomor WhatsApp pemesan"
                  >
                    <Star size={14} className="fill-white shrink-0" />
                    <span className="truncate">Kirim Testimoni</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPrintingOrder(selectedOrder)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#95271D] to-[#7D1E16] hover:from-[#A82D22] hover:to-[#8E2219] text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer text-center"
                  title="Cetak Slip Dapur / Invoice Resmi"
                >
                  <Printer size={14} className="shrink-0" />
                  <span className="truncate">Cetak Nota</span>
                </button>

                <a
                  href={getWhatsAppInvoiceUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition text-center ${
                    selectedOrder.status !== 'completed' ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <Receipt size={14} className="shrink-0" />
                  <span className="truncate">Kirim Invoice WA</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Order Modal (Slip Dapur, Invoice Resmi) */}
      <PrintOrderModal
        order={printingOrder}
        isOpen={!!printingOrder}
        onClose={() => setPrintingOrder(null)}
      />

      {/* Delete Order Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteOrder}
        title="Hapus Pesanan"
        itemName={orderToDelete?.order_code || ''}
        itemType="pesanan"
        expectedConfirmation="HAPUS"
        description={
          orderToDelete ? (
            <>
              Apakah Anda yakin ingin menghapus pesanan{' '}
              <strong className="text-amber-500 font-mono">{orderToDelete.order_code}</strong> atas nama{' '}
              <strong>{orderToDelete.customers_name}</strong>? Seluruh data rincian menu, add-on, dan riwayat pembayaran terkait akan dihapus secara permanen.
            </>
          ) : undefined
        }
        warningDetails="Tindakan ini tidak dapat dibatalkan. File bukti transfer pada server & Google Drive juga akan dibersihkan."
        isLoading={isDeletingOrder}
        confirmButtonText="Hapus Pesanan"
      />
    </div>
    </>
  )
}
