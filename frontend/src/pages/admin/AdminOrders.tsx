import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  MapPin,
  MessageCircle,
  PackageCheck,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Order, OrderStatus } from '../../types/orders'
import { ordersService } from '../../services/orders.service'
import OrderTable, {
  getWhatsAppInvoiceUrl,
} from '../../components/admin/orders/OrderTable'
import OrderStatusBadge from '../../components/admin/orders/OrderStatusBadge'

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

export default function AdminOrders() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-orders', page, selectedStatus, search],
    queryFn: () =>
      ordersService.getAll({
        page,
        per_page: 15,
        status: selectedStatus || undefined,
        search: search.trim() || undefined,
      }),
  })

  const orders = data?.orders ?? []
  const pagination = data?.pagination

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return

    try {
      setUpdatingStatus(true)
      const updated = await ordersService.updateStatus(
        selectedOrder.id,
        status,
      )
      setSelectedOrder(updated)
      toast.success(
        `Status order ${updated.order_code} berhasil diubah ke "${status}".`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch {
      toast.error('Gagal memperbarui status order.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 text-stone-900">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Catering Management
            </p>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
            Daftar Pesanan Masuk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            Pantau pesanan katering, kirim invoice WhatsApp ke pemesan, serta perbarui status pengerjaan secara berkala.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs transition hover:bg-stone-50 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            size={14}
            className={isFetching ? 'animate-spin' : ''}
          />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Total Pesanan</p>
              <p className="mt-0.5 text-2xl font-bold text-stone-900">
                {pagination?.total ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Status Aktif</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900 capitalize">
                {selectedStatus ? selectedStatus : 'Semua Pesanan'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PackageCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Halaman Saat Ini</p>
              <p className="mt-0.5 text-2xl font-bold text-stone-900">
                {pagination?.current_page ?? 1}{' '}
                <span className="text-xs text-stone-400 font-normal">
                  / {pagination?.last_page ?? 1}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-3">
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
                  className={`inline-flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-950 border border-stone-200/80'
                  }`}
                >
                  <TabIcon size={13} className={isActive ? 'text-white' : 'text-stone-400'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              placeholder="Cari kode order / nama / WA..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-9 pr-8 text-xs font-medium outline-none focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table & Mobile Cards */}
      {isLoading ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-2xs space-y-3">
          <RefreshCw size={24} className="mx-auto animate-spin text-stone-400" />
          <p className="text-xs text-stone-500 font-medium">Memuat data pesanan masuk...</p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-bold text-red-600">Gagal memuat data pesanan.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-stone-500">
              <p>
                Menampilkan{' '}
                <span className="font-bold text-stone-900">
                  {pagination.from ?? 0}
                </span>{' '}
                -{' '}
                <span className="font-bold text-stone-900">
                  {pagination.to ?? 0}
                </span>{' '}
                dari{' '}
                <span className="font-bold text-stone-900">
                  {pagination.total}
                </span>{' '}
                pesanan
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!pagination.prev_page_url}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="px-3 font-semibold text-stone-800">
                  {pagination.current_page} / {pagination.last_page}
                </span>

                <button
                  type="button"
                  disabled={!pagination.next_page_url}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-xs transition-opacity">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
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
              {/* Status Row & Changer */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Status Pesanan Saat Ini
                  </p>
                  <div className="mt-1">
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                {/* Status Switch Buttons */}
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
                        disabled={updatingStatus || selectedOrder.status === st.status}
                        onClick={() =>
                          handleUpdateStatus(st.status as OrderStatus)
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
                    Informasi Pemesan
                  </p>
                  <div className="space-y-1">
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
                </div>

                <div className="rounded-xl border border-stone-200 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Jadwal & Lokasi Acara
                  </p>
                  <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Calendar size={14} className="text-stone-400" />
                    {formatDate(selectedOrder.event_date)}{' '}
                    {selectedOrder.event_time && `(${selectedOrder.event_time})`}
                  </p>
                  <p className="text-xs text-stone-500 flex items-start gap-1.5">
                    <MapPin size={14} className="text-stone-400 shrink-0 mt-0.5" />
                    <span>{selectedOrder.delivery_address || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
                  <span className="font-bold">Catatan Pemesan:</span> {selectedOrder.notes}
                </div>
              )}

              {/* Menu Items Table */}
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Rincian Item Menu Katering
                </div>
                <div className="divide-y divide-stone-100 p-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-stone-900">{item.item_name}</p>
                          <p className="text-stone-400 font-mono text-[11px]">
                            {formatRupiah(item.price)} x {item.quantity} porsi
                          </p>
                        </div>
                        <p className="font-bold text-stone-950 font-mono text-sm">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-stone-400">
                      Item pesanan tidak tersedia.
                    </div>
                  )}
                </div>

                {/* Cost Breakdown Footer */}
                <div className="bg-stone-50 p-4 border-t border-stone-200 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Menu</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Ongkos Kirim</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-200">
                    <span>Total Tagihan Invoice</span>
                    <span className="text-red-600 font-mono">
                      {formatRupiah(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-stone-100 bg-stone-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-stone-400">
                Kirimkan invoice resmi langsung ke nomor WhatsApp pemesan.
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
  )
}
