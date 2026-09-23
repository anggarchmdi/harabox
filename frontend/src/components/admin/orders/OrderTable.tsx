import { useState } from 'react'
import {
  Calendar,
  Eye,
  MapPin,
  MessageCircle,
  Receipt,
  Star,
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

export function getWhatsAppInvoiceUrl(order: Order): string {
  const rawPhone = order.customers_phone.replace(/[^0-9]/g, '')
  const phone = rawPhone.startsWith('0')
    ? '62' + rawPhone.slice(1)
    : rawPhone.startsWith('62')
      ? rawPhone
      : '62' + rawPhone

  const itemsList =
    order.items && order.items.length > 0
      ? order.items
          .map((i) => {
            const addonsDetail =
              i.addons && i.addons.length > 0
                ? '\n' +
                  i.addons
                    .map(
                      (a) =>
                        `   └ ${a.addon_group_name ? `${a.addon_group_name}: ` : ''}${a.addon_name}`,
                    )
                    .join('\n')
                : ''
            return `• ${i.item_name} x ${i.quantity} porsi (Rp ${Number(i.subtotal).toLocaleString('id-ID')})${addonsDetail}`
          })
          .join('\n')
      : `• Paket Katering (Rp ${Number(order.subtotal).toLocaleString('id-ID')})`

  const statusLabel =
    {
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      processing: 'Sedang Diproses Dapur',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }[order.status] || order.status

  const paymentLabel =
    order.payment_status === 'paid'
      ? `Lunas (${order.payment_method || 'Terverifikasi'})`
      : order.payment_status === 'dp'
        ? `DP Masuk Rp ${Number(order.paid_amount).toLocaleString('id-ID')} (Sisa: Rp ${Math.max(0, Number(order.total) - Number(order.paid_amount)).toLocaleString('id-ID')})`
        : 'Belum Bayar'

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

Subtotal Menu: Rp ${Number(order.subtotal).toLocaleString('id-ID')}
Ongkos Kirim: Rp ${Number(order.delivery_fee).toLocaleString('id-ID')}
*TOTAL TAGIHAN: Rp ${Number(order.total).toLocaleString('id-ID')}*
-------------------------------
*Status Pesanan:* ${statusLabel}
*Status Pembayaran:* ${paymentLabel}
${order.notes ? `*Catatan Khusus:* ${order.notes}\n` : ''}
Silakan melakukan pembayaran ke rekening resmi HaraBox:
*Bank BCA: 1234567890*
*A/N: HaraBox Catering*

Mohon konfirmasi dan kirimkan bukti transfer ke nomor ini agar pesanan Anda dapat segera kami siapkan. Terima kasih!`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function getWhatsAppTestimonialUrl(order: Order): string {
  const rawPhone = order.customers_phone.replace(/[^0-9]/g, '')
  const phone = rawPhone.startsWith('0')
    ? '62' + rawPhone.slice(1)
    : rawPhone.startsWith('62')
      ? rawPhone
      : '62' + rawPhone

  // Hitung jumlah pesanan box produk utama tanpa addons
  const totalBox =
    order.items && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      : 0

  const quantityStr = totalBox > 0 ? `${totalBox} Box` : ''

  // URL ulasan tersembunyi
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://harabox.id'
  const params = new URLSearchParams()
  if (order.customers_name) params.set('name', order.customers_name)
  if (quantityStr) params.set('qty', quantityStr)
  if (order.order_code) params.set('order', order.order_code)

  const testimonialLink = `${origin}/testimoni?${params.toString()}`

  const message = `*TERIMA KASIH DARI HARABOX!* ✨
===============================
Halo Kak *${order.customers_name}*, terima kasih banyak telah mempercayakan konsumsi acara kepada HaraBox.

Pesanan Anda (*${order.order_code}* ${quantityStr ? `- ${quantityStr}` : ''}) telah selesai kami layani. Kami berharap seluruh sajian dinikmati dengan puas oleh seluruh tamu & keluarga.

Untuk membantu kami menjaga dan terus meningkatkan kualitas cita rasa serta pelayanan katering HaraBox, kami sangat berterima kasih jika Kakak berkenan meluangkan waktu 1 menit untuk mengisi ulasan melalui tautan berikut:

👉 ${testimonialLink}

Terima kasih banyak atas kepercayaannya! Semoga acaranya sukses dan berkesan, kami nantikan pesanan katering berikutnya. 🙏🍗`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export default function OrderTable({
  orders,
  onView,
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

                  {/* Actions */}
                  <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1.5">
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                        title="Kirim invoice resmi ke nomor WhatsApp pemesan"
                      >
                        <Receipt size={13} />
                        <span>Invoice WA</span>
                      </a>

                      {order.status === 'completed' && (
                        <a
                          href={getWhatsAppTestimonialUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-amber-600 transition"
                          title="Kirim link testimoni via WhatsApp ke pemesan"
                        >
                          <Star size={13} className="fill-white" />
                          <span>Link Testimoni</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onView(order)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Eye size={13} />
                        <span>Detail</span>
                      </button>
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

                  {order.status === 'completed' && (
                    <a
                      href={getWhatsAppTestimonialUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs"
                      title="Kirim link testimoni ke pemesan"
                    >
                      <Star size={13} className="fill-white" />
                      <span>Testimoni</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                      isDark
                        ? 'border-[#60241E] bg-[#240E0C] text-stone-200'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Detail</span>
                  </button>
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
