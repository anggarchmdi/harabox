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
import { useQuery } from '@tanstack/react-query'
import { useThemeStore } from '../stores/theme.store'
import { useCartStore } from '../stores/cart.store'
import { ordersService } from '../services/orders.service'
import { settingsService } from '../services/settings.service'
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
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'
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

  // Realtime Kitchen Capacity check for selected event date
  const { data: dateCapacity } = useQuery({
    queryKey: ['capacity-check', eventDate],
    queryFn: () => settingsService.checkCapacity(eventDate),
    enabled: Boolean(eventDate && !isDateInvalid),
  })

  const isDateClosed = Boolean(dateCapacity?.is_closed)
  const isDateFull = Boolean(dateCapacity && !dateCapacity.is_closed && dateCapacity.remaining_portions <= 0)
  const isExceedingCapacity = Boolean(
    dateCapacity && !dateCapacity.is_closed && selectedTotalPortions > dateCapacity.remaining_portions
  )

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

    if (isDateClosed) {
      toast.error('Dapur libur pada tanggal tersebut. Silakan pilih tanggal lain.')
      return
    }

    if (isDateFull) {
      toast.error('Kapasitas dapur untuk tanggal tersebut sudah penuh (maksimal tercapai).')
      return
    }

    if (isExceedingCapacity) {
      toast.error(
        `Kapasitas dapur tanggal tersebut tersisa ${dateCapacity?.remaining_portions} box (pesanan Anda: ${selectedTotalPortions} box).`
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

      const waText = `Halo Pawon Hara, saya ingin memesan beberapa paket catering:

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
    <main className={`min-h-screen overflow-x-clip pb-32 sm:pb-36 lg:pb-28 transition-colors duration-300 ${
      isDark
        ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
        : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-white'
    }`}>
      {/* Branded Initial Page Loader */}
      <PageLoader
        isLoading={pageLoading}
        text="Menyiapkan Keranjang Pesanan..."
        subtext="Memeriksa daftar paket katering dan rincian pesanan Pawon Hara"
        minDuration={650}
      />
      <section className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
        {/* Navigation & Header Bar */}
        <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/menu"
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-2xs transition ${
              isDark
                ? 'bg-[#2D120F] text-amber-200 border border-[#60241E] hover:text-white hover:border-[#F59E0B] hover:bg-[#3B1814]'
                : 'bg-white text-[#5C3831] border border-[#E6DACD] hover:text-[#2B120E] hover:border-[#D97706] hover:bg-[#FAF5EE]'
            }`}
          >
            <ArrowLeft size={15} />
            <span>Lanjut Pilih Menu Lain</span>
          </Link>

          {items.length > 0 && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${
              isDark
                ? 'bg-[#2D120F] text-amber-300 border-[#60241E]'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {items.length} Menu di Keranjang
            </span>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60241E] via-[#95271D] to-[#E77B49] text-amber-300 shadow-md ring-1 ring-[#F59E0B]/30">
              <ShoppingCart size={20} className="sm:h-[22px] sm:w-[22px]" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-dhaksinarga tracking-wide font-black ${
                isDark ? 'text-white' : 'text-[#2B120E]'
              }`}>
                Keranjang Pesanan
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${
                isDark ? 'text-amber-100/70' : 'text-[#5C3831]'
              }`}>
                Pilih paket katering Anda dan pesan langsung ke WhatsApp Admin Pawon Hara
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className={`rounded-3xl border p-6 sm:p-12 lg:p-16 text-center shadow-xl ${
            isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
          }`}>
            <div className={`mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl border mb-4 sm:mb-5 ${
              isDark ? 'bg-[#2D120F] text-amber-400 border-[#60241E]' : 'bg-[#FAF5EE] text-[#D97706] border-[#E6DACD]'
            }`}>
              <ShoppingBag size={32} className="sm:h-9 sm:w-9" />
            </div>
            <h2 className={`text-lg sm:text-2xl font-dhaksinarga tracking-wide font-black mb-2 ${
              isDark ? 'text-white' : 'text-[#2B120E]'
            }`}>
              Keranjang Masih Kosong
            </h2>
            <p className={`text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed ${
              isDark ? 'text-amber-100/70' : 'text-[#5C3831]'
            }`}>
              Anda belum menambahkan menu katering ke keranjang. Yuk jelajahi aneka paket nasi box, bento, dan tumpeng mini spesial kami untuk acaramu!
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-md transition hover:brightness-110 active:scale-95"
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
              <div className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 sm:px-5 sm:py-3.5 shadow-2xs ${
                isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
              }`}>
                <label className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => selectAll(e.target.checked)}
                    className={`h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-md accent-[#F59E0B] cursor-pointer ${
                      isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#FAF5EE]'
                    }`}
                  />
                  <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                    Pilih Semua{' '}
                    <span className={`font-semibold text-[11px] sm:text-xs ${
                      isDark ? 'text-amber-300/80' : 'text-[#8C4320]'
                    }`}>
                      ({selectedDistinctCount}/{items.length} Menu)
                    </span>
                  </span>
                </label>

                {selectedDistinctCount > 0 && (
                  <button
                    type="button"
                    onClick={removeSelected}
                    className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-red-950/60 border border-red-800/80 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/60 hover:text-white transition cursor-pointer"
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
                      className={`relative rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 transition-all shadow-md ${
                        item.selected
                          ? isDark
                            ? 'border-[#F59E0B]/60 bg-[#240E0C] ring-1 ring-[#F59E0B]/30'
                            : 'border-[#D97706] bg-white shadow-md ring-1 ring-[#D97706]/30'
                          : isDark
                            ? 'border-[#60241E]/70 bg-[#1C0B09]/80 opacity-75 hover:opacity-100'
                            : 'border-[#E6DACD] bg-[#FAF5EE] opacity-80 hover:opacity-100'
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
                            className={`h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-md accent-[#F59E0B] cursor-pointer ${
                              isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#FAF5EE]'
                            }`}
                          />
                        </div>

                        {/* Product Image Thumbnail */}
                        <div className={`h-18 w-18 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border relative ${
                          isDark ? 'border-[#60241E] bg-[#2D120F]' : 'border-[#E6DACD] bg-[#FAF5EE]'
                        }`}>
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
                                className={`text-xs sm:text-base font-dhaksinarga tracking-wide font-black transition line-clamp-2 leading-snug ${
                                  isDark ? 'text-white hover:text-[#F59E0B]' : 'text-[#2B120E] hover:text-[#D97706]'
                                }`}
                              >
                                {item.product_name}
                              </Link>

                              <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
                                  isDark ? 'bg-[#2D120F] border-[#60241E] text-amber-200' : 'bg-[#FAF5EE] border-[#E6DACD] text-[#5C3831]'
                                }`}>
                                  Min. {item.minimum_order} Porsi
                                </span>
                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold border ${
                                  isDark ? 'bg-[#2D120F] text-amber-300 border-[#F59E0B]/40' : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}>
                                  {item.portion_mode === 'kelipatan10' ? 'Kelipatan 10' : 'Bebas Satuan'}
                                </span>
                              </div>
                            </div>

                            {/* Delete single item button */}
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className={`shrink-0 -mr-1 -mt-1 rounded-lg p-1.5 transition cursor-pointer ${
                                isDark ? 'text-stone-400 hover:bg-red-950/50 hover:text-red-400' : 'text-[#6B423A] hover:bg-red-50 hover:text-red-600'
                              }`}
                              title="Hapus menu dari keranjang"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Price per unit */}
                          <div className="mt-1.5 flex items-baseline gap-1">
                            <span className={`text-[11px] font-semibold ${isDark ? 'text-stone-400' : 'text-[#6B423A]'}`}>Harga:</span>
                            <span className="text-xs sm:text-sm font-bold text-[#F59E0B]">
                              Rp {item.unit_price.toLocaleString('id-ID')}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-[#6B423A]'}`}>/ porsi</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section: Selected Addons Badges (Indented cleanly) */}
                      {item.addons && item.addons.length > 0 ? (
                        <div className={`mt-3 rounded-xl border p-2 sm:p-2.5 sm:ml-9 ${
                          isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-[#FAF5EE] border-[#E6DACD]'
                        }`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                            isDark ? 'text-amber-300/70' : 'text-[#8C4320]'
                          }`}>
                            Kustomisasi / Add-on Terpilih:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.addons.map((a, aIdx) => (
                              <span
                                key={aIdx}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-medium border ${
                                  isDark ? 'bg-[#2D120F] text-amber-100 border-[#60241E]' : 'bg-white text-[#5C3831] border-[#E6DACD]'
                                }`}
                              >
                                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#B45309]'}`}>{a.addon_group_name}:</span>
                                <span>{a.addon_name}</span>
                                {a.price > 0 && (
                                  <span className={`font-semibold ${isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'}`}>
                                    (+Rp {a.price.toLocaleString('id-ID')})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Bottom Section: Stepper & Subtotal */}
                      <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 sm:ml-9 ${
                        isDark ? 'border-[#60241E]/80' : 'border-[#E6DACD]'
                      }`}>
                        {/* Subtotal */}
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'text-stone-400' : 'text-[#6B423A]'
                          }`}>
                            Subtotal ({item.quantity} Porsi)
                          </p>
                          <p className={`text-sm sm:text-base font-dhaksinarga tracking-wide font-black ${
                            isDark ? 'text-white' : 'text-[#2B120E]'
                          }`}>
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Stepper Counter */}
                        <div className={`inline-flex items-center rounded-xl border p-0.5 sm:p-1 ${
                          isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#FAF5EE]'
                        }`}>
                          <button
                            type="button"
                            onClick={() => stepQuantity(item.id, 'decrease')}
                            disabled={item.quantity <= item.minimum_order}
                            className={`flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer ${
                              isDark ? 'bg-[#2D120F] text-stone-300 hover:bg-[#3B1814] hover:text-white' : 'bg-white text-[#2B120E] hover:bg-[#F5EDE4] hover:text-[#2B120E]'
                            }`}
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
                              className={`w-10 sm:w-12 text-center text-xs sm:text-sm font-black bg-transparent outline-none ${
                                isDark ? 'text-amber-300' : 'text-[#2B120E]'
                              }`}
                            />
                            <span className={`text-[10px] font-bold ${isDark ? 'text-stone-400' : 'text-[#6B423A]'}`}>porsi</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => stepQuantity(item.id, 'increase')}
                            className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] font-bold transition hover:brightness-110 active:scale-95 cursor-pointer"
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
              <div className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-4 ${
                isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-white text-[#2B120E]'
              }`}>
                <h3 className={`text-sm font-dhaksinarga tracking-wide font-black uppercase border-b pb-3 flex items-center justify-between ${
                  isDark ? 'border-[#60241E] text-white' : 'border-[#E6DACD] text-[#2B120E]'
                }`}>
                  <span>Ringkasan Pesanan</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                    isDark ? 'bg-[#2D120F] border-[#60241E] text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900'
                  }`}>
                    {selectedDistinctCount} Menu Terpilih
                  </span>
                </h3>

                {/* Calculation Details */}
                <div className="space-y-2.5 text-xs">
                  <div className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'}`}>
                    <span>Total Porsi Terpilih:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>{selectedTotalPortions} Porsi</span>
                  </div>

                  <div className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'}`}>
                    <span>Subtotal Menu:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                      Rp {selectedSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'}`}>
                    <span className="flex items-center gap-1">
                      Biaya Pengiriman:
                      <Info size={13} className={isDark ? 'text-amber-400' : 'text-[#D97706]'} />
                    </span>
                    <span className={`font-semibold ${isDark ? 'text-amber-200' : 'text-[#8C4320]'}`}>
                      {selectedDistinctCount > 0 ? `Rp ${deliveryFee.toLocaleString('id-ID')}` : 'Rp 0'}
                    </span>
                  </div>

                  {/* Lead Time Notice for Selected Items */}
                  {selectedMaxLeadDays > 0 && (
                    <div className={`mt-3 rounded-2xl border p-3 ${
                      isDark ? 'border-[#60241E] bg-[#2D120F] text-amber-100' : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831]'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Clock size={15} className={`shrink-0 mt-0.5 ${isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'}`} />
                        <div className="text-[11px] leading-snug">
                          <p className={`font-bold font-dhaksinarga tracking-wide ${isDark ? 'text-amber-300' : 'text-[#B45309]'}`}>
                            Batas Waktu Pemesanan (H-{selectedMaxLeadDays})
                          </p>
                          <p className={`mt-0.5 ${isDark ? 'text-amber-100/80' : 'text-[#6B423A]'}`}>
                            Pemesanan kombinasi menu ini minimal dilakukan H-{selectedMaxLeadDays} sebelum acara.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`border-t pt-3 flex items-baseline justify-between ${
                    isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                  }`}>
                    <div>
                      <p className={`text-xs font-dhaksinarga tracking-wide uppercase font-bold ${
                        isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}>
                        Total Estimasi
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>Harga final via invoice katering</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-dhaksinarga tracking-wide font-black text-[#F59E0B]">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Checkout CTA (Desktop Only, mobile uses sticky bottom bar) */}
                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  disabled={selectedDistinctCount === 0}
                  className="hidden lg:inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 py-4 text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 transition hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none cursor-pointer"
                >
                  <MessageCircle size={20} />
                  <span>
                    {selectedDistinctCount > 0
                      ? `Pesan ${selectedDistinctCount} Menu Sekarang`
                      : 'Pilih Menu untuk Memesan'}
                  </span>
                </button>

                <p className={`hidden lg:block text-center text-[11px] ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>
                  Pesanan akan dibuat menjadi 1 nomor invoice dan diteruskan ke WhatsApp Admin Pawon Hara.
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
        <div className={`lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-md border-t px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.2)] ${
          isDark ? 'bg-[#1C0B09]/95 border-[#60241E]' : 'bg-[#FBF7F2]/95 border-[#E6DACD]'
        }`}>
          <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
            {/* Left: Checkbox "Semua" + Total price */}
            <div className="flex items-center gap-2.5 min-w-0">
              <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                  className={`h-4.5 w-4.5 rounded-md accent-[#F59E0B] cursor-pointer ${
                    isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
                  }`}
                />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>Semua</span>
              </label>

              <div className={`border-l pl-2.5 min-w-0 ${isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider leading-tight truncate ${
                  isDark ? 'text-amber-200/60' : 'text-[#6B423A]'
                }`}>
                  Total ({selectedTotalPortions} Porsi)
                </p>
                <p className="text-base font-dhaksinarga tracking-wide font-black text-[#F59E0B] truncate leading-tight mt-0.5">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Right: Checkout Button */}
            <button
              type="button"
              onClick={handleOpenCheckout}
              disabled={selectedDistinctCount === 0}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] px-4.5 py-3 text-xs sm:text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-md shadow-[#F59E0B]/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className={`relative w-full max-w-lg overflow-hidden rounded-t-[2rem] sm:rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] ${
            isDark ? 'border-[#60241E] bg-[#240E0C] text-stone-100' : 'border-[#E6DACD] bg-[#FBF7F2] text-[#2B120E]'
          }`}>
            {/* Modal Header */}
            <div className={`border-b px-5 sm:px-6 py-4 shrink-0 ${
              isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#F5EDE4]'
            }`}>
              {/* Mobile grab handle */}
              <div className={`w-10 h-1 rounded-full mx-auto mb-3 sm:hidden ${
                isDark ? 'bg-[#60241E]' : 'bg-[#E6DACD]'
              }`} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    isDark
                      ? 'bg-[#2D120F] text-[#F59E0B] border-[#60241E]'
                      : 'bg-white text-[#D97706] border-[#E6DACD]'
                  }`}>
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h3 className={`font-dhaksinarga tracking-wide font-black text-sm sm:text-base ${
                      isDark ? 'text-white' : 'text-[#2B120E]'
                    }`}>
                      Konfirmasi Pesanan Keranjang
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-amber-100/70' : 'text-[#5C3831]'}`}>
                      {selectedDistinctCount} Menu Terpilih • {selectedTotalPortions} Porsi
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`rounded-full p-2 transition cursor-pointer ${
                    isDark ? 'text-stone-400 hover:bg-[#2D120F] hover:text-white' : 'text-[#6B423A] hover:bg-[#EAE0D5] hover:text-[#2B120E]'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Order Summary Box */}
              <div className={`rounded-2xl border p-3.5 space-y-2 text-xs ${
                isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-white'
              }`}>
                <p className={`font-dhaksinarga tracking-wide font-bold uppercase text-[11px] ${
                  isDark ? 'text-amber-300' : 'text-[#B45309]'
                }`}>
                  Daftar Menu yang Dipesan:
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className={`flex justify-between items-baseline ${
                      isDark ? 'text-amber-100/90' : 'text-[#5C3831]'
                    }`}>
                      <span className="truncate pr-2">
                        {item.product_name} ({item.quantity} porsi)
                      </span>
                      <span className={`font-mono font-semibold shrink-0 ${
                        isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
                      }`}>
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`border-t pt-2 flex justify-between items-baseline font-bold ${
                  isDark ? 'border-[#60241E] text-white' : 'border-[#E6DACD] text-[#2B120E]'
                }`}>
                  <span className="font-dhaksinarga tracking-wide">Total ({selectedDistinctCount} Menu):</span>
                  <span className="text-[#F59E0B] font-dhaksinarga tracking-wide font-black text-base">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                  }`}>
                    Tanggal Acara <span className="text-[#E77B49]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDark ? 'text-amber-400' : 'text-[#D97706]'
                    }`} />
                    <input
                      type="date"
                      required
                      min={minDateString}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={`w-full h-11 rounded-xl border pl-10 pr-3 text-xs sm:text-sm font-medium outline-none transition ${
                        isDateInvalid
                          ? 'border-red-500 bg-red-950/40 text-red-200 ring-2 ring-red-500/20'
                          : isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                            : 'border-[#E6DACD] bg-white text-[#2B120E] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                      }`}
                    />
                  </div>
                  {isDateInvalid && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-800 bg-red-950/60 p-2 text-[11px] text-red-200">
                      <AlertCircle size={14} className="shrink-0 text-red-400 mt-0.5" />
                      <span>
                        Pemesanan minimal H-{selectedMaxLeadDays} sebelum acara (paling cepat {formatMinDateLabel(minDateString)}).
                      </span>
                    </div>
                  )}

                  {!isDateInvalid && eventDate && (
                    <>
                      {isDateClosed ? (
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-800 bg-red-950/60 p-2 text-[11px] text-red-200">
                          <AlertCircle size={14} className="shrink-0 text-red-400 mt-0.5" />
                          <span>
                            Dapur libur / tutup pesanan pada tanggal ini.
                            {dateCapacity?.override_note ? ` (${dateCapacity.override_note})` : ''} Silakan pilih tanggal lain.
                          </span>
                        </div>
                      ) : isDateFull ? (
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-800 bg-red-950/60 p-2 text-[11px] text-red-200">
                          <AlertCircle size={14} className="shrink-0 text-red-400 mt-0.5" />
                          <span>
                            Kapasitas dapur untuk tanggal ini sudah penuh ({dateCapacity?.max_capacity} box). Silakan pilih tanggal lain.
                          </span>
                        </div>
                      ) : isExceedingCapacity ? (
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-600 bg-amber-950/60 p-2 text-[11px] text-amber-200">
                          <AlertCircle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                          <span>
                            Sisa kuota dapur tanggal ini hanya <strong>{dateCapacity?.remaining_portions} box</strong> (pesanan Anda: <strong>{selectedTotalPortions} box</strong>).
                          </span>
                        </div>
                      ) : dateCapacity ? (
                        <div className={`mt-2 flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-[11px] ${
                          isDark
                            ? 'border-[#F59E0B]/40 bg-[#2D120F] text-amber-200'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        }`}>
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Kapasitas Dapur Tersedia</span>
                          </span>
                          <span className={`font-bold ${isDark ? 'text-[#F59E0B]' : 'text-emerald-700'}`}>
                            Sisa {dateCapacity.remaining_portions} Box
                          </span>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                  }`}>
                    Jam Acara (Kira-kira)
                  </label>
                  <div className="relative">
                    <Clock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDark ? 'text-amber-400' : 'text-[#D97706]'
                    }`} />
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className={`w-full h-11 rounded-xl border pl-10 pr-3 text-xs sm:text-sm font-medium outline-none transition ${
                        isDark
                          ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                          : 'border-[#E6DACD] bg-white text-[#2B120E] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                }`}>
                  Nama Lengkap Pemesan <span className="text-[#E77B49]">*</span>
                </label>
                <div className="relative">
                  <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDark ? 'text-amber-400' : 'text-[#D97706]'
                  }`} />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full h-11 rounded-xl border pl-10 pr-3 text-xs sm:text-sm font-medium outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                        : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                    }`}
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                }`}>
                  Nomor WhatsApp Aktif <span className="text-[#E77B49]">*</span>
                </label>
                <div className="relative">
                  <MessageCircle size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDark ? 'text-amber-400' : 'text-[#D97706]'
                  }`} />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className={`w-full h-11 rounded-xl border pl-10 pr-3 text-xs sm:text-sm font-medium outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                        : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                    }`}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                }`}>
                  Alamat Pengantaran / Lokasi Acara <span className="text-[#E77B49]">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className={`absolute left-3.5 top-3 pointer-events-none ${
                    isDark ? 'text-amber-400' : 'text-[#D97706]'
                  }`} />
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Contoh: Gedung Graha Lt. 5, Jl. Sudirman No. 10..."
                    className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                        : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                    }`}
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                }`}>
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Sambal dipisah, minta sendok ekstra, titip di resepsionis..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium outline-none transition ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                      : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                  }`}
                />
              </div>

              {/* Modal Sticky Footer Actions inside Form */}
              <div className={`pt-3 flex items-center justify-end gap-2.5 border-t ${
                isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isDark ? 'text-amber-200 hover:bg-[#2D120F]' : 'text-[#5C3831] hover:bg-[#EAE0D5]'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isDateInvalid ||
                    !eventDate ||
                    isDateClosed ||
                    isDateFull ||
                    isExceedingCapacity
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-dhaksinarga tracking-wide font-black transition bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 hover:brightness-110 active:scale-[0.99] disabled:bg-[#2D120F] disabled:text-stone-500 disabled:border disabled:border-[#60241E] disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
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
