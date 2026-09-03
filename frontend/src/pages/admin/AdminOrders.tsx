import { useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  PackageCheck,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  X,
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
    <div className="min-h-screen space-y-6 pb-20 p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">
            Catering Management
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950">
            Daftar Pesanan Masuk (Orders)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Pantau pesanan katering, kirim invoice ke WhatsApp pelanggan, dan perbarui status pengerjaan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={isFetching ? 'animate-spin' : ''}
          />
          Segarkan Data
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShoppingBag size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Total Pesanan</p>
              <p className="mt-1 text-2xl font-black text-gray-900">
                {pagination?.total ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Status Aktif</p>
              <p className="mt-1 text-sm font-bold text-gray-900 capitalize">
                {selectedStatus ? selectedStatus : 'Semua Pesanan'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PackageCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">Halaman Saat Ini</p>
              <p className="mt-1 text-2xl font-black text-gray-900">
                {pagination?.current_page ?? 1}{' '}
                <span className="text-xs text-gray-400 font-normal">
                  / {pagination?.last_page ?? 1}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: 'Semua', value: '' },
              { label: '⏳ Pending', value: 'pending' },
              { label: '👨‍🍳 Diproses', value: 'processing' },
              { label: '✅ Selesai', value: 'completed' },
              { label: '❌ Canceled', value: 'cancelled' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.value as OrderStatus | '')
                  setPage(1)
                }}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${selectedStatus === tab.value
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari kode order / nama / WA..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-8 text-xs font-medium outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/10 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-14 w-full rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h3 className="text-base font-bold text-red-900">
            Gagal memuat daftar pesanan
          </h3>
          <p className="mt-1 text-xs text-red-700">
            Terjadi masalah saat mengambil data order dari server.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && !isError && (
        <>
          <OrderTable
            orders={orders}
            onView={(order) => setSelectedOrder(order)}
            onStatusUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
              queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            }}
          />

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-500">
                Menampilkan{' '}
                <span className="font-bold text-gray-900">
                  {pagination.from ?? 0}
                </span>{' '}
                -{' '}
                <span className="font-bold text-gray-900">
                  {pagination.to ?? 0}
                </span>{' '}
                dari{' '}
                <span className="font-bold text-gray-900">
                  {pagination.total}
                </span>{' '}
                pesanan
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.prev_page_url}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-bold px-2">
                  {pagination.current_page} / {pagination.last_page}
                </span>

                <button
                  type="button"
                  disabled={!pagination.next_page_url}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">
                    Detail Pesanan: {selectedOrder.order_code}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Masuk pada {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Status Row & Changer */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Status Pesanan Saat Ini
                  </p>
                  <div className="mt-1">
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                {/* Status Switch Buttons */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Ubah Status:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { status: 'pending', label: 'Pending' },
                      { status: 'processing', label: 'Proses' },
                      { status: 'completed', label: 'Selesai' },
                      { status: 'cancelled', label: 'Canceled' },
                    ].map((st) => (
                      <button
                        key={st.status}
                        type="button"
                        disabled={updatingStatus || selectedOrder.status === st.status}
                        onClick={() =>
                          handleUpdateStatus(st.status as OrderStatus)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedOrder.status === st.status
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
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
                <div className="rounded-2xl border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Informasi Pemesan
                  </p>
                  <div className="space-y-1">
                    <p className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                      <User size={15} className="text-gray-400" />
                      {selectedOrder.customers_name}
                    </p>
                    <a
                      href={`https://wa.me/${selectedOrder.customers_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1.5"
                    >
                      <MessageCircle size={14} />
                      {selectedOrder.customers_phone}
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Jadwal & Lokasi Acara
                  </p>
                  <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(selectedOrder.event_date)}{' '}
                    {selectedOrder.event_time && `(${selectedOrder.event_time})`}
                  </p>
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
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
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                  Rincian Item Menu Katering
                </div>
                <div className="divide-y divide-gray-100 p-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{item.item_name}</p>
                          <p className="text-gray-400">
                            Rp {Number(item.price).toLocaleString('id-ID')} x {item.quantity} porsi
                          </p>
                        </div>
                        <p className="font-black text-gray-900 text-sm">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400">
                      Item pesanan tidak tersedia.
                    </div>
                  )}
                </div>

                {/* Cost Breakdown Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal Menu</span>
                    <span>Rp {Number(selectedOrder.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim</span>
                    <span>Rp {Number(selectedOrder.delivery_fee).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-950 pt-2 border-t border-gray-200">
                    <span>Total Tagihan Invoice</span>
                    <span className="text-red-600">
                      Rp {Number(selectedOrder.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-400">
                Klik tombol di kanan untuk mengirimkan invoice resmi langsung ke WhatsApp pemesan.
              </p>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-white transition"
                >
                  Tutup
                </button>

                <a
                  href={getWhatsAppInvoiceUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
                >
                  <Receipt size={16} />
                  Kirim Invoice ke WA Pemesan
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
