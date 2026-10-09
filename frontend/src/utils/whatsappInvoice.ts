export interface WhatsAppInvoiceItemAddon {
  id?: number
  addon_group_name?: string
  addon_name?: string
  price?: string | number
  quantity?: number
  subtotal?: string | number
}

export interface WhatsAppInvoiceItem {
  id?: number
  item_name?: string
  name?: string
  price?: string | number
  quantity: number
  subtotal?: string | number
  addons?: WhatsAppInvoiceItemAddon[]
}

export interface WhatsAppInvoiceOrderData {
  id?: number
  order_code?: string
  customers_name?: string
  customers_phone?: string
  event_date?: string
  event_time?: string | null
  delivery_address?: string | null
  notes?: string | null
  subtotal?: string | number
  delivery_fee?: string | number
  total?: string | number
  status?: string
  payment_status?: string
  paid_amount?: string | number
  payment_method?: string | null
  items?: WhatsAppInvoiceItem[]
}

function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

function formatNumberRupiah(num: number | string): string {
  return Number(num || 0).toLocaleString('id-ID')
}

export function formatWhatsAppPhone(rawPhone?: string): string {
  if (!rawPhone) return ''
  const cleaned = rawPhone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.slice(1)
  }
  if (cleaned.startsWith('62')) {
    return cleaned
  }
  return cleaned ? '62' + cleaned : ''
}

export function getWhatsAppInvoiceMessage(order: WhatsAppInvoiceOrderData): string {
  const customerName = order.customers_name || 'Pelanggan'
  const orderCode = order.order_code || '-'
  const deliveryAddress = order.delivery_address || '-'

  const eventDateFormatted = formatDateIndo(order.event_date)
  const eventTimeFormatted = order.event_time ? ` (${order.event_time})` : ''

  // Rincian Menu & Addons
  const itemsList =
    order.items && order.items.length > 0
      ? order.items
          .map((item) => {
            const itemName = item.item_name || item.name || 'Paket Katering'
            const itemQty = item.quantity || 1
            const itemSubtotal = item.subtotal
              ? ` (Rp ${formatNumberRupiah(item.subtotal)})`
              : ''

            const addonsDetail =
              item.addons && item.addons.length > 0
                ? '\n' +
                  item.addons
                    .map(
                      (addon) =>
                        `   └ ${addon.addon_group_name ? `${addon.addon_group_name}: ` : ''}${addon.addon_name || 'Opsi'}`,
                    )
                    .join('\n')
                : ''

            return `• ${itemName} x ${itemQty} porsi${itemSubtotal}${addonsDetail}`
          })
          .join('\n')
      : `• Paket Katering (Rp ${formatNumberRupiah(order.subtotal || order.total || 0)})`

  // Financials
  const subtotalVal = Number(order.subtotal || order.total || 0)
  const deliveryFeeVal = Number(order.delivery_fee || 0)
  const totalVal = Number(order.total || 0)
  const paidAmountVal = Number(order.paid_amount || 0)
  const remainingVal = Math.max(0, totalVal - paidAmountVal)

  // Status mapping
  const statusKey = (order.status || 'pending').toLowerCase()
  const statusLabel =
    {
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      processing: 'Sedang Diproses Dapur',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }[statusKey] || (order.status ?? 'Menunggu Konfirmasi')

  const paymentKey = (order.payment_status || 'unpaid').toLowerCase()
  const isCancelled = statusKey === 'cancelled'
  const isPaid = paymentKey === 'paid'
  const isDp = paymentKey === 'dp'

  let paymentLabel = 'Belum Bayar'
  if (isCancelled) {
    paymentLabel = 'Dibatalkan'
  } else if (isPaid) {
    paymentLabel = `LUNAS${order.payment_method ? ` (${order.payment_method})` : ''}`
  } else if (isDp) {
    paymentLabel = `DP Masuk Rp ${formatNumberRupiah(paidAmountVal)} (Sisa: Rp ${formatNumberRupiah(remainingVal)})`
  }

  // Section Pembayaran Bersyarat (TIDAK ditagih jika sudah LUNAS atau DIBATALKAN)
  let paymentInstructionSection = ''
  if (isCancelled) {
    paymentInstructionSection = `Pesanan ini telah DIBATALKAN. Apabila ada pertanyaan atau kebutuhan katering di lain waktu, silakan hubungi kami kembali. Terima kasih!`
  } else if (isPaid) {
    paymentInstructionSection = `Pesanan Anda telah LUNAS dan sedang disiapkan dengan baik oleh tim Pawon Hara. Terima kasih banyak atas kepercayaan Anda! 🙏`
  } else {
    paymentInstructionSection = `Silakan melakukan pembayaran ke rekening resmi Pawon Hara:
*Bank BSI*
*No. Rekening:* 7881113346
*A/N:* CV AYAM GEPREK PARANGTRITIS

Mohon konfirmasi dan kirimkan bukti transfer ke nomor ini agar pesanan Anda dapat segera kami siapkan. Terima kasih!`
  }

  const notesSection = order.notes ? `*Catatan Khusus:* ${order.notes}\n` : ''

  return `*INVOICE PESANAN PAWON HARA*
===============================
Halo Kak *${customerName}*, terima kasih telah memesan katering di Pawon Hara!

Berikut adalah rincian invoice resmi pesanan Anda:

*No. Pesanan:* ${orderCode}
*Tanggal Acara:* ${eventDateFormatted}${eventTimeFormatted}
*Alamat Pengantaran:* ${deliveryAddress}
-------------------------------
*Rincian Menu:*
${itemsList}

Subtotal Menu: Rp ${formatNumberRupiah(subtotalVal)}
Ongkos Kirim: Rp ${formatNumberRupiah(deliveryFeeVal)}
*TOTAL TAGIHAN: Rp ${formatNumberRupiah(totalVal)}*
-------------------------------
*Status Pesanan:* ${statusLabel}
*Status Pembayaran:* ${paymentLabel}
${notesSection}
${paymentInstructionSection}`
}

export function getWhatsAppInvoiceUrl(order: WhatsAppInvoiceOrderData): string {
  const phone = formatWhatsAppPhone(order.customers_phone)
  const message = getWhatsAppInvoiceMessage(order)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function getWhatsAppTestimonialUrl(order: WhatsAppInvoiceOrderData): string {
  const phone = formatWhatsAppPhone(order.customers_phone)

  const totalBox =
    order.items && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      : 0

  const quantityStr = totalBox > 0 ? `${totalBox} Box` : ''

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://harabox.id'
  const params = new URLSearchParams()
  if (order.customers_name) params.set('name', order.customers_name)
  if (quantityStr) params.set('qty', quantityStr)
  if (order.order_code) params.set('order', order.order_code)

  const testimonialLink = `${origin}/testimoni?${params.toString()}`

  const message = `*TERIMA KASIH DARI PAWON HARA!* ✨
===============================
Halo Kak *${order.customers_name || 'Pelanggan'}*, terima kasih banyak telah mempercayakan pesanan katering (${order.order_code || '-'}) kepada *Pawon Hara*.

Bagikan pengalaman Anda menikmati hidangan kami melalui tautan berikut:
👉 ${testimonialLink}

Ulasan Anda sangat berarti bagi kami untuk terus menjaga mutu rasa & pelayanan terbaik. Semoga harimu menyenangkan! 🙏`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
