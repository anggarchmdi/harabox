import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { productService } from '../services/products.service'
import { ordersService } from '../services/orders.service'
import { getImageUrl } from '../utils/image'
import type { Product } from '../types/products'

// Aset lokal untuk smart fallback
import BentoKatsuImg from '../assets/nasibox/bento-katsu-b.webp'
import BentoTelurImg from '../assets/nasibox/bento-telur-mata-sapi-b.webp'
import EkonomisBaladoImg from '../assets/nasibox/ekonomis-balado-b.webp'
import KrisbarDadaImg from '../assets/nasibox/krisbar-dada-b.webp'
import KrisbarPahaImg from '../assets/nasibox/krisbar-paha-bawah-b.webp'
import NasiKuningBaladoImg from '../assets/nasibox/nasi-kuning-balado-b.webp'
import NasiKuningPahaImg from '../assets/nasibox/nasi-kuning-paha-krispi-b.webp'
import RamesBaladoImg from '../assets/nasibox/rames-balado-b.webp'
import RamesPahaImg from '../assets/nasibox/rames-paha-b.webp'

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

export default function ProductDetailPage() {
  const { slug } = useParams<{
    slug: string
  }>()

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug!),
    enabled: Boolean(slug),
  })

  // Quantity Cart Style (Kelipatan 10, Minimal 10)
  const [quantity, setQuantity] = useState<number>(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccessCode, setOrderSuccessCode] = useState<string | null>(null)

  // Form input pemesanan
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('11:30')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Inisialisasi quantity sesuai minimum order produk
  useEffect(() => {
    if (product) {
      const min = Math.max(10, Math.ceil((product.minimum_order || 10) / 10) * 10)
      setQuantity(min)
    }
  }, [product])

  const minOrder = product ? Math.max(10, Math.ceil((product.minimum_order || 10) / 10) * 10) : 10

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(minOrder, prev - 10))
  }

  const handleIncrease = () => {
    setQuantity((prev) => prev + 10)
  }

  const handleQuantityInput = (val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num)) {
      setQuantity(minOrder)
      return
    }
    // Set langsung saat ketik, nanti di blur disesuaikan ke kelipatan 10
    setQuantity(num)
  }

  const handleQuantityBlur = () => {
    if (quantity < minOrder) {
      setQuantity(minOrder)
    } else {
      // Bulatkan ke kelipatan 10 terdekat
      const rounded = Math.round(quantity / 10) * 10
      setQuantity(Math.max(minOrder, rounded))
    }
  }

  // Handle Order Submit to Backend + WA Redirect
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

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

    if (!deliveryAddress.trim()) {
      toast.error('Mohon isi alamat pengantaran / lokasi acara.')
      return
    }

    try {
      setIsSubmitting(true)

      // 1. Simpan order ke backend
      const createdOrder = await ordersService.create({
        customers_name: customerName.trim(),
        customers_phone: customerPhone.trim(),
        event_date: eventDate,
        event_time: eventTime || undefined,
        delivery_address: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
        items: [
          {
            product_id: product.id,
            quantity: quantity,
          },
        ],
      })

      const orderCode = createdOrder.order_code
      setOrderSuccessCode(orderCode)
      toast.success(`Pesanan ${orderCode} berhasil dicatat! Menghubungkan ke WhatsApp...`)

      // 2. Format pesan WhatsApp
      const formattedPrice = Number(product.price).toLocaleString('id-ID')
      const estimatedSubtotal = (Number(product.price) * quantity).toLocaleString('id-ID')

      const waText = `Halo Hara Chicken, saya ingin memesan catering:

*Rincian Pesanan:*
- No. Pesanan: *${orderCode}*
- Menu: *${product.name}*
- Jumlah: *${quantity} Porsi*
- Estimasi Harga: *Rp ${estimatedSubtotal}* (@ Rp ${formattedPrice}/porsi)
- Tanggal Acara: *${eventDate}* ${eventTime ? `(Jam: ${eventTime})` : ''}
- Alamat Pengantaran: *${deliveryAddress.trim()}*
${notes.trim() ? `- Catatan Khusus: *${notes.trim()}*\n` : ''}
*Data Pemesan:*
- Nama: *${customerName.trim()}*
- No. WA: *${customerPhone.trim()}*

Mohon dicek ketersediaannya dan kirimkan invoice resminya ya. Terima kasih!`

      const waUrl = `https://wa.me/6289669743193?text=${encodeURIComponent(waText)}`

      // 3. Buka WhatsApp di tab baru
      window.open(waUrl, '_blank')
    } catch (err: unknown) {
      console.error(err)
      toast.error('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi atau hubungi langsung via WhatsApp.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#faf8f5]">
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8">
          <div className="animate-pulse">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="mt-10 grid gap-12 lg:grid-cols-2">
              <div className="aspect-[4/3] rounded-[2rem] bg-gray-200" />
              <div className="flex flex-col justify-center space-y-4">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-12 w-3/4 rounded bg-gray-200" />
                <div className="h-20 w-full rounded bg-gray-200" />
                <div className="h-10 w-48 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (isError || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-6">
        <div className="text-center max-w-md rounded-3xl bg-white p-8 border border-gray-100 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
            Menu
          </p>
          <h1 className="mt-3 text-2xl font-black text-gray-950">
            Menu Tidak Ditemukan
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Menu yang Anda cari mungkin sudah tidak tersedia atau telah diganti.
          </p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-950 px-6 py-3 text-xs font-bold text-white transition hover:bg-red-600"
          >
            <ArrowLeft size={16} />
            Kembali ke Semua Menu
          </Link>
        </div>
      </main>
    )
  }

  const displayImage = getProductDisplayImage(product)
  const unitPrice = Number(product.price)
  const estimatedTotal = unitPrice * quantity
  const todayDateString = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#fafaf9] pb-24 text-zinc-900 selection:bg-zinc-950 selection:text-white">
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-8 lg:pb-28">
        {/* Breadcrumb Back Link */}
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-500 transition hover:text-zinc-950"
        >
          <ArrowLeft size={16} />
          Kembali ke Semua Menu
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left: Product Image */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/80 bg-white shadow-xl shadow-zinc-900/5">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={displayImage}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Min Order Badge */}
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-zinc-800 shadow-lg backdrop-blur">
                <ShoppingBag size={14} className="text-zinc-900" />
                Min. {minOrder} Porsi (Kelipatan 10)
              </div>

              {/* Satisfaction Badge */}
              <div className="absolute bottom-5 left-6 text-white text-xs font-bold flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full">
                <span className="text-amber-400">★ 4.9</span>
                <span>Paling Banyak Diminati</span>
              </div>
            </div>
          </div>

          {/* Right: Product Details & Cart Quantity Selector */}
          <div>
            {product.category && (
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
                {product.category.name}
              </p>
            )}

            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-600">
              {product.description ||
                'Paket catering nasi box spesial dari Hara Chicken dengan cita rasa gurih meresap, higienis, dan dikemas rapi siap santap untuk melengkapi acaramu.'}
            </p>

            {/* Perks */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Sendok & Tisu Termasuk
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200">
                <ShieldCheck size={14} className="text-emerald-600" />
                100% Halal & Higienis
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200">
                <Clock size={14} className="text-zinc-500" />
                Pengantaran Tepat Waktu
              </div>
            </div>

            {/* Price Info Box */}
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Harga Satuan
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black tracking-tight text-zinc-950">
                      Rp {unitPrice.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">/ porsi</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-zinc-400">Total Estimasi ({quantity} porsi)</p>
                  <p className="mt-0.5 text-xl font-black text-zinc-950">
                    Rp {estimatedTotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* =====================================================
                CART-STYLE QUANTITY SELECTOR (KELIPATAN 10)
            ====================================================== */}
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">
                    Jumlah Pesanan (Kelipatan 10 Porsi)
                  </label>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Minimal order katering adalah <span className="font-bold text-zinc-950">{minOrder} porsi</span>
                  </p>
                </div>

                {/* Counter buttons */}
                <div className="inline-flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-1 shadow-inner self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= minOrder}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Kurangi 10 porsi"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>

                  <div className="flex items-center justify-center px-4">
                    <input
                      type="number"
                      value={quantity}
                      step={10}
                      min={minOrder}
                      onChange={(e) => handleQuantityInput(e.target.value)}
                      onBlur={handleQuantityBlur}
                      className="w-16 text-center font-black text-base text-zinc-950 bg-transparent outline-none"
                    />
                    <span className="text-xs font-bold text-zinc-500">porsi</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleIncrease}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm transition hover:bg-zinc-800 active:scale-95"
                    aria-label="Tambah 10 porsi"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Quick portion chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-100">
                <span className="text-[11px] font-semibold text-zinc-400">Pilih Cepat:</span>
                {[10, 20, 30, 50, 100, 200].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuantity(count)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      quantity === count
                        ? 'bg-zinc-950 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {count} Porsi
                  </button>
                ))}
              </div>
            </div>

            {/* Order Action Button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageCircle size={20} />
                Pesan {quantity} Porsi via WhatsApp
              </button>

              <Link
                to="/cara-pesan"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-xs sm:text-sm font-bold text-zinc-800 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                Cara Pesan
              </Link>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              * Harga final dan biaya ongkir akan dikonfirmasi via invoice katering oleh tim Hara Chicken setelah pesanan diterima.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          ORDER CONFIRMATION MODAL (FORM PEMESANAN CATERING)
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 bg-[#fafaf9]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-black text-zinc-950 text-base">
                    Form Pemesanan Katering
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {product.name} • <span className="font-bold text-zinc-950">{quantity} Porsi</span>
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

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Order Summary Box */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-zinc-900">{product.name}</p>
                  <p className="text-zinc-500">Jumlah: {quantity} porsi (@ Rp {unitPrice.toLocaleString('id-ID')})</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400">Estimasi Subtotal</p>
                  <p className="font-black text-sm text-zinc-950">Rp {estimatedTotal.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Lengkap Pemesan <span className="text-zinc-900 font-black">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Bambang / Ibu Rina"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-4 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                  />
                </div>
              </div>

              {/* Customer WhatsApp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nomor WhatsApp Aktif <span className="text-zinc-900 font-black">*</span>
                </label>
                <div className="relative">
                  <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-4 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">Invoice katering akan dikirimkan ke nomor ini.</p>
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Tanggal Acara <span className="text-zinc-900 font-black">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={todayDateString}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-3 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                    />
                  </div>
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

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Alamat Pengantaran / Lokasi Acara <span className="text-zinc-900 font-black">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-zinc-400 pointer-events-none" />
                  <textarea
                    required
                    rows={2}
                    placeholder="Contoh: Gedung Graha Lantai 4, Jl. Sudirman No. 12"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-4 py-2 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sambal dipisah / minta sendok lebih"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 text-xs sm:text-sm font-medium outline-none focus:border-zinc-950 focus:bg-white focus:ring-2 focus:ring-zinc-950/10 transition"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Memproses Order...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={16} />
                      <span>Kirim Pesanan ke WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Success state footer notice */}
            {orderSuccessCode && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-100 text-center text-xs text-emerald-800">
                <p className="font-bold">Kode Pesanan: {orderSuccessCode}</p>
                <p className="text-[11px] mt-0.5">Pesanan Anda telah tercatat di sistem kami!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
