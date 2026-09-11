import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageLoader from '../components/ui/PageLoader'
import { productService } from '../services/products.service'
import { ordersService } from '../services/orders.service'
import { getImageUrl } from '../utils/image'
import type { Product } from '../types/products'
import type { AddonGroup } from '../types/addon'

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

  // Quantity Cart Style (Kelipatan 10 vs Satuan)
  type PortionMode = 'kelipatan10' | 'satuan'
  const [portionMode, setPortionMode] = useState<PortionMode>('kelipatan10')
  const [quantity, setQuantity] = useState<number>(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccessCode, setOrderSuccessCode] = useState<string | null>(null)

  // Addon selection state: { [groupId: number]: number[] (addonIds) }
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number[]>>({})

  // Form input pemesanan
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('11:30')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  const minOrder = product ? Math.max(1, product.minimum_order || 1) : 10

  // Inisialisasi quantity sesuai minimum order produk & default addon selections
  useEffect(() => {
    if (product) {
      const initialQty = minOrder < 10 ? minOrder : 10
      setQuantity(initialQty)
      if (minOrder < 10) {
        setPortionMode('satuan')
      }

      if (product.addons_enabled && product.addon_groups && product.addon_groups.length > 0) {
        const initial: Record<number, number[]> = {}
        for (const group of product.addon_groups) {
          // Pre-select first item for required single-select group
          if (group.min_selection === 1 && group.max_selection === 1 && group.addons.length > 0) {
            initial[group.id] = [group.addons[0].id]
          } else {
            initial[group.id] = []
          }
        }
        setSelectedAddons(initial)
      } else {
        setSelectedAddons({})
      }
    }
  }, [product, minOrder])

  const step = portionMode === 'kelipatan10' ? 10 : 1

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(minOrder, prev - step))
  }

  const handleIncrease = () => {
    setQuantity((prev) => prev + step)
  }

  const handleQuantityInput = (val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num)) {
      setQuantity(minOrder)
      return
    }
    setQuantity(num)
  }

  const handleQuantityBlur = () => {
    if (quantity < minOrder) {
      setQuantity(minOrder)
    } else if (portionMode === 'kelipatan10') {
      const rounded = Math.round(quantity / 10) * 10
      setQuantity(Math.max(minOrder, rounded || 10))
    }
  }

  const handleSwitchMode = (mode: PortionMode) => {
    setPortionMode(mode)
    if (mode === 'kelipatan10') {
      const rounded = Math.max(minOrder, Math.round(quantity / 10) * 10 || 10)
      setQuantity(rounded)
    }
  }

  // Toggle selection addon
  const handleToggleAddon = (group: AddonGroup, addonId: number) => {
    setSelectedAddons((prev) => {
      const current = prev[group.id] || []
      const isSelected = current.includes(addonId)

      if (group.max_selection === 1) {
        // Radio behavior
        if (isSelected) {
          // If required, do not allow deselecting
          if (group.min_selection >= 1) return prev
          return { ...prev, [group.id]: [] }
        }
        return { ...prev, [group.id]: [addonId] }
      } else {
        // Checkbox behavior
        if (isSelected) {
          return { ...prev, [group.id]: current.filter((id) => id !== addonId) }
        }
        if (current.length >= group.max_selection) {
          toast.error(`Maksimal pilihan untuk "${group.name}" adalah ${group.max_selection}.`)
          return prev
        }
        return { ...prev, [group.id]: [...current, addonId] }
      }
    })
  }

  // Live price calculation
  const basePrice = Number(product?.price || 0)
  const baseTotal = basePrice * quantity

  const addonDeltaPerUnit = useMemo(() => {
    if (!product?.addons_enabled || !product.addon_groups) return 0
    let delta = 0
    for (const group of product.addon_groups) {
      const ids = selectedAddons[group.id] || []
      for (const a of group.addons) {
        if (ids.includes(a.id)) {
          delta += Number(a.price || 0)
        }
      }
    }
    return delta
  }, [product, selectedAddons])

  const unitPrice = basePrice + addonDeltaPerUnit
  const estimatedTotal = unitPrice * quantity

  // Customization names for summary & WhatsApp
  const selectedAddonSummary = useMemo(() => {
    if (!product?.addons_enabled || !product.addon_groups) return []
    const items: { groupName: string; addonName: string; price: number; subtotal: number }[] = []
    for (const group of product.addon_groups) {
      const ids = selectedAddons[group.id] || []
      for (const a of group.addons) {
        if (ids.includes(a.id)) {
          const p = Number(a.price || 0)
          items.push({
            groupName: group.name,
            addonName: a.name,
            price: p,
            subtotal: p * quantity,
          })
        }
      }
    }
    return items
  }, [product, selectedAddons, quantity])

  // Open modal with pre-validation
  const handleOpenOrderModal = () => {
    if (product?.addons_enabled && product.addon_groups) {
      for (const group of product.addon_groups) {
        const selected = selectedAddons[group.id] || []
        if (selected.length < group.min_selection) {
          toast.error(`Silakan tentukan pilihan "${group.name}" terlebih dahulu.`)
          return
        }
        if (selected.length > group.max_selection) {
          toast.error(`Pilihan "${group.name}" melebihi batas maksimal (${group.max_selection}).`)
          return
        }
      }
    }
    setIsModalOpen(true)
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

    // Pre-validate addon selection rules
    if (product.addons_enabled && product.addon_groups) {
      for (const group of product.addon_groups) {
        const selected = selectedAddons[group.id] || []
        if (selected.length < group.min_selection) {
          toast.error(`Silakan tentukan pilihan "${group.name}" terlebih dahulu.`)
          return
        }
        if (selected.length > group.max_selection) {
          toast.error(`Pilihan "${group.name}" melebihi batas maksimal (${group.max_selection}).`)
          return
        }
      }
    }

    try {
      setIsSubmitting(true)

      // Flatten selected addons into payload format
      const addonsPayload: { addon_id: number }[] = []
      if (product.addons_enabled && product.addon_groups) {
        for (const group of product.addon_groups) {
          const ids = selectedAddons[group.id] || []
          for (const id of ids) {
            addonsPayload.push({ addon_id: id })
          }
        }
      }

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
            addons: addonsPayload.length > 0 ? addonsPayload : undefined,
          },
        ],
      })

      const orderCode = createdOrder.order_code
      setOrderSuccessCode(orderCode)
      toast.success(`Pesanan ${orderCode} berhasil dicatat! Menghubungkan ke WhatsApp...`)

      // 2. Format customization summary for WhatsApp with transparent calculation
      const addonLines: string[] = []
      if (selectedAddonSummary.length > 0) {
        for (const item of selectedAddonSummary) {
          if (item.price > 0) {
            addonLines.push(`  • ${item.addonName}: +Rp ${item.price.toLocaleString('id-ID')} x ${quantity} porsi = +Rp ${(item.price * quantity).toLocaleString('id-ID')}`)
          } else {
            addonLines.push(`  • ${item.addonName}: Termasuk Paket (Rp 0)`)
          }
        }
      }

      // 3. Format pesan WhatsApp
      const formattedUnitPrice = unitPrice.toLocaleString('id-ID')
      const formattedEstimatedSubtotal = estimatedTotal.toLocaleString('id-ID')
      const formattedBasePrice = basePrice.toLocaleString('id-ID')
      const formattedBaseTotal = (basePrice * quantity).toLocaleString('id-ID')

      const waText = `Halo Hara Chicken, saya ingin memesan paket catering:

*Rincian Pesanan:*
- No. Pesanan: *${orderCode}*
- Menu Paket: *${product.name}*
- Jumlah: *${quantity} Porsi*
- Harga Paket Dasar: *Rp ${formattedBasePrice} x ${quantity} porsi = Rp ${formattedBaseTotal}*
${addonLines.length > 0 ? `- Pilihan Add-on / Variasi Paket:\n${addonLines.join('\n')}\n` : ''}- Total Estimasi: *Rp ${formattedEstimatedSubtotal}* (@ Rp ${formattedUnitPrice}/porsi)
- Tanggal Acara: *${eventDate}* ${eventTime ? `(Jam: ${eventTime})` : ''}
- Alamat Pengantaran: *${deliveryAddress.trim()}*
${notes.trim() ? `- Catatan Khusus: *${notes.trim()}*\n` : ''}
*Data Pemesan:*
- Nama: *${customerName.trim()}*
- No. WA: *${customerPhone.trim()}*

Mohon dicek ketersediaannya dan kirimkan invoice resminya ya. Terima kasih!`

      const waUrl = `https://wa.me/6289669743193?text=${encodeURIComponent(waText)}`

      // 4. Buka WhatsApp di tab baru
      window.open(waUrl, '_blank')
    } catch (err: unknown) {
      console.error(err)
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
      const serverMessage = errorObj?.response?.data?.message || errorObj?.message
      toast.error(serverMessage || 'Terjadi kesalahan saat memproses pesanan. Silakan coba lagi atau hubungi langsung via WhatsApp.')
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
  const todayDateString = new Date().toISOString().split('T')[0]

  return (
    <main className="min-h-screen bg-[#fafaf9] pb-24 text-zinc-900 selection:bg-zinc-950 selection:text-white">
        <PageLoader
                isLoading={isLoading}
                text="Menyiapkan Menu Katering Lezat..."
                subtext="Memuat daftar lengkap paket bento, krisbar, dan nasi box spesial"
                minDuration={700}
              />
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

            {/* =====================================================
                ADDON / CUSTOMIZATION GROUPS (1 PAKET MENU)
            ====================================================== */}
            {product.addons_enabled && product.addon_groups && product.addon_groups.length > 0 && (
              <div className="mt-7 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2.5">
                  <Sparkles size={16} className="text-red-600" />
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Pilihan Kustomisasi & Add-on Paket
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      Pilihan variasi nasi, lauk pelengkap, atau extra tambahan per porsi
                    </p>
                  </div>
                </div>

                {product.addon_groups.map((group) => {
                  const isSingleSelect = group.max_selection === 1
                  const isRequired = group.min_selection > 0
                  const currentSelected = selectedAddons[group.id] || []

                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-all"
                    >
                      {/* Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-zinc-950">
                              {group.name}
                            </h3>
                            {isRequired ? (
                              <span className="rounded-full bg-red-50 border border-red-200/80 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                Wajib Dipilih
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                                Opsional (Maks {group.max_selection})
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-xs text-zinc-500 mt-0.5">{group.description}</p>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-zinc-400 self-start sm:self-auto">
                          {currentSelected.length} / {group.max_selection} dipilih
                        </span>
                      </div>

                      {/* Addon Choices Grid */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.addons.map((addon) => {
                          const isSelected = currentSelected.includes(addon.id)
                          const priceNum = Number(addon.price)

                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(group, addon.id)}
                              className={`group flex items-start justify-between rounded-xl p-3 text-left transition-all border ${
                                isSelected
                                  ? 'border-zinc-950 bg-zinc-50 shadow-xs ring-1 ring-zinc-950'
                                  : 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 pr-2">
                                <div
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-${
                                    isSingleSelect ? 'full' : 'md'
                                  } border transition ${
                                    isSelected
                                      ? 'border-zinc-950 bg-zinc-950 text-white'
                                      : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                                  }`}
                                >
                                  {isSelected && (
                                    isSingleSelect ? (
                                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    ) : (
                                      <Check size={10} strokeWidth={3} />
                                    )
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={`text-xs font-bold leading-snug ${
                                      isSelected ? 'text-zinc-950' : 'text-zinc-800'
                                    }`}
                                  >
                                    {addon.name}
                                  </p>
                                  {addon.description && (
                                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                                      {addon.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                  priceNum === 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                    : 'bg-zinc-100 text-zinc-800 border border-zinc-200/80'
                                }`}
                              >
                                {priceNum === 0 ? 'Termasuk' : `+Rp ${priceNum.toLocaleString('id-ID')} / porsi`}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* =====================================================
                CART-STYLE QUANTITY SELECTOR (SATUAN & KELIPATAN 10)
            ====================================================== */}
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              {/* Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4 mb-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">
                    Mode Pemesanan Porsi
                  </label>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Minimal order menu ini adalah <span className="font-bold text-zinc-950">{minOrder} porsi</span>
                  </p>
                </div>

                <div className="inline-flex items-center rounded-xl bg-zinc-100 p-1 self-start sm:self-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('kelipatan10')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      portionMode === 'kelipatan10'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Kelipatan 10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('satuan')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      portionMode === 'satuan'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Satuan (+1)
                  </button>
                </div>
              </div>

              {/* Counter and Stepper */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-zinc-900">
                    {portionMode === 'kelipatan10' ? 'Kelipatan 10 Porsi' : 'Hitungan Satuan Porsi'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {portionMode === 'kelipatan10'
                      ? 'Cocok untuk pemesanan rombongan & box besar'
                      : 'Bebas tentukan jumlah porsi sesuai kebutuhan acara'}
                  </p>
                </div>

                {/* Counter buttons */}
                <div className="inline-flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-1 shadow-inner self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= minOrder}
                    className="flex h-10 min-w-10 items-center justify-center gap-0.5 px-2 rounded-xl bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Kurangi ${step} porsi`}
                  >
                    <Minus size={15} strokeWidth={2.5} />
                    <span className="text-[11px] font-bold text-zinc-500">
                      {portionMode === 'kelipatan10' ? '10' : '1'}
                    </span>
                  </button>

                  <div className="flex items-center justify-center px-4">
                    <input
                      type="number"
                      value={quantity}
                      step={step}
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
                    className="flex h-10 min-w-10 items-center justify-center gap-0.5 px-2 rounded-xl bg-zinc-950 text-white shadow-sm transition hover:bg-zinc-800 active:scale-95"
                    aria-label={`Tambah ${step} porsi`}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span className="text-[11px] font-bold text-zinc-300">
                      {portionMode === 'kelipatan10' ? '10' : '1'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick portion chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-100">
                <span className="text-[11px] font-semibold text-zinc-400">Pilih Cepat:</span>
                {portionMode === 'kelipatan10' ? (
                  [10, 20, 30, 50, 100, 200]
                    .filter((c) => c >= minOrder)
                    .map((count) => (
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
                    ))
                ) : (
                  <>
                    {[minOrder, minOrder + 2, minOrder + 5, minOrder + 10, minOrder + 15, minOrder + 25]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((count) => (
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
                    <span className="text-zinc-300 mx-1">|</span>
                    {[+1, +5, +10].map((inc) => (
                      <button
                        key={`inc-${inc}`}
                        type="button"
                        onClick={() => setQuantity((q) => q + inc)}
                        className="rounded-xl px-2 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition"
                      >
                        +{inc}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* =====================================================
                PRICE INFO & SUMMARY BOX (LIVE PREVIEW & TRANSPARENT BREAKDOWN)
            ====================================================== */}
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-zinc-100 pb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Harga Satuan Paket
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
                      Rp {unitPrice.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">/ porsi</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Total Estimasi ({quantity} Porsi)
                  </p>
                  <p className="mt-0.5 text-xl sm:text-2xl font-black text-emerald-700">
                    Rp {estimatedTotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Explicit calculation breakdown */}
              <div className="rounded-xl bg-zinc-50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Paket Dasar ({product.name}):</span>
                  <span className="font-mono text-zinc-900 font-semibold">
                    Rp {basePrice.toLocaleString('id-ID')} × {quantity} porsi = Rp {baseTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {selectedAddonSummary.length > 0 && selectedAddonSummary.some((a) => a.price > 0) && (
                  <div className="space-y-1 pt-1.5 border-t border-zinc-200/60">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Tambahan Add-on Paket:
                    </p>
                    {selectedAddonSummary.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-zinc-600 pl-2">
                        <span>• {item.addonName}</span>
                        <span className="font-mono text-emerald-700 font-semibold">
                          {item.price > 0
                            ? `+Rp ${item.price.toLocaleString('id-ID')} × ${quantity} porsi = +Rp ${(item.price * quantity).toLocaleString('id-ID')}`
                            : 'Termasuk'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Action Button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleOpenOrderModal}
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
              {/* Order Summary Box with Explicit Multiplication */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-900">{product.name}</p>
                    <p className="text-zinc-500">Jumlah: {quantity} porsi (@ Rp {unitPrice.toLocaleString('id-ID')})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400">Estimasi Total</p>
                    <p className="font-black text-sm text-emerald-700">Rp {estimatedTotal.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="pt-2 border-t border-zinc-200/60 space-y-1 text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Paket Dasar:</span>
                    <span className="font-mono text-zinc-800">
                      Rp {basePrice.toLocaleString('id-ID')} × {quantity} = Rp {baseTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {selectedAddonSummary.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-600 pl-2">
                      <span>↳ {item.addonName}:</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {item.price > 0
                          ? `+Rp ${item.price.toLocaleString('id-ID')} × ${quantity} = +Rp ${(item.price * quantity).toLocaleString('id-ID')}`
                          : 'Termasuk'}
                      </span>
                    </div>
                  ))}
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
