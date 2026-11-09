import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  MessageCircle,
  Pencil,
  Printer,
  Receipt,
  Star,
  Trash2,
  User,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Order, OrderStatus } from '../../../types/orders'
import { ordersService } from '../../../services/orders.service'
import { useThemeStore } from '../../../stores/theme.store'
import OrderStatusBadge from './OrderStatusBadge'
import PaymentStatusBadge from './PaymentStatusBadge'
import {
  getWhatsAppInvoiceUrl,
  getWhatsAppTestimonialUrl,
} from '../../../utils/whatsappInvoice'

export { getWhatsAppInvoiceUrl, getWhatsAppTestimonialUrl }

interface OrderTableProps {
  orders: Order[]
  onView: (order: Order) => void
  onPrint?: (order: Order) => void
  onDelete?: (order: Order) => void
  onStatusUpdated?: () => void
}

function formatRupiah(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

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

export default function OrderTable({
  orders,
  onView,
  onPrint,
  onDelete,
  onStatusUpdated,
}: OrderTableProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const handleQuickStatusChange = async (
    order: Order,
    newStatus: OrderStatus,
    force?: boolean,
  ) => {
    if (order.status === newStatus && !force) return

    try {
      setUpdatingId(order.id)
      await ordersService.updateStatus(order.id, newStatus, force)
      toast.success(
        `Status order #${order.order_code} berhasil diperbarui.`,
      )
      onStatusUpdated?.()
    } catch (err: any) {
      if (err.response?.data?.requires_confirmation) {
        const confirmForce = window.confirm(
          `${err.response.data.message}\n\nApakah Anda ingin tetap memproses pesanan ini melebihi kuota dapur?`
        )
        if (confirmForce) {
          await handleQuickStatusChange(order, newStatus, true)
          return
        }
      } else {
        toast.error(err.response?.data?.message || 'Gagal memperbarui status order.')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  if (orders.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed px-6 py-16 text-center transition-all ${
          isDark
            ? 'border-[#382321] bg-[#1A1211]'
            : 'border-stone-200 bg-white shadow-xs'
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-[#251715] text-stone-400 dark:text-stone-500 mb-3">
          <ShoppingBag size={22} />
        </div>
        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
          Tidak ada pesanan ditemukan
        </h3>
        <p className={`mt-1 text-xs sm:text-sm max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          Tidak ada data pesanan yang cocok dengan kriteria filter atau pencarian saat ini.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${
        isDark
          ? 'border-[#382321] bg-[#18100F]'
          : 'border-stone-200/90 bg-white'
      }`}
    >
      {/* =====================================================
          DESKTOP TABLE VIEW (>= md)
      ====================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDark
                  ? 'border-[#382321] bg-[#140D0C] text-stone-400'
                  : 'border-stone-200/90 bg-[#FAF8F5] text-stone-500'
              }`}
            >
              <th className="px-5 py-3.5 whitespace-nowrap">ID & Waktu Pesan</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Pemesan</th>
              <th className="px-5 py-3.5">Menu & Rincian</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Jadwal Acara & Lokasi</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Total Tagihan</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Status Pesanan</th>
              <th className="px-5 py-3.5 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>

          <tbody
            className={`divide-y text-xs ${
              isDark ? 'divide-[#2A1816]' : 'divide-stone-100'
            }`}
          >
            {orders.map((order) => {
              const invoiceUrl = getWhatsAppInvoiceUrl(order)
              const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
              const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
              const isExpanded = Boolean(expandedOrders[order.id])
              const itemsList = order.items || []
              const displayItems = isExpanded ? itemsList : itemsList.slice(0, 2)
              const hiddenCount = itemsList.length - 2

              return (
                <tr
                  key={order.id}
                  className={`group transition-colors ${
                    isDark
                      ? 'hover:bg-[#201514]'
                      : 'hover:bg-[#FAF8F5]/90'
                  }`}
                >
                  {/* Order Code & Timestamp */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onView(order)}
                      className={`font-mono font-bold text-xs hover:underline cursor-pointer block text-left ${
                        isDark ? 'text-amber-300' : 'text-stone-900'
                      }`}
                      title="Klik untuk lihat detail lengkap"
                    >
                      {order.order_code}
                    </button>
                    <p
                      className={`mt-1 text-[11px] ${
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      }`}
                    >
                      {formatDate(order.created_at)}
                    </p>
                  </td>

                  {/* Customer Information */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <p
                      className={`font-semibold flex items-center gap-1.5 ${
                        isDark ? 'text-stone-100' : 'text-stone-900'
                      }`}
                    >
                      <User size={13} className={isDark ? 'text-amber-400/80' : 'text-stone-400'} />
                      <span>{order.customers_name}</span>
                    </p>
                    <a
                      href={waChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
                      title="Chat WhatsApp pelanggan"
                    >
                      <MessageCircle size={12} className="shrink-0" />
                      <span>{order.customers_phone}</span>
                    </a>
                  </td>

                  {/* Catering Menu Items & Addons with Progressive Disclosure */}
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-xs space-y-1.5">
                      {itemsList.length > 0 ? (
                        <>
                          {displayItems.map((item, idx) => (
                            <div key={item.id || idx} className="text-xs">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span
                                  className={`font-semibold ${
                                    isDark ? 'text-stone-200' : 'text-stone-900'
                                  }`}
                                >
                                  {item.item_name}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                    isDark
                                      ? 'bg-red-950/50 text-red-300 border border-red-900/60'
                                      : 'bg-red-50 text-red-700 border border-red-200/80'
                                  }`}
                                >
                                  {item.quantity} porsi
                                </span>
                              </div>

                              {item.addons && item.addons.length > 0 && (
                                <div
                                  className={`mt-0.5 space-y-0.5 pl-2 border-l text-[11px] ${
                                    isDark ? 'border-[#4A2D2A] text-stone-400' : 'border-stone-200 text-stone-500'
                                  }`}
                                >
                                  {item.addons.map((a, aIdx) => (
                                    <div key={a.id || aIdx} className="truncate">
                                      <span className="text-amber-500 font-bold">+</span> {a.addon_name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {hiddenCount > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(order.id)}
                              className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                                isDark
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-amber-700 hover:text-amber-800'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={12} />
                                  <span>Sembunyikan rincian menu</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={12} />
                                  <span>+ {hiddenCount} menu katering lainnya</span>
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                          Rincian katering umum
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Schedule & Delivery Location */}
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-[210px] space-y-1">
                      <p
                        className={`font-semibold text-xs flex items-center gap-1.5 ${
                          isDark ? 'text-stone-200' : 'text-stone-900'
                        }`}
                      >
                        <Calendar size={13} className={isDark ? 'text-amber-400/80' : 'text-stone-400'} />
                        <span>{formatDate(order.event_date)}</span>
                        {order.event_time && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-medium ${
                              isDark ? 'bg-[#291A18] text-amber-300' : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {order.event_time}
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-[11px] line-clamp-2 flex items-start gap-1 leading-snug ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}
                        title={order.delivery_address}
                      >
                        <MapPin size={12} className={`shrink-0 mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
                        <span>{order.delivery_address || 'Ambil di Toko / Outlet'}</span>
                      </p>
                    </div>
                  </td>

                  {/* Total Amount & Payment Badge */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <p
                      className={`font-bold font-mono text-xs sm:text-sm ${
                        isDark ? 'text-white' : 'text-stone-950'
                      }`}
                    >
                      {formatRupiah(order.total)}
                    </p>
                    <div className="mt-1.5">
                      <PaymentStatusBadge
                        status={order.payment_status}
                        paidAmount={order.paid_amount}
                        paymentMethod={order.payment_method}
                        compact
                      />
                    </div>
                  </td>

                  {/* Order Status & Quick Status Changer */}
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-1.5 w-36">
                      <OrderStatusBadge status={order.status} />

                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            order,
                            e.target.value as OrderStatus,
                          )
                        }
                        className={`block w-full rounded-lg border px-2 py-1 text-[11px] font-medium outline-none transition cursor-pointer disabled:opacity-50 ${
                          isDark
                            ? 'border-[#3D2522] bg-[#221514] text-stone-300 hover:bg-[#2A1B19] focus:border-[#F59E0B]'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 focus:border-red-600 focus:bg-white'
                        }`}
                        title="Ubah status pesanan secara instan"
                      >
                        <option value="pending">Ubah: Menunggu</option>
                        <option value="processing">Ubah: Diproses Dapur</option>
                        <option value="completed">Ubah: Selesai</option>
                        <option value="cancelled">Ubah: Dibatalkan</option>
                      </select>
                    </div>
                  </td>

                  {/* Action Toolbar */}
                  <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      {/* Detail */}
                      <button
                        type="button"
                        onClick={() => onView(order)}
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                          isDark
                            ? 'border-[#382321] bg-[#221514] text-stone-300 hover:bg-[#2E1D1B] hover:text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs'
                        }`}
                        title="Lihat Detail Lengkap Pesanan"
                        aria-label="Detail"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Print Nota */}
                      {onPrint && (
                        <button
                          type="button"
                          onClick={() => onPrint(order)}
                          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                            isDark
                              ? 'border-[#4A201B] bg-[#261311] text-red-300 hover:bg-red-950/50 hover:text-white'
                              : 'border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100 shadow-2xs'
                          }`}
                          title="Cetak Nota Struk / Tiket Dapur"
                          aria-label="Cetak Nota"
                        >
                          <Printer size={13} />
                        </button>
                      )}

                      {/* WhatsApp Invoice */}
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                          isDark
                            ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 hover:text-white'
                            : 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 shadow-2xs'
                        }`}
                        title="Kirim Invoice Resmi ke WhatsApp"
                        aria-label="Invoice WA"
                      >
                        <Receipt size={13} />
                      </a>

                      {/* Edit */}
                      <Link
                        to={`/admin/orders/${order.id}/edit`}
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                          isDark
                            ? 'border-amber-800/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-white'
                            : 'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100 shadow-2xs'
                        }`}
                        title="Edit Rincian Pesanan"
                        aria-label="Edit"
                      >
                        <Pencil size={13} />
                      </Link>

                      {/* Link Testimoni (completed only) */}
                      {order.status === 'completed' && (
                        <a
                          href={getWhatsAppTestimonialUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                            isDark
                              ? 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50'
                              : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-2xs'
                          }`}
                          title="Kirim Link Testimoni Pelanggan"
                          aria-label="Link Testimoni"
                        >
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                        </a>
                      )}

                      {/* Delete */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(order)}
                          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                            isDark
                              ? 'border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 hover:text-white'
                              : 'border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:border-rose-200 shadow-2xs'
                          }`}
                          title="Hapus Pesanan Ini"
                          aria-label="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          MOBILE RESPONSIVE ORDER CARDS (< md)
      ====================================================== */}
      <div
        className={`block md:hidden p-3 sm:p-4 space-y-3.5 ${
          isDark ? 'bg-[#18100F]' : 'bg-[#FAF8F5]'
        }`}
      >
        {orders.map((order) => {
          const invoiceUrl = getWhatsAppInvoiceUrl(order)
          const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
          const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`

          return (
            <div
              key={order.id}
              className={`rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                isDark
                  ? 'border-[#382321] bg-[#1C1312]'
                  : 'border-stone-200/90 bg-white'
              }`}
            >
              {/* Card Header: Code, Timestamp & Badge */}
              <div className="flex items-start justify-between gap-2 border-b pb-2.5 dark:border-[#2D1B19] border-stone-100">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className={`font-mono font-bold text-sm hover:underline cursor-pointer block text-left truncate ${
                      isDark ? 'text-amber-300' : 'text-stone-900'
                    }`}
                  >
                    #{order.order_code}
                  </button>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-400'
                    }`}
                  >
                    Masuk pada {formatDate(order.created_at)}
                  </p>
                </div>

                <OrderStatusBadge status={order.status} />
              </div>

              {/* Customer & Event Schedule in 2-column info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>
                    Pemesan
                  </span>
                  <p className={`font-semibold truncate mt-0.5 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    {order.customers_name}
                  </p>
                  <a
                    href={waChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline truncate"
                  >
                    <MessageCircle size={11} className="shrink-0" />
                    <span>{order.customers_phone}</span>
                  </a>
                </div>

                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>
                    Jadwal Acara
                  </span>
                  <p className={`font-semibold text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                    <Calendar size={11} className="shrink-0 text-amber-500" />
                    <span>{formatDate(order.event_date)}</span>
                  </p>
                  {order.event_time && (
                    <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-amber-300' : 'text-stone-600'}`}>
                      Pukul {order.event_time} WIB
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              {order.delivery_address && (
                <div
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] flex items-start gap-1.5 ${
                    isDark ? 'bg-[#241715] text-stone-300' : 'bg-stone-50 text-stone-600'
                  }`}
                >
                  <MapPin size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="line-clamp-2">{order.delivery_address}</span>
                </div>
              )}

              {/* Menu Items Preview */}
              <div
                className={`rounded-xl p-2.5 text-xs space-y-1.5 ${
                  isDark ? 'bg-[#221514]' : 'bg-[#FAF8F5]'
                }`}
              >
                {order.items && order.items.length > 0 ? (
                  order.items.slice(0, 3).map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-baseline gap-2 text-xs">
                      <span className={`font-medium truncate ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                        {item.item_name}
                      </span>
                      <span className={`font-bold font-mono text-[11px] shrink-0 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        {item.quantity}x
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Menu Katering</p>
                )}

                {order.items && order.items.length > 3 && (
                  <p className="text-[10px] text-amber-500 font-medium pt-0.5">
                    +{order.items.length - 3} item menu lainnya
                  </p>
                )}
              </div>

              {/* Total & Payment Bar */}
              <div
                className={`flex items-center justify-between pt-2 border-t text-xs ${
                  isDark ? 'border-[#2D1B19]' : 'border-stone-100'
                }`}
              >
                <div>
                  <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>
                    Total Tagihan:
                  </span>
                  <p
                    className={`font-bold font-mono text-sm ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}
                  >
                    {formatRupiah(order.total)}
                  </p>
                </div>

                <PaymentStatusBadge
                  status={order.payment_status}
                  paidAmount={order.paid_amount}
                  paymentMethod={order.payment_method}
                  compact
                />
              </div>

              {/* Mobile Actions Grid (Comfortable 40px touch targets) */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onView(order)}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border text-[10px] font-semibold transition active:scale-95 ${
                    isDark
                      ? 'border-[#382321] bg-[#241715] text-stone-200 hover:bg-[#2F1F1D]'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 shadow-2xs'
                  }`}
                  title="Lihat Detail Pesanan"
                >
                  <Eye size={14} className="mb-0.5" />
                  <span>Detail</span>
                </button>

                {onPrint && (
                  <button
                    type="button"
                    onClick={() => onPrint(order)}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border text-[10px] font-semibold transition active:scale-95 ${
                      isDark
                        ? 'border-[#4A201B] bg-[#261311] text-red-300'
                        : 'border-red-200 bg-red-50 text-red-700 shadow-2xs'
                    }`}
                    title="Cetak Nota / Slip Dapur"
                  >
                    <Printer size={14} className="mb-0.5" />
                    <span>Cetak</span>
                  </button>
                )}

                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border text-[10px] font-semibold transition active:scale-95 ${
                    isDark
                      ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs'
                  }`}
                  title="Kirim Invoice WhatsApp"
                >
                  <Receipt size={14} className="mb-0.5" />
                  <span>Invoice</span>
                </a>

                <Link
                  to={`/admin/orders/${order.id}/edit`}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border text-[10px] font-semibold transition active:scale-95 ${
                    isDark
                      ? 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                      : 'border-amber-200 bg-amber-50 text-amber-800 shadow-2xs'
                  }`}
                  title="Edit Pesanan"
                >
                  <Pencil size={13} className="mb-0.5" />
                  <span>Edit</span>
                </Link>
              </div>

              {/* Status Change Dropdown on Mobile */}
              <div className="pt-1">
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) =>
                    handleQuickStatusChange(
                      order,
                      e.target.value as OrderStatus,
                    )
                  }
                  className={`block w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition ${
                    isDark
                      ? 'border-[#382321] bg-[#221514] text-stone-200 focus:border-[#F59E0B]'
                      : 'border-stone-200 bg-stone-50 text-stone-800 focus:border-red-600 focus:bg-white'
                  }`}
                >
                  <option value="pending">Ubah Status: Menunggu Konfirmasi</option>
                  <option value="processing">Ubah Status: Diproses Dapur</option>
                  <option value="completed">Ubah Status: Selesai</option>
                  <option value="cancelled">Ubah Status: Dibatalkan</option>
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
