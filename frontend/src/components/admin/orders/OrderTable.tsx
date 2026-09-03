import { useState } from 'react'
import {
  Calendar,
  Eye,
  MapPin,
  MessageCircle,
  Receipt,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Order, OrderStatus } from '../../../types/orders'
import { ordersService } from '../../../services/orders.service'
import OrderStatusBadge from './OrderStatusBadge'

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
          .map(
            (i) =>
              `• ${i.item_name} x ${i.quantity} porsi (Rp ${Number(i.subtotal).toLocaleString('id-ID')})`,
          )
          .join('\n')
      : `• Paket Catering (Rp ${Number(order.subtotal).toLocaleString('id-ID')})`

  const statusLabel =
    {
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      processing: 'Sedang Diproses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }[order.status] || order.status

  const message = `*INVOICE PESANAN HARA CHICKEN*
===============================
Halo Kak *${order.customers_name}*, terima kasih telah memesan catering di Hara Chicken!

Berikut adalah rincian invoice resmi pesanan Anda:

*No. Pesanan:* ${order.order_code}
*Tanggal Acara:* ${formatDate(order.event_date)} ${order.event_time ? `(${order.event_time})` : ''}
*Alamat Pengantaran:* ${order.delivery_address}
-------------------------------
*Rincian Menu:*
${itemsList}

Subtotal Menu: Rp ${Number(order.subtotal).toLocaleString('id-ID')}
Ongkos Kirim: Rp ${Number(order.delivery_fee).toLocaleString('id-ID')}
*TOTAL TAGIHAN: Rp ${Number(order.total).toLocaleString('id-ID')}*
-------------------------------
*Status Pesanan:* ${statusLabel}
${order.notes ? `*Catatan Khusus:* ${order.notes}\n` : ''}
Silakan melakukan pembayaran ke rekening resmi Hara Chicken:
*Bank BCA: 1234567890*
*A/N: Hara Chicken*

Mohon konfirmasi dan kirimkan bukti transfer ke nomor ini agar pesanan Anda dapat segera kami siapkan. Terima kasih! 🙏`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export default function OrderTable({
  orders,
  onView,
  onStatusUpdated,
}: OrderTableProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const handleQuickStatusChange = async (
    order: Order,
    newStatus: OrderStatus,
  ) => {
    if (order.status === newStatus) return

    try {
      setUpdatingId(order.id)
      await ordersService.updateStatus(order.id, newStatus)
      toast.success(
        `Status order ${order.order_code} berhasil diubah ke "${newStatus}".`,
      )
      onStatusUpdated?.()
    } catch {
      toast.error('Gagal memperbarui status order.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <h3 className="text-lg font-bold text-gray-900">Belum ada order</h3>
        <p className="mt-2 text-sm text-gray-500">
          Order pelanggan akan muncul di sini saat ada pesanan baru.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Order Code
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Pemesan (Nama & WA)
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Menu & Porsi
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Acara & Alamat
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Tagihan
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                Status Pesanan
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                Aksi Invoice & Detail
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const invoiceUrl = getWhatsAppInvoiceUrl(order)
              const cleanPhone = order.customers_phone.replace(/[^0-9]/g, '')
              const waChatUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`

              return (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  {/* Order Code */}
                  <td className="px-6 py-4 align-top">
                    <div>
                      <p className="font-extrabold text-gray-900 font-mono text-sm">
                        {order.order_code}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </td>

                  {/* Customer (Name & Phone) */}
                  <td className="px-6 py-4 align-top">
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <User size={14} className="text-gray-400" />
                        {order.customers_name}
                      </p>
                      <a
                        href={waChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        title="Chat pelanggan via WhatsApp"
                      >
                        <MessageCircle size={13} />
                        {order.customers_phone}
                      </a>
                    </div>
                  </td>

                  {/* Menu items */}
                  <td className="px-6 py-4 align-top">
                    <div className="max-w-xs space-y-1">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="font-bold text-gray-900">
                              {item.item_name}
                            </span>
                            <span className="ml-1.5 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-black text-red-600">
                              {item.quantity} porsi
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">Menu Catering</p>
                      )}
                    </div>
                  </td>

                  {/* Event & Address */}
                  <td className="px-6 py-4 align-top">
                    <div className="max-w-xs">
                      <p className="font-semibold text-xs text-gray-900 flex items-center gap-1">
                        <Calendar size={13} className="text-gray-400" />
                        {formatDate(order.event_date)}
                        {order.event_time && (
                          <span className="text-gray-500 font-normal">
                            ({order.event_time})
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2 flex items-start gap-1">
                        <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                        <span>{order.delivery_address}</span>
                      </p>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 align-top">
                    <p className="font-extrabold text-sm text-gray-900">
                      {formatRupiah(order.total)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Subtotal: {formatRupiah(order.subtotal)}
                    </p>
                  </td>

                  {/* Status & Quick Status Changer */}
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-2">
                      <OrderStatusBadge status={order.status} />

                      {/* Dropdown status changer */}
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            order,
                            e.target.value as OrderStatus,
                          )
                        }
                        className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                      >
                        <option value="pending">⏳ Pending (Menunggu)</option>
                        <option value="processing">👨‍🍳 Proses (Diproses)</option>
                        <option value="completed">✅ Selesai (Completed)</option>
                        <option value="cancelled">❌ Canceled (Batal)</option>
                      </select>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      {/* Send Invoice WA Button */}
                      <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        title="Kirim invoice resmi ke nomor WhatsApp pemesan ini"
                      >
                        <Receipt size={14} />
                        Kirim Invoice WA
                      </a>

                      {/* Detail Button */}
                      <button
                        type="button"
                        onClick={() => onView(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
