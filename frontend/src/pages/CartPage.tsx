import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  X,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '../stores/cart.store'
import { ordersService } from '../services/orders.service'
import { getImageUrl } from '../utils/image'
import PageLoader from '../components/ui/PageLoader'

// Fallback images
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'

function getProductFallbackImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('katsu') || n.includes('bento')) return BentoKatsuImg
  if (n.includes('telur')) return BentoTelurImg
  if (n.includes('kuning') && n.includes('paha')) return NasiKuningPahaImg
  if (n.includes('kuning')) return NasiKuningBaladoImg
  if (n.includes('rames') && n.includes('paha')) return RamesPahaImg
  if (n.includes('rames')) return RamesBaladoImg
  if (n.includes('dada')) return KrisbarDadaImg
  if (n.includes('krisbar')) return KrisbarPahaImg
  if (n.includes('ekonomis')) return EkonomisBaladoImg
  return BentoKatsuImg
}

function formatMinDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const monthIndex = parseInt(parts[1], 10) - 1
      const day = parts[2]
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ]
      return `${day} ${months[monthIndex]} ${year}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export default function CartPage() {
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 650)
    return () => clearTimeout(timer)
  }, [])

  const {
    items,
    removeItem,
    removeSelected,
    updateQuantity,
    stepQuantity,
    toggleSelect,
    selectAll,
    clearOrderedItems,
    getSelectedItems,
    getSelectedDistinctItems,
    getSelectedTotalPortions,
    getSelectedSubtotal,
    getSelectedMaxLeadTimeDays,
  } = useCartStore()

  // Checkout modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedItems = getSelectedItems()
  const selectedDistinctCount = getSelectedDistinctItems()
  const selectedTotalPortions = getSelectedTotalPortions()
  const selectedSubtotal = getSelectedSubtotal()
  const selectedMaxLeadDays = getSelectedMaxLeadTimeDays()
  const deliveryFee = selectedDistinctCount > 0 ? 10000 : 0
  const grandTotal = selectedSubtotal + deliveryFee

  const isAllSelected = items.length > 0 && items.every((i) => i.selected)

  // Calculate earliest allowable event date for selected items
  const minDateString = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + selectedMaxLeadDays)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [selectedMaxLeadDays])

  const isDateInvalid = useMemo(() => {
    if (!eventDate || !minDateString) return false
    return eventDate < minDateString
  }, [eventDate, minDateString])

  const handleOpenCheckout = () => {
    if (selectedDistinctCount === 0) {
      toast.error('Silakan pilih minimal 1 menu di keranjang untuk dipesan.')
      return
    }

    if (!eventDate) {
      setEventDate(minDateString)
    }
    setIsModalOpen(true)
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      toast.error('Tidak ada menu yang dipilih.')
      return
    }

    if (!customerName.trim()) {
      toast.error('Mohon isi nama lengkap Anda.')
      return
    }

    if (!customerPhone.trim() || customerPhone.length < 9) {
      toast.error('Mohon isi nomor WhatsApp aktif yang valid.')
      return
    }

    if (!eventDate) {
      toast.error('Mohon tentukan tanggal acara Anda.')
      return
    }

    if (isDateInvalid) {
      toast.error(
        `Untuk menu yang dipilih, pemesanan minimal H-${selectedMaxLeadDays} sebelum acara (paling cepat tanggal ${formatMinDateLabel(minDateString)}).`
      )
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error('Mohon isi alamat pengantaran / lokasi acara.')
      return
    }

    try {
      setIsSubmitting(true)

      // Payload items for backend
      const payloadItems = selectedItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        addons:
          item.addons && item.addons.length > 0
            ? item.addons.map((a) => ({ addon_id: a.addon_id }))
            : undefined,
      }))

      // 1. Send multi-item order to backend
      const createdOrder = await ordersService.create({
        customers_name: customerName.trim(),
        customers_phone: customerPhone.trim(),
        event_date: eventDate,
        event_time: eventTime || undefined,
        delivery_address: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
        items: payloadItems,
      })

      const orderCode = createdOrder.order_code

      // 2. Remove only the ordered items from the cart store
      const orderedIds = selectedItems.map((i) => i.id)
      clearOrderedItems(orderedIds)

      toast.success(`Pesanan ${orderCode} berhasil dicatat! Menghubungkan ke WhatsApp...`)

      // 3. Construct WhatsApp multi-item message
      const itemBlocks = selectedItems.map((item, idx) => {
        const addonLines =
          item.addons && item.addons.length > 0
            ? item.addons
                .map((a) =>
                  a.price > 0
                    ? `     - ${a.addon_name}: +Rp ${a.price.toLocaleString('id-ID')} x ${item.quantity} porsi`
                    : `     - ${a.addon_name}: Termasuk Paket`
                )
                .join('\n')
            : ''

        return `${idx + 1}. *${item.product_name}*
   • Jumlah: *${item.quantity} Porsi* (@ Rp ${item.unit_price.toLocaleString('id-ID')})
${addonLines ? `   • Kustomisasi / Addon:\n${addonLines}\n` : ''}   • Subtotal Menu: *Rp ${item.subtotal.toLocaleString('id-ID')}*`
      })

      const waText = `Halo Hara Chicken, saya ingin memesan beberapa paket catering:

*Rincian Pesanan:*
- No. Pesanan: *${orderCode}*
- Total Menu: *${selectedDistinctCount} Menu (${selectedTotalPortions} Porsi)*

${itemBlocks.join('\n\n')}

-----------------------------------------
- Subtotal Menu: *Rp ${selectedSubtotal.toLocaleString('id-ID')}*
- Estimasi Ongkir: *Rp ${deliveryFee.toLocaleString('id-ID')}*
- Total Estimasi: *Rp ${grandTotal.toLocaleString('id-ID')}*

- Tanggal Acara: *${eventDate}* ${eventTime ? `(Jam: ${eventTime})` : ''}
- Alamat Pengantaran: *${deliveryAddress.trim()}*
${notes.trim() ? `- Catatan Khusus: *${notes.trim()}*\n` : ''}
*Data Pemesan:*
- Nama: *${customerName.trim()}*
- No. WA: *${customerPhone.trim()}*

Mohon dicek ketersediaannya dan kirimkan invoice resminya ya. Terima kasih!`

      const waUrl = `https://wa.me/6289669743193?text=${encodeURIComponent(waText)}`

      setIsModalOpen(false)
      window.open(waUrl, '_blank')
      navigate(`/cek-pesanan?code=${orderCode}`)
    } catch (err: unknown) {
      console.error(err)
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
      const serverMessage = errorObj?.response?.data?.message || errorObj?.message
      toast.error(
        serverMessage || 'Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] pb-32 sm:pb-36 lg:pb-28 text-zinc-900 selection:bg-zinc-950 selection:text-white">
      {/* Branded Initial Page Loader */}
      <PageLoader
        isLoading={pageLoading}
        text="Menyiapkan Keranjang Pesanan..."
        subtext="Memeriksa daftar paket menu katering dan rincian pesanan Anda"
        minDuration={650}
      />
      <section className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
        {/* Navigation & Header Bar */}
        <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs sm:text-sm font-bold text-zinc-600 border border-zinc-200/80 shadow-2xs transition hover:text-zinc-950 hover:border-zinc-300"
          >
            <ArrowLeft size={15} />
            <span>Lanjut Pilih Menu Lain</span>
          </Link>

          {items.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 border border-zinc-200/60">
              {items.length} Menu di Keranjang
            </span>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md">
              <ShoppingCart size={20} className="sm:h-[22px] sm:w-[22px]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-zinc-950">
                Keranjang Pesanan
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                Pilih menu katering Anda dan pesan langsung ke WhatsApp Admin
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-12 lg:p-16 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/80 mb-4 sm:mb-5">
              <ShoppingBag size={32} className="sm:h-9 sm:w-9" />
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-zinc-950 mb-2">
              Keranjang Masih Kosong
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mb-6 leading-relaxed">
              Anda belum menambahkan menu katering ke keranjang. Yuk jelajahi aneka paket nasi box, bento, dan krisbar spesial kami untuk acaramu!
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-zinc-800 active:scale-95"
            >
              <ShoppingCart size={16} />
              Jelajahi Menu Katering
            </Link>
          </div>
        ) : (
          /* Cart Content Layout (2 Columns on Desktop) */
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] gap-6 lg:gap-8 items-start">
            {/* LEFT COLUMN: Cart Items List */}
            <div className="space-y-3.5 sm:space-y-4">
              {/* Select All & Bulk Actions Bar */}
              <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-3.5 py-3 sm:px-5 sm:py-3.5 shadow-2xs">
                <label className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => selectAll(e.target.checked)}
                    className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-md border-zinc-300 text-zinc-950 accent-zinc-950 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">
                    Pilih Semua{' '}
                    <span className="text-zinc-500 font-semibold text-[11px] sm:text-xs">
                      ({selectedDistinctCount}/{items.length} Menu)
                    </span>
                  </span>
                </label>

                {selectedDistinctCount > 0 && (
                  <button
                    type="button"
                    onClick={removeSelected}
                    className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 transition"
                  >
                    <Trash2 size={13} />
                    <span className="hidden xs:inline">Hapus Terpilih</span>
                    <span className="xs:hidden">Hapus</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3 sm:space-y-4">
                {items.map((item) => {
                  const displayImg =
                    getImageUrl(item.product_image) ||
                    getProductFallbackImage(item.product_name)

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 transition-all shadow-xs ${
                        item.selected
                          ? 'border-zinc-300/90 bg-white ring-1 ring-zinc-950/5'
                          : 'border-zinc-200 bg-zinc-50/50 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Top Row: Checkbox + Image + Details + Delete */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Checkbox */}
                        <div className="pt-1 shrink-0">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelect(item.id)}
                            className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-md border-zinc-300 text-zinc-950 accent-zinc-950 cursor-pointer"
                          />
                        </div>

                        {/* Product Image Thumbnail */}
                        <div className="h-18 w-18 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200/80 bg-zinc-100 relative">
                          <img
                            src={displayImg}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Product Info & Delete button */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 pr-1">
                              <Link
                                to={`/menu/${item.product_slug}`}
                                className="text-xs sm:text-base font-black text-zinc-950 hover:text-red-600 transition line-clamp-2 leading-snug"
                              >
                                {item.product_name}
                              </Link>

                              <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-zinc-600">
                                  Min. {item.minimum_order} Porsi
                                </span>
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-800 border border-amber-200/60">
                                  {item.portion_mode === 'kelipatan10' ? 'Kelipatan 10' : 'Bebas Satuan'}
                                </span>
                              </div>
                            </div>

                            {/* Delete single item button */}
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="shrink-0 -mr-1 -mt-1 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Hapus menu dari keranjang"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Price per unit */}
                          <div className="mt-1.5 flex items-baseline gap-1">
                            <span className="text-[11px] font-semibold text-zinc-400">Harga:</span>
                            <span className="text-xs sm:text-sm font-bold text-zinc-800">
                              Rp {item.unit_price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-zinc-400">/ porsi</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section: Selected Addons Badges (Indented cleanly) */}
                      {item.addons && item.addons.length > 0 ? (
                        <div className="mt-3 rounded-xl bg-zinc-50/90 border border-zinc-200/60 p-2 sm:p-2.5 sm:ml-9">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                            Kustomisasi / Add-on Terpilih:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.addons.map((a, aIdx) => (
                              <span
                                key={aIdx}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-zinc-700 border border-zinc-200/80 shadow-2xs"
                              >
                                <span className="font-bold text-zinc-900">{a.addon_group_name}:</span>
                                <span>{a.addon_name}</span>
                                {a.price > 0 && (
                                  <span className="text-emerald-700 font-semibold">
                                    (+Rp {a.price.toLocaleString('id-ID')})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Bottom Section: Stepper & Subtotal */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 sm:ml-9">
                        {/* Subtotal */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Subtotal ({item.quantity} Porsi)
                          </p>
                          <p className="text-sm sm:text-base font-black text-zinc-950">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Stepper Counter */}
                        <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 sm:p-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() => stepQuantity(item.id, 'decrease')}
                            disabled={item.quantity <= item.minimum_order}
                            className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-xs transition hover:bg-zinc-100 hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                            title={`Kurangi porsi (minimal ${item.minimum_order})`}
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>

                          <div className="px-2 sm:px-2.5 flex items-baseline gap-0.5">
                            <input
                              type="number"
                              value={item.quantity}
                              step={item.step}
                              min={item.minimum_order}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value, 10) || item.minimum_order)
                              }
                              className="w-10 sm:w-12 text-center text-xs sm:text-sm font-black text-zinc-950 bg-transparent outline-none"
                            />
                            <span className="text-[10px] font-bold text-zinc-400">porsi</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => stepQuantity(item.id, 'increase')}
                            className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-xs transition hover:bg-zinc-800 active:scale-95"
                            title="Tambah porsi"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary Card (Sticky on desktop, bottom details on mobile) */}
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span>Ringkasan Pesanan</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                    {selectedDistinctCount} Menu Terpilih
                  </span>
                </h3>

                {/* Calculation Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Total Porsi Terpilih:</span>
                    <span className="font-bold text-zinc-950">{selectedTotalPortions} Porsi</span>
                  </div>

                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal Menu:</span>
                    <span className="font-bold text-zinc-950">
                      Rp {selectedSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-600">
                    <span className="flex items-center gap-1">
                      Biaya Pengiriman:
                      <Info size={13} className="text-zinc-400" />
                    </span>
                    <span className="font-semibold text-zinc-800">
                      {selectedDistinctCount > 0 ? `Rp ${deliveryFee.toLocaleString('id-ID')}` : 'Rp 0'}
                    </span>
                  </div>

                  {/* Lead Time Notice for Selected Items */}
                  {selectedMaxLeadDays > 0 && (
                    <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-amber-950">
                      <div className="flex items-start gap-2">
                        <Clock size={15} className="text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-snug">
                          <p className="font-bold text-amber-900">
                            Batas Waktu Pemesanan (H-{selectedMaxLeadDays})
                          </p>
                          <p className="text-amber-800 mt-0.5">
                            Pemesanan kombinasi menu ini minimal dilakukan H-{selectedMaxLeadDays} sebelum acara.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-zinc-200/70 pt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-zinc-900">
                        Total Estimasi
                      </p>
                      <p className="text-[10px] text-zinc-400">Harga final via invoice katering</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Checkout CTA (Desktop Only, mobile uses sticky bottom bar) */}
                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  disabled={selectedDistinctCount === 0}
                  className="hidden lg:inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <MessageCircle size={20} />
                  <span>
                    {selectedDistinctCount > 0
                      ? `Pesan ${selectedDistinctCount} Menu Sekarang`
                      : 'Pilih Menu untuk Memesan'}
                  </span>
                </button>

                <p className="hidden lg:block text-center text-[11px] text-zinc-400">
                  Pesanan akan dibuat menjadi 1 nomor invoice dan diteruskan ke WhatsApp Admin.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          MOBILE STICKY BOTTOM CHECKOUT BAR (App-like UX)
      ====================================================== */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
            {/* Left: Checkbox "Semua" + Total price */}
            <div className="flex items-center gap-2.5 min-w-0">
              <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border-zinc-300 text-zinc-950 accent-zinc-950 cursor-pointer"
                />
                <span className="text-xs font-bold text-zinc-800">Semua</span>
              </label>

              <div className="border-l border-zinc-200 pl-2.5 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 leading-tight truncate">
                  Total ({selectedTotalPortions} Porsi)
                </p>
                <p className="text-base font-black text-emerald-700 truncate leading-tight mt-0.5">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Right: Checkout Button */}
            <button
              type="button"
              onClick={handleOpenCheckout}
              disabled={selectedDistinctCount === 0}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4.5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle size={16} />
              <span>
                {selectedDistinctCount > 0
                  ? `Pesan (${selectedDistinctCount})`
                  : 'Pilih Menu'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          MULTI-ITEM CART CHECKOUT MODAL (Bottom-sheet on mobile)
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-t-[2rem] sm:rounded-3xl bg-white shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            {/* Modal Header */}
            <div className="border-b border-zinc-100 px-5 sm:px-6 py-4 bg-[#fafaf9] shrink-0">
              {/* Mobile grab handle */}
              <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto mb-3 sm:hidden" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-950 text-sm sm:text-base">
                      Konfirmasi Pesanan Keranjang
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {selectedDistinctCount} Menu Terpilih • {selectedTotalPortions} Porsi
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Order Summary Box */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2 text-xs">
                <p className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                  Daftar Menu yang Dipesan:
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-baseline text-zinc-700">
                      <span className="truncate pr-2">
                        {item.product_name} ({item.quantity} porsi)
                      </span>
                      <span className="font-mono font-semibold shrink-0">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-200/70 pt-2 flex justify-between items-baseline font-bold text-zinc-950">
                  <span>Total ({selectedDistinctCount} Menu):</span>
                  <span className="text-emerald-700 font-mono font-black text-sm">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Tanggal Acara <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={minDateString}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={`w-full h-11 rounded-xl border pl-10 pr-3 text-xs sm:text-sm font-medium outline-none transition ${
                        isDateInvalid
                          ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                          : 'border-zinc-200 bg-zinc-50/60 focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10'
                      }`}
                    />
                  </div>
                  {isDateInvalid && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
                      <AlertCircle size={14} className="shrink-0 text-red-600 mt-0.5" />
                      <span>
                        Pemesanan minimal H-{selectedMaxLeadDays} sebelum acara (paling cepat {formatMinDateLabel(minDateString)}).
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Jam Acara (Kira-kira)
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-3 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Lengkap Pemesan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-3 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-3 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Alamat Pengantaran / Lokasi Acara <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-zinc-400 pointer-events-none" />
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah/gedung, kelurahan, patokan lokasi..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-3 py-2.5 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Catatan Khusus (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Sambal dipisah, minta sendok ekstra, titip di satpam..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                />
              </div>

              {/* Modal Sticky Footer Actions inside Form */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isDateInvalid || !eventDate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <MessageCircle size={16} />
                      <span>Kirim Pesanan via WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
