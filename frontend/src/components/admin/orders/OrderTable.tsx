import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Eye,
  MapPin,
  MessageCircle,
  Pencil,
  Printer,
  Receipt,
  Star,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Order, OrderStatus } from '../../../types/orders'
import { ordersService } from '../../../services/orders.service'
import { useThemeStore } from '../../../stores/theme.store'
import OrderStatusBadge from './OrderStatusBadge'
import PaymentStatusBadge from './PaymentStatusBadge'

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
  }).format(Number(value))
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

import {
  getWhatsAppInvoiceUrl,
  getWhatsAppTestimonialUrl,
} from '../../../utils/whatsappInvoice'

export { getWhatsAppInvoiceUrl, getWhatsAppTestimonialUrl }

export default function OrderTable({
  orders,
  onView,
  onPrint,
  onDelete,
  onStatusUpdated,
}: OrderTableProps) {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

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
        `Status order ${order.order_code} berhasil diubah ke "${newStatus}".`,
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
        className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
          isDark
            ? 'border-[#60241E] bg-[#240E0C]'
            : 'border-stone-200 bg-white'
        }`}
      >
        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
          Belum ada pesanan
        </h3>
        <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-amber-100/70' : 'text-stone-500'}`}>
          Pesanan katering pelanggan akan muncul di sini saat ada order baru masuk.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border shadow-2xs overflow-hidden ${
        isDark
          ? 'border-[#60241E]/80 bg-[#240E0C]'
          : 'border-stone-200/90 bg-white'
      }`}
    >
      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead
            className={`border-b ${
              isDark
                ? 'border-[#60241E]/60 bg-[#2D120F]'
                : 'border-stone-100 bg-stone-50/70'
            }`}
          >
            <tr>
              <th
                className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Kode Order
              </th>
              <th
                className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Pemesan (Nama & WA)
              </th>
              <th
                className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Menu & Porsi
              </th>
              <th
                className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Acara & Alamat
              </th>
              <th
                className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Total Tagihan
              </th>
              <th
                className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Status Pesanan
              </th>
              <th
                className={`px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-200/60' : 'text-stone-400'
                }`}
              >
                Aksi
              </th>
            </tr>
          </thead>

          <tbody
            className={`divide-y text-xs ${
              isDark ? 'divide-[#60241E]/40' : 'divide-stone-100'
            }`}
          >
            {orders.map((order) => {
              const invoiceUrl = getWhatsAppInvoiceUrl(order)
              const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
              const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`

              return (
                <tr
                  key={order.id}
                  className={`transition ${
                    isDark ? 'hover:bg-[#2D120F]/60' : 'hover:bg-stone-50/70'
                  }`}
                >
                  {/* Order Code */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <p
                      className={`font-bold font-mono text-xs ${
                        isDark ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {order.order_code}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] ${
                        isDark ? 'text-amber-200/50' : 'text-stone-400'
                      }`}
                    >
                      {formatDate(order.created_at)}
                    </p>
                  </td>

                  {/* Customer (Name & Phone) */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <p
                      className={`font-semibold flex items-center gap-1.5 ${
                        isDark ? 'text-stone-100' : 'text-stone-900'
                      }`}
                    >
                      <User size={13} className={isDark ? 'text-amber-200/60' : 'text-stone-400'} />
                      {order.customers_name}
                    </p>
                    <a
                      href={waChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400 hover:underline"
                      title="Chat pelanggan via WhatsApp"
                    >
                      <MessageCircle size={13} />
                      {order.customers_phone}
                    </a>
                  </td>

                  {/* Menu items */}
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-xs space-y-1.5">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div key={item.id} className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-semibold ${
                                  isDark ? 'text-stone-100' : 'text-stone-900'
                                }`}
                              >
                                {item.item_name}
                              </span>
                              <span
                                className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                  isDark ? 'bg-red-950/60 text-red-300' : 'bg-red-50 text-red-600'
                                }`}
                              >
                                {item.quantity} porsi
                              </span>
                            </div>
                            {item.addons && item.addons.length > 0 && (
                              <div
                                className={`mt-0.5 space-y-0.5 pl-2 border-l ${
                                  isDark ? 'border-[#60241E] text-stone-300' : 'border-red-200 text-stone-600'
                                }`}
                              >
                                {item.addons.map((a) => (
                                  <div key={a.id || a.addon_name} className="text-[11px]">
                                    <span className="text-red-500 font-bold">+</span> {a.addon_name}{' '}
                                    <span
                                      className={`font-mono ${
                                        isDark ? 'text-stone-400' : 'text-stone-400'
                                      }`}
                                    >
                                      (+{formatRupiah(a.price)} × {a.quantity || item.quantity} = +{formatRupiah(a.subtotal || String(Number(a.price) * item.quantity))})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          Menu Katering
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Event & Address */}
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-xs">
                      <p
                        className={`font-medium text-xs flex items-center gap-1 ${
                          isDark ? 'text-stone-200' : 'text-stone-900'
                        }`}
                      >
                        <Calendar size={13} className={isDark ? 'text-amber-200/60' : 'text-stone-400'} />
                        {formatDate(order.event_date)}
                        {order.event_time && (
                          <span className={isDark ? 'text-stone-400 font-normal' : 'text-stone-500 font-normal'}>
                            ({order.event_time})
                          </span>
                        )}
                      </p>
                      <p
                        className={`mt-0.5 text-xs line-clamp-2 flex items-start gap-1 ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}
                      >
                        <MapPin size={13} className={`shrink-0 mt-0.5 ${isDark ? 'text-amber-200/60' : 'text-stone-400'}`} />
                        <span>{order.delivery_address}</span>
                      </p>
                    </div>
                  </td>

                  {/* Total Tagihan & Status Pembayaran */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <p
                      className={`font-bold text-xs sm:text-sm font-mono ${
                        isDark ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {formatRupiah(order.total)}
                    </p>
                    <div className="mt-1">
                      <PaymentStatusBadge
                        status={order.payment_status}
                        paidAmount={order.paid_amount}
                        paymentMethod={order.payment_method}
                      />
                    </div>
                  </td>

                  {/* Status & Quick Status Changer */}
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
                        className={`block w-full rounded-lg border px-2 py-1 text-[11px] font-medium outline-none disabled:opacity-50 ${
                          isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-stone-200 focus:border-[#F59E0B]'
                            : 'border-stone-200 bg-white text-stone-800 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                        }`}
                      >
                        <option value="pending">Menunggu</option>
                        <option value="processing">Diproses Dapur</option>
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    </div>
                  </td>

                  {/* Actions (Horizontal Icon Toolbar) */}
                  <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Detail */}
                      <button
                        type="button"
                        onClick={() => onView(order)}
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                          isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title="Lihat Detail Pesanan"
                        aria-label="Detail"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit */}
                      <Link
                        to={`/admin/orders/${order.id}/edit`}
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                          isDark
                            ? 'border-amber-600/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50'
                            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                        title="Edit Rincian Pesanan"
                        aria-label="Edit"
                      >
                        <Pencil size={13} />
                      </Link>

                      {/* Hapus */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(order)}
                          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                            isDark
                              ? 'border-rose-600/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50'
                              : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Hapus Pesanan"
                          aria-label="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {/* Cetak Nota */}
                      {onPrint && (
                        <button
                          type="button"
                          onClick={() => onPrint(order)}
                          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                            isDark
                              ? 'border-red-600/40 bg-red-950/40 text-red-300 hover:bg-red-900/50'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                          title="Cetak Nota / Slip Dapur"
                          aria-label="Cetak Nota"
                        >
                          <Printer size={13} />
                        </button>
                      )}

                      {/* Invoice WA */}
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-2xs ${
                          isDark
                            ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title="Kirim Invoice Resmi ke WhatsApp"
                        aria-label="Invoice WA"
                      >
                        <Receipt size={13} />
                      </a>

                      {/* Link Testimoni (hanya saat completed) */}
                      {order.status === 'completed' && (
                        <a
                          href={getWhatsAppTestimonialUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-2xs ${
                            isDark
                              ? 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                              : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                          }`}
                          title="Kirim Link Testimoni via WhatsApp"
                          aria-label="Link Testimoni"
                        >
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Order Cards (< md) */}
      <div
        className={`block md:hidden divide-y p-4 space-y-4 ${
          isDark ? 'divide-[#60241E]/40' : 'divide-stone-100'
        }`}
      >
        {orders.map((order) => {
          const invoiceUrl = getWhatsAppInvoiceUrl(order)
          const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
          const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`

          return (
            <div
              key={order.id}
              className={`rounded-xl border p-4 shadow-2xs space-y-3 ${
                isDark
                  ? 'border-[#60241E]/80 bg-[#1C0B09]'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`font-bold font-mono text-sm ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    {order.order_code}
                  </span>
                  <p
                    className={`text-[11px] ${
                      isDark ? 'text-amber-200/50' : 'text-stone-400'
                    }`}
                  >
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <OrderStatusBadge status={order.status} />
              </div>

              <div className="space-y-1 text-xs">
                <p
                  className={`font-semibold flex items-center gap-1.5 ${
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  }`}
                >
                  <User size={13} className={isDark ? 'text-amber-200/60' : 'text-stone-400'} />
                  {order.customers_name}
                </p>
                <a
                  href={waChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:underline"
                >
                  <MessageCircle size={13} />
                  {order.customers_phone}
                </a>
              </div>

              {/* Items Preview */}
              <div
                className={`rounded-lg p-2.5 text-xs space-y-1.5 ${
                  isDark ? 'bg-[#240E0C]' : 'bg-stone-50'
                }`}
              >
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex justify-between">
                        <span
                          className={`font-semibold ${
                            isDark ? 'text-stone-200' : 'text-stone-800'
                          }`}
                        >
                          {item.item_name}
                        </span>
                        <span
                          className={`font-bold ${
                            isDark ? 'text-stone-300' : 'text-stone-600'
                          }`}
                        >
                          {item.quantity} porsi
                        </span>
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <div
                          className={`pl-2 border-l space-y-0.5 ${
                            isDark ? 'border-[#60241E]' : 'border-red-200'
                          }`}
                        >
                          {item.addons.map((a) => (
                            <div
                              key={a.id || a.addon_name}
                              className={`text-[10px] flex justify-between ${
                                isDark ? 'text-stone-300' : 'text-stone-600'
                              }`}
                            >
                              <span>+ {a.addon_name}</span>
                              <span
                                className={`font-mono ${
                                  isDark ? 'text-stone-400' : 'text-stone-400'
                                }`}
                              >
                                +{formatRupiah(a.price)} × {a.quantity || item.quantity} = +{formatRupiah(a.subtotal || String(Number(a.price) * item.quantity))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>Menu Katering</p>
                )}

                <p
                  className={`pt-1 text-[11px] flex items-center gap-1 border-t ${
                    isDark ? 'border-[#60241E]/50 text-stone-400' : 'border-stone-200/50 text-stone-400'
                  }`}
                >
                  <Calendar size={11} />
                  Acara: {formatDate(order.event_date)} {order.event_time ? `(${order.event_time})` : ''}
                </p>
              </div>

              <div
                className={`flex items-center justify-between pt-1 border-t text-xs ${
                  isDark ? 'border-[#60241E]/60' : 'border-stone-100'
                }`}
              >
                <div>
                  <span className={`text-[10px] ${isDark ? 'text-amber-200/50' : 'text-stone-400'}`}>
                    Total & Pembayaran:
                  </span>
                  <p
                    className={`font-bold font-mono text-sm ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}
                  >
                    {formatRupiah(order.total)}
                  </p>
                  <div className="mt-1">
                    <PaymentStatusBadge
                      status={order.payment_status}
                      paidAmount={order.paid_amount}
                      paymentMethod={order.payment_method}
                      compact
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Detail */}
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                      isDark
                        ? 'border-[#60241E] bg-[#240E0C] text-stone-200'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                    title="Lihat Detail Pesanan"
                    aria-label="Detail"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Edit */}
                  <Link
                    to={`/admin/orders/${order.id}/edit`}
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                      isDark
                        ? 'border-amber-600/40 bg-amber-950/30 text-amber-300'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                    title="Edit Pesanan"
                    aria-label="Edit"
                  >
                    <Pencil size={13} />
                  </Link>

                  {/* Hapus */}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(order)}
                      className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                        isDark
                          ? 'border-rose-600/40 bg-rose-950/30 text-rose-300'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                      title="Hapus Pesanan"
                      aria-label="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Cetak Nota */}
                  {onPrint && (
                    <button
                      type="button"
                      onClick={() => onPrint(order)}
                      className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                        isDark
                          ? 'border-red-600/40 bg-red-950/40 text-red-300'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                      title="Cetak Nota / Slip Dapur"
                      aria-label="Cetak Nota"
                    >
                      <Printer size={13} />
                    </button>
                  )}

                  {/* Invoice WA */}
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-2xs ${
                      isDark
                        ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-300'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                    title="Kirim Invoice WhatsApp"
                    aria-label="Invoice WA"
                  >
                    <Receipt size={13} />
                  </a>

                  {/* Link Testimoni */}
                  {order.status === 'completed' && (
                    <a
                      href={getWhatsAppTestimonialUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-2xs ${
                        isDark
                          ? 'border-amber-500/40 bg-amber-950/40 text-amber-400'
                          : 'border-amber-200 bg-amber-50 text-amber-600'
                      }`}
                      title="Kirim Link Testimoni WhatsApp"
                      aria-label="Link Testimoni"
                    >
                      <Star size={13} className="fill-amber-400 text-amber-500" />
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Status Dropdown on Mobile */}
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
                  className={`block w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium outline-none ${
                    isDark
                      ? 'border-[#60241E] bg-[#240E0C] text-stone-200 focus:border-[#F59E0B]'
                      : 'border-stone-200 bg-stone-50 text-stone-800 focus:border-red-600'
                  }`}
                >
                  <option value="pending">Ubah Status: Menunggu</option>
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
