import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  Calendar,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  CircleAlert,
  Clock,
  Edit,
  Eye,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  TrendingUp,
  User,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { dashboardService } from '../../services/dashboard.service'
import { productService } from '../../services/products.service'
import { ordersService } from '../../services/orders.service'
import { settingsService } from '../../services/settings.service'
import { getImageUrl } from '../../utils/image'
import type { DashboardRecentOrder } from '../../types/dashboard'
import type { OrderStatus } from '../../types/orders'
import type { Product } from '../../types/products'
import PageLoader from '../../components/ui/PageLoader'

// Aset lokal untuk smart fallback produk
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

function formatRupiah(value: number | string) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    pending: 'Menunggu',
    confirmed: 'Dikonfirmasi',
    processing: 'Diproses Dapur',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }
  return map[status.toLowerCase()] ?? status
}

export function generateDashboardWhatsAppInvoice(order: DashboardRecentOrder): string {
  const rawPhone = order.customers_phone.replace(/[^0-9]/g, '')
  const phone = rawPhone.startsWith('0')
    ? '62' + rawPhone.slice(1)
    : rawPhone.startsWith('62')
      ? rawPhone
      : '62' + rawPhone

  const itemsList =
    order.items && order.items.length > 0
      ? order.items
          .map(
            (i) =>
              `• ${i.item_name} x ${i.quantity} porsi (Rp ${Number(i.subtotal).toLocaleString('id-ID')})`,
          )
          .join('\n')
      : `• Paket Katering Nasi Box`

  const statusLabel = formatStatus(order.status)

  const message = `*INVOICE PESANAN HARABOX*
===============================
Halo Kak *${order.customers_name}*, terima kasih telah memesan katering di HaraBox!

Berikut adalah rincian invoice resmi pesanan Anda:

*No. Pesanan:* ${order.order_code}
*Tanggal Acara:* ${formatDate(order.event_date)} ${order.event_time ? `(${order.event_time})` : ''}
*Alamat Pengantaran:* ${order.delivery_address || '-'}
-------------------------------
*Rincian Menu:*
${itemsList}

Subtotal: ${formatRupiah(order.subtotal || order.total)}
Ongkos Kirim: ${formatRupiah(order.delivery_fee || 0)}
*TOTAL TAGIHAN: ${formatRupiah(order.total)}*
-------------------------------
*Status Pesanan:* ${statusLabel}
${order.notes ? `*Catatan Khusus:* ${order.notes}\n` : ''}
Silakan melakukan pembayaran ke rekening resmi:
*Bank BCA: 1234567890*
*A/N: HaraBox Catering*

Mohon konfirmasi dan kirimkan bukti transfer melalui pesan ini. Terima kasih!`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()

  // Recent order state & filters
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('')
  const [orderSearch, setOrderSearch] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<DashboardRecentOrder | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false)

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.get,
    refetchInterval: 30_000,
  })

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const { data: todayCapacity } = useQuery({
    queryKey: ['admin-today-capacity', todayStr],
    queryFn: () => settingsService.checkCapacity(todayStr),
    refetchInterval: 30_000,
  })

  const summary = data?.summary

  // Quick inline status updater
  const handleStatusChange = async (id: number, status: OrderStatus, force?: boolean) => {
    try {
      setIsUpdatingStatus(true)
      await ordersService.updateStatus(id, status, force)
      toast.success(`Status pesanan berhasil diubah menjadi "${status}".`)

      // Update selected order in modal if open
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({
          ...selectedOrder,
          status,
        })
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-today-capacity'] }),
      ])
    } catch (err: any) {
      if (err.response?.data?.requires_confirmation) {
        const confirmForce = window.confirm(
          `${err.response.data.message}\n\nApakah Anda ingin tetap memproses pesanan ini (melebihi kuota dapur)?`
        )
        if (confirmForce) {
          await handleStatusChange(id, status, true)
          return
        }
      } else {
        toast.error(err.response?.data?.message || 'Gagal memperbarui status pesanan.')
      }
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Filtered recent orders
  const filteredRecentOrders = useMemo(() => {
    if (!data?.recent_orders) return []

    const query = orderSearch.trim().toLowerCase()

    return data.recent_orders.filter((order) => {
      const matchesStatus = !orderFilterStatus || order.status === orderFilterStatus
      const matchesSearch =
        !query ||
        order.order_code.toLowerCase().includes(query) ||
        order.customers_name.toLowerCase().includes(query) ||
        order.customers_phone.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [data?.recent_orders, orderFilterStatus, orderSearch])

  // 7-day Revenue Chart calculations
  const revenueChart = useMemo(() => {
    const values = data?.last_seven_days.map((item) => item.revenue) ?? []
    const max = Math.max(...values, 1)

    return values.map((value) => Math.max(8, (value / max) * 100))
  }, [data])

  const totalSevenDaysRevenue = useMemo(() => {
    return data?.last_seven_days.reduce((acc, item) => acc + item.revenue, 0) ?? 0
  }, [data])

  if (isError || (!data && !isLoading)) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-3xl border border-red-200 bg-white p-12 text-center shadow-xs">
          <CircleAlert size={48} className="mx-auto text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-stone-900">
            Gagal Memuat Data Dashboard
          </h2>
          <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
            Terjadi masalah saat menghubungkan ke database server HaraBox.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
          >
            <RefreshCw size={14} />
            Coba Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <>
        <PageLoader
          isLoading={isLoading}
          text="Menyiapkan Dashboard Monitoring..."
          subtext="Memuat analitik penjualan, omset, dan antrean pesanan"
          minDuration={400}
        />
        <DashboardSkeleton />
      </>
    )
  }

  const queueTotal = (summary?.pending_orders ?? 0) + (summary?.processing_orders ?? 0)

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Dashboard Monitoring..."
        subtext="Memuat analitik penjualan, omset, dan antrean pesanan"
        minDuration={400}
      />
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 text-stone-900">
      {/* =====================================================
          HEADER & REAL-TIME CONTROLS
      ====================================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Live Monitoring System
            </p>
          </div>

          <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-950">
            Monitoring Operasional Katering
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            Pantau arus pesanan masuk, antrean dapur, pengiriman invoice WhatsApp, serta katalog menu aktif dalam satu kendali.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs transition hover:bg-stone-50 disabled:opacity-50"
            title="Refresh data dashboard"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 shadow-2xs transition hover:bg-stone-50"
          >
            <span>Kelola Pesanan</span>
          </Link>

          <Link
            to="/admin/products/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700"
          >
            <Plus size={14} />
            <span>Tambah Menu</span>
          </Link>
        </div>
      </div>

      {/* =====================================================
          KITCHEN CAPACITY TODAY WIDGET
      ====================================================== */}
      {todayCapacity && (
        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50/90 via-white to-amber-50/60 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                    Kapasitas Dapur Hari Ini
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      todayCapacity.is_closed
                        ? 'bg-zinc-200 text-zinc-700'
                        : todayCapacity.is_full
                        ? 'bg-red-100 text-red-800'
                        : todayCapacity.percentage_booked >= 80
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {todayCapacity.is_closed
                      ? 'Dapur Libur'
                      : todayCapacity.is_full
                      ? 'Kapasitas Penuh (100%)'
                      : `${todayCapacity.remaining_portions} Box Tersisa`}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Pesanan ter-ACC (Diproses/Selesai):{' '}
                  <strong className="text-stone-800 font-bold">
                    {todayCapacity.booked_portions}
                  </strong>{' '}
                  dari maksimal{' '}
                  <strong className="text-stone-800 font-bold">
                    {todayCapacity.max_capacity} Box
                  </strong>
                  {todayCapacity.has_override && todayCapacity.override_note && (
                    <span className="text-orange-700 font-medium">
                      {' '}
                      • {todayCapacity.override_note}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
              <div className="w-36 sm:w-44">
                <div className="flex justify-between text-[11px] font-bold text-stone-600 mb-1">
                  <span>Terpakai</span>
                  <span>{todayCapacity.percentage_booked}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      todayCapacity.is_full
                        ? 'bg-red-500'
                        : todayCapacity.percentage_booked >= 80
                        ? 'bg-amber-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${todayCapacity.percentage_booked}%` }}
                  />
                </div>
              </div>

              <Link
                to="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 shadow-2xs transition active:scale-98"
              >
                <SlidersHorizontal size={14} />
                <span>Atur Kuota</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOP KPI METRIC CARDS
      ====================================================== */}
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Revenue Month & Today */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
              Pendapatan Bulan Ini
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-stone-950 font-mono">
              {formatRupiah(summary?.revenue_this_month ?? 0)}
            </h3>

            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span className="text-stone-500 font-medium">Hari ini:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {formatRupiah(summary?.revenue_today ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Orders Month & Today */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
              Volume Pesanan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart size={18} />
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-stone-950">
              {summary?.orders_this_month ?? 0}{' '}
              <span className="text-sm font-normal text-stone-400">Pesanan</span>
            </h3>

            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span className="text-stone-500 font-medium">Masuk hari ini:</span>
              <span className="font-bold text-blue-700">
                {summary?.orders_today ?? 0} Pesanan
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Antrean Dapur & Konfirmasi (Action Required) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
              Antrean & Konfirmasi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-stone-950 flex items-center gap-2">
              {queueTotal}
              <span className="text-sm font-normal text-stone-400">Pesanan</span>
              {summary?.pending_orders ? (
                <span className="inline-flex rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  Perlu Tindakan
                </span>
              ) : null}
            </h3>

            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span className="text-stone-600 flex items-center gap-1 font-medium">
                <Clock size={12} className="text-amber-500" />
                <span>{summary?.pending_orders ?? 0} Menunggu</span>
              </span>
              <span className="text-stone-600 flex items-center gap-1 font-medium">
                <ChefHat size={12} className="text-blue-500" />
                <span>{summary?.processing_orders ?? 0} Diproses</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Products Monitoring */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
              Menu Siap Saji
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
              <Boxes size={18} />
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-stone-950">
              {summary?.active_products ?? 0}{' '}
              <span className="text-sm font-normal text-stone-400">
                / {summary?.total_products ?? 0} Menu
              </span>
            </h3>

            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Aktif di Web
              </span>
              <Link
                to="/admin/products"
                className="text-stone-500 hover:text-stone-900 font-semibold transition-colors"
              >
                Kelola &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CHARTS & ORDER STATUS BREAKDOWN
      ====================================================== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left: 7 Days Revenue Trend */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs xl:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-stone-900" />
                <h2 className="font-bold text-stone-900 text-base sm:text-lg">
                  Tren Pendapatan 7 Hari Terakhir
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Aktivitas omset katering yang masuk dalam sepekan terakhir.
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] text-stone-400">Total 7 Hari:</p>
              <p className="text-base sm:text-lg font-extrabold text-stone-950 font-mono">
                {formatRupiah(totalSevenDaysRevenue)}
              </p>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4">
            <div className="grid grid-cols-7 gap-2 sm:gap-6 items-end h-48 sm:h-52 border-b border-stone-100 pb-3">
              {data.last_seven_days.map((day, index) => {
                const heightPercentage = revenueChart[index] ?? 8

                return (
                  <div key={day.date} className="group relative flex flex-col items-center h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden rounded-xl bg-stone-900 px-2.5 py-1.5 text-center text-white shadow-xl group-hover:block transition-all pointer-events-none">
                      <p className="text-[10px] font-medium text-stone-400">{day.date}</p>
                      <p className="text-xs font-bold font-mono">{formatRupiah(day.revenue)}</p>
                      <p className="text-[10px] text-emerald-400 font-medium">{day.orders} Pesanan</p>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercentage}%` }}
                      className="w-full max-w-[44px] rounded-xl bg-stone-900 group-hover:bg-red-600 transition-colors duration-200 relative overflow-hidden"
                    >
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-white/20" />
                    </div>

                    {/* Day label */}
                    <span className="mt-2 text-[11px] font-semibold text-stone-500 group-hover:text-stone-950 transition-colors">
                      {day.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
              <span className="text-[11px]">Data diperbarui real-time per transaksi.</span>
              <span className="flex items-center gap-1.5 font-medium text-stone-600 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-900" /> Omset Harian
              </span>
            </div>
          </div>
        </div>

        {/* Right: Order Status Distribution */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-stone-900 text-base sm:text-lg">
              Distribusi Status Pesanan
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Proporsi seluruh pesanan yang tercatat di sistem.
            </p>

            <div className="mt-6 space-y-4">
              {data.order_statuses && data.order_statuses.length > 0 ? (
                data.order_statuses.map((item) => {
                  const totalAll = data.order_statuses.reduce((sum, s) => sum + s.total, 0)
                  const percentage = totalAll > 0 ? Math.round((item.total / totalAll) * 100) : 0

                  const statusColor = {
                    pending: 'bg-amber-400',
                    confirmed: 'bg-blue-400',
                    processing: 'bg-blue-500',
                    completed: 'bg-emerald-500',
                    cancelled: 'bg-red-500',
                  }[item.status.toLowerCase()] ?? 'bg-stone-400'

                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                          {formatStatus(item.status)}
                        </span>
                        <span className="text-stone-500 font-mono text-[11px]">
                          {item.total} order ({percentage}%)
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full ${statusColor} transition-all duration-500`}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-xs text-stone-400">
                  Belum ada data status pesanan.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-400">Total Keseluruhan Order:</span>
            <span className="font-bold text-stone-950 font-mono">
              {data.order_statuses.reduce((sum, s) => sum + s.total, 0)} Pesanan
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          MONITORING PRODUK YANG TAMPIL DI MENU PUBLIK
      ====================================================== */}
      <ProductMonitoringSection />

      {/* =====================================================
          PESANAN MASUK TERBARU (ACTION HUB & INVOICE WA)
      ====================================================== */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Table Header & Search */}
        <div className="border-b border-stone-100 p-4 sm:p-6 bg-stone-50/60">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-600" />
                <h2 className="font-bold text-stone-950 text-base sm:text-lg">
                  Pesanan Masuk Terbaru
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Kirim invoice resmi ke WhatsApp pemesan dan perbarui status proses dapur langsung dari sini.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari no. order / nama / WA..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="h-10 w-full sm:w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-8 text-xs font-medium outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <Link
                to="/admin/orders"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 shadow-2xs hover:bg-stone-50 transition shrink-0"
              >
                <span>Lihat Semua ({data.recent_orders?.length ?? 0})</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Status Tabs Filter (Clean Lucide Icons - No Emojis!) */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-200/60 scrollbar-none">
            {[
              { label: 'Semua Pesanan', value: '', icon: LayoutGrid },
              { label: 'Menunggu', value: 'pending', icon: Clock },
              { label: 'Diproses Dapur', value: 'processing', icon: ChefHat },
              { label: 'Selesai', value: 'completed', icon: CheckCircle2 },
              { label: 'Dibatalkan', value: 'cancelled', icon: XCircle },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isActive = orderFilterStatus === tab.value

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setOrderFilterStatus(tab.value)}
                  className={`inline-flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-950 border border-stone-200'
                  }`}
                >
                  <TabIcon size={13} className={isActive ? 'text-white' : 'text-stone-400'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
              <tr>
                <th className="px-5 py-3.5">Kode Order</th>
                <th className="px-5 py-3.5">Pemesan & WhatsApp</th>
                <th className="px-5 py-3.5">Rincian Menu & Porsi</th>
                <th className="px-5 py-3.5">Status Pesanan</th>
                <th className="px-5 py-3.5 text-right">Total Tagihan</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredRecentOrders.length > 0 ? (
                filteredRecentOrders.map((order) => {
                  const invoiceUrl = generateDashboardWhatsAppInvoice(order)
                  const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
                  const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`

                  return (
                    <tr key={order.id} className="transition hover:bg-stone-50/80">
                      {/* Order Code */}
                      <td className="whitespace-nowrap px-5 py-4 align-top">
                        <p className="font-bold text-stone-950 font-mono">
                          {order.order_code}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {formatDate(order.created_at)}
                        </p>
                      </td>

                      {/* Customer & WA */}
                      <td className="whitespace-nowrap px-5 py-4 align-top">
                        <p className="font-bold text-stone-900 flex items-center gap-1.5">
                          <User size={13} className="text-stone-400" />
                          {order.customers_name}
                        </p>
                        <a
                          href={waChatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          title="Hubungi pelanggan via WhatsApp"
                        >
                          <MessageCircle size={13} />
                          {order.customers_phone}
                        </a>
                      </td>

                      {/* Menu Items & Portions */}
                      <td className="px-5 py-4 align-top max-w-xs">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((it) => (
                              <div key={it.id} className="text-xs">
                                <span className="font-semibold text-stone-900">{it.item_name}</span>
                                <span className="ml-1.5 inline-block rounded bg-stone-100 px-1.5 py-0.2 text-[10px] font-bold text-stone-700">
                                  {it.quantity} porsi
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-stone-500">Menu Katering</p>
                        )}
                        <p className="mt-1 text-[11px] text-stone-400 flex items-center gap-1">
                          <Calendar size={11} />
                          Acara: {formatDate(order.event_date)} {order.event_time ? `(${order.event_time})` : ''}
                        </p>
                      </td>

                      {/* Status Selector (No Emojis!) */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5 w-36">
                          <StatusBadge status={order.status} />

                          <select
                            value={order.status}
                            disabled={isUpdatingStatus}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className="block w-full text-[11px] font-semibold text-stone-800 bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-red-600 transition disabled:opacity-50"
                          >
                            <option value="pending">Menunggu</option>
                            <option value="processing">Diproses Dapur</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="whitespace-nowrap px-5 py-4 text-right align-top">
                        <p className="font-bold text-stone-950 font-mono">
                          {formatRupiah(order.total)}
                        </p>
                        {order.subtotal && (
                          <p className="text-[10px] text-stone-400">
                            Subtotal: {formatRupiah(order.subtotal)}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-4 text-right align-top">
                        <div className="flex flex-col items-end gap-1.5">
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                            title="Kirim invoice WhatsApp"
                          >
                            <Receipt size={13} />
                            <span>Invoice WA</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-stone-400">
                    Tidak ada pesanan yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Order Cards (< md) */}
        <div className="block md:hidden divide-y divide-stone-100 p-4 space-y-4">
          {filteredRecentOrders.length > 0 ? (
            filteredRecentOrders.map((order) => {
              const invoiceUrl = generateDashboardWhatsAppInvoice(order)
              const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
              const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-900 font-mono text-sm">
                        {order.order_code}
                      </span>
                      <p className="text-[11px] text-stone-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <StatusBadge status={order.status} />
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                      <User size={13} className="text-stone-400" />
                      {order.customers_name}
                    </p>
                    <a
                      href={waChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      <MessageCircle size={13} />
                      {order.customers_phone}
                    </a>
                  </div>

                  {/* Items preview */}
                  <div className="rounded-lg bg-stone-50 p-2 text-xs space-y-0.5">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((it) => (
                        <div key={it.id} className="flex justify-between">
                          <span className="font-medium text-stone-800">{it.item_name}</span>
                          <span className="font-bold text-stone-600">{it.quantity} porsi</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-500">Menu Katering</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400">Total Tagihan:</span>
                      <p className="font-bold text-stone-950 font-mono text-sm">
                        {formatRupiah(order.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs"
                      >
                        <Receipt size={13} />
                        <span>WA</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
                      >
                        <Eye size={13} />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-xs text-stone-400">
              Tidak ada pesanan yang sesuai filter.
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ORDER DETAIL MODAL
      ====================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-stone-100 bg-stone-50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-950 text-base">
                    Detail Pesanan: {selectedOrder.order_code}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Masuk pada {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Status Switcher Row */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Status Saat Ini
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
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
                        disabled={isUpdatingStatus || selectedOrder.status === st.status}
                        onClick={() =>
                          handleStatusChange(selectedOrder.id, st.status as OrderStatus)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          selectedOrder.status === st.status
                            ? 'bg-stone-900 text-white shadow-2xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        } disabled:opacity-50`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer & Event Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Data Pemesan
                  </p>
                  <p className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <User size={15} className="text-stone-400" />
                    {selectedOrder.customers_name}
                  </p>
                  <a
                    href={`https://wa.me/${selectedOrder.customers_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} />
                    {selectedOrder.customers_phone}
                  </a>
                </div>

                <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Waktu & Alamat Acara
                  </p>
                  <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Calendar size={14} className="text-stone-400" />
                    {formatDate(selectedOrder.event_date)}{' '}
                    {selectedOrder.event_time && `(${selectedOrder.event_time})`}
                  </p>
                  {selectedOrder.delivery_address && (
                    <p className="text-xs text-stone-500 flex items-start gap-1.5">
                      <MapPin size={14} className="text-stone-400 shrink-0 mt-0.5" />
                      <span>{selectedOrder.delivery_address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
                  <span className="font-bold">Catatan Pemesan:</span> {selectedOrder.notes}
                </div>
              )}

              {/* Items Breakdown */}
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Rincian Item Menu
                </div>
                <div className="divide-y divide-stone-100 p-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 text-xs">
                        <div>
                          <p className="font-semibold text-stone-900">{item.item_name}</p>
                          <p className="text-stone-400 font-mono text-[11px]">
                            {formatRupiah(item.price)} x {item.quantity} porsi
                          </p>
                        </div>
                        <p className="font-bold text-stone-950 font-mono">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-stone-400">
                      Rincian menu katering standar.
                    </div>
                  )}
                </div>

                {/* Total Cost Breakdown */}
                <div className="bg-stone-50 p-4 border-t border-stone-200 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Menu</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.subtotal || selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Ongkos Kirim</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.delivery_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-200">
                    <span>Total Tagihan</span>
                    <span className="font-poppins">{formatRupiah(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-stone-100 bg-stone-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-stone-400">
                Kirim invoice resmi langsung ke nomor WhatsApp pemesan.
              </p>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-white transition"
                >
                  Tutup
                </button>

                <a
                  href={generateDashboardWhatsAppInvoice(selectedOrder)}
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

/* =====================================================
    PRODUCT MONITORING SECTION (LIVE ACTIVE PRODUCTS)
====================================================== */
function ProductMonitoringSection() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: productService.getAll,
  })

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-stone-950 text-base sm:text-lg">
              Monitoring Produk Menu Publik
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Katalog katering aktif yang saat ini tampil dan dapat langsung dipesan oleh pelanggan di website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products/create"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 shadow-2xs transition"
          >
            <Plus size={13} />
            <span>Tambah Produk</span>
          </Link>

          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-red-600 transition-colors"
          >
            <span>Kelola Semua ({products?.length ?? 0})</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          {products.map((product) => {
            const displayImage = getProductDisplayImage(product)
            const minOrder = product.minimum_order || 10

            return (
              <div
                key={product.id}
                className="group relative flex items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 transition-all hover:bg-white hover:border-stone-300 hover:shadow-2xs"
              >
                {/* Thumbnail */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-200 relative">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block rounded bg-emerald-100/70 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                      Aktif
                    </span>
                    {product.category && (
                      <span className="text-[10px] text-stone-400 truncate">
                        {product.category.name}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-stone-950 truncate mt-0.5" title={product.name}>
                    {product.name}
                  </h4>

                  <p className="text-xs font-bold text-stone-950 font-mono mt-0.5">
                    {formatRupiah(product.price)}
                  </p>

                  <p className="text-[10px] text-stone-400">
                    Min. {minOrder} porsi
                  </p>
                </div>

                {/* Quick Edit Icon Link */}
                <Link
                  to={`/admin/products/${product.id}/edit`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-stone-200 shadow-2xs text-stone-600 hover:text-stone-950 hover:bg-stone-50 shrink-0"
                  title="Edit produk ini"
                >
                  <Edit size={13} />
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-stone-400">
          Belum ada produk aktif yang tampil di menu.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
    processing: 'bg-blue-50 text-blue-800 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-50 text-red-800 border-red-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
        styles[normalized] ?? 'bg-stone-100 text-stone-700 border-stone-200'
      }`}
    >
      {formatStatus(status)}
    </span>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded-full bg-stone-200" />
        <div className="h-8 w-64 animate-pulse rounded-xl bg-stone-200" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-stone-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-32 animate-pulse rounded-2xl bg-stone-100" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-stone-100 xl:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-stone-100" />
      </div>

      <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
    </div>
  )
}
