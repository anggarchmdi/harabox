import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
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
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageLoader from '../components/ui/PageLoader'
import { productService } from '../services/products.service'
import { ordersService } from '../services/orders.service'
import { settingsService } from '../services/settings.service'
import { getImageUrl } from '../utils/image'
import { useCartStore, type CartItemAddon } from '../stores/cart.store'
import { useThemeStore } from '../stores/theme.store'
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

function formatMinDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
  } catch {
    // fallback
  }
  return dateStr
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Quantity Mode (Kelipatan 10 vs Satuan)
  type PortionMode = 'kelipatan10' | 'satuan'
  const [portionMode, setPortionMode] = useState<PortionMode>('kelipatan10')
  const [quantity, setQuantity] = useState<number>(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Addon selection state: { [groupId: number]: number[] (addonIds) }
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number[]>>({})

  // Form input pemesanan modal
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('11:30')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  const minOrder = product ? Math.max(1, product.minimum_order || 1) : 10
  const leadTimeDays = product?.lead_time_days ?? 3

  const minDateString = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + leadTimeDays)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [leadTimeDays])

  const isDateInvalid = Boolean(eventDate && minDateString && eventDate < minDateString)

  // Realtime Kitchen Capacity check for selected event date
  const { data: dateCapacity } = useQuery({
    queryKey: ['capacity-check', eventDate],
    queryFn: () => settingsService.checkCapacity(eventDate),
    enabled: Boolean(eventDate && !isDateInvalid),
  })

  const isDateClosed = Boolean(dateCapacity?.is_closed)
  const isDateFull = Boolean(dateCapacity && !dateCapacity.is_closed && dateCapacity.remaining_portions <= 0)
  const isExceedingCapacity = Boolean(
    dateCapacity && !dateCapacity.is_closed && quantity > dateCapacity.remaining_portions
  )

  useEffect(() => {
    if (isModalOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isModalOpen])

  const handleEventDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEventDate(val)
    if (val && minDateString && val < minDateString) {
      toast.error(
        `Pemesanan menu ini minimal H-${leadTimeDays} sebelum acara (paling cepat tanggal ${formatMinDateLabel(minDateString)}).`
      )
    }
  }

  // Inisialisasi quantity & default addons sesuai produk
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

  const handleToggleAddon = (group: AddonGroup, addonId: number) => {
    setSelectedAddons((prev) => {
      const current = prev[group.id] || []
      const isSelected = current.includes(addonId)

      if (group.max_selection === 1) {
        if (isSelected) {
          if (group.min_selection >= 1) return prev
          return { ...prev, [group.id]: [] }
        }
        return { ...prev, [group.id]: [addonId] }
      } else {
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

  const handleOpenOrderModal = () => {
    if (!product) return

    if (quantity < minOrder) {
      toast.error(`Minimal order menu ini adalah ${minOrder} porsi.`)
      return
    }

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

    if (!eventDate) {
      setEventDate(minDateString)
    }

    setIsModalOpen(true)
  }

  const handleAddToCart = () => {
    if (!product) return

    if (quantity < minOrder) {
      toast.error(`Minimal order menu ini adalah ${minOrder} porsi.`)
      return
    }

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

    const addonsForCart: CartItemAddon[] = []
    if (product.addons_enabled && product.addon_groups) {
      for (const group of product.addon_groups) {
        const ids = selectedAddons[group.id] || []
        for (const id of ids) {
          const addon = group.addons.find((a) => a.id === id)
          if (addon) {
            addonsForCart.push({
              addon_id: addon.id,
              addon_name: addon.name,
              addon_group_name: group.name,
              price: Number(addon.price) || 0,
            })
          }
        }
      }
    }

    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.image,
      base_price: Number(product.price) || 0,
      quantity,
      minimum_order: minOrder,
      lead_time_days: leadTimeDays,
      step,
      portion_mode: portionMode,
      addons: addonsForCart,
    })

    toast.success(`${product.name} (${quantity} porsi) berhasil masuk keranjang!`, {
      action: {
        label: 'Lihat Keranjang',
        onClick: () => navigate('/cart'),
      },
    })
  }

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

    if (minDateString && eventDate < minDateString) {
      toast.error(
        leadTimeDays > 0
          ? `Pemesanan minimal H-${leadTimeDays} sebelum acara (paling cepat tanggal ${formatMinDateLabel(minDateString)}).`
          : 'Tanggal acara tidak valid.'
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
        `Kapasitas dapur tanggal tersebut tersisa ${dateCapacity?.remaining_portions} box (pesanan Anda: ${quantity} box).`
      )
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error('Mohon isi alamat pengantaran / lokasi acara.')
      return
    }

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

      const addonsPayload: { addon_id: number }[] = []
      if (product.addons_enabled && product.addon_groups) {
        for (const group of product.addon_groups) {
          const ids = selectedAddons[group.id] || []
          for (const id of ids) {
            addonsPayload.push({ addon_id: id })
          }
        }
      }

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
      setIsModalOpen(false)
      toast.success(`Pesanan ${orderCode} berhasil dicatat! Menghubungkan ke WhatsApp...`)

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

      const formattedUnitPrice = unitPrice.toLocaleString('id-ID')
      const formattedEstimatedSubtotal = estimatedTotal.toLocaleString('id-ID')
      const formattedBasePrice = basePrice.toLocaleString('id-ID')
      const formattedBaseTotal = (basePrice * quantity).toLocaleString('id-ID')

      const waText = `Halo Pawon Hara, saya ingin memesan paket catering:

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

      window.open(waUrl, '_blank')
      navigate(`/cek-pesanan?code=${orderCode}`)
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
      <main
        className={`min-h-screen overflow-x-clip transition-colors duration-300 ${isDark
          ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
          : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-[#2B120E]'
          }`}
      >
        <PageLoader
          isLoading={true}
          text="Menyiapkan Detail Menu..."
          subtext="Memuat racikan bumbu dan pilihan paket hidangan Pawon Hara"
          minDuration={600}
        />
      </main>
    )
  }

  if (isError || !product) {
    return (
      <main
        className={`flex min-h-screen items-center justify-center px-6 transition-colors duration-300 ${isDark ? 'bg-[#1C0B09] text-white' : 'bg-[#FBF7F2] text-[#2B120E]'
          }`}
      >
        <div
          className={`text-center max-w-md rounded-3xl p-8 border shadow-xl ${isDark
            ? 'bg-[#2D120F] border-[#60241E]'
            : 'bg-white border-[#E6DACD]'
            }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'
              }`}
          >
            Menu
          </p>
          <h1
            className={`mt-3 text-2xl font-dhaksinarga tracking-wide ${isDark ? 'text-white' : 'text-[#2B120E]'
              }`}
          >
            Menu Tidak Ditemukan
          </h1>
          <p className={`mt-3 text-sm ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
            Menu yang Anda cari mungkin sudah tidak tersedia atau telah diganti.
          </p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F59E0B] px-6 py-3 text-xs font-black text-[#1C0B09] transition hover:bg-amber-400"
          >
            <ArrowLeft size={16} />
            Kembali ke Semua Menu
          </Link>
        </div>
      </main>
    )
  }

  const displayImage = getProductDisplayImage(product)

  return (
    <main
      className={`min-h-screen overflow-x-clip pb-32 sm:pb-36 lg:pb-28 transition-colors duration-300 ${isDark
        ? 'bg-[#1C0B09] text-stone-100 selection:bg-[#F59E0B] selection:text-[#1C0B09]'
        : 'bg-[#FBF7F2] text-[#2B120E] selection:bg-[#F59E0B] selection:text-white'
        }`}
    >
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Menu Pawon Hara..."
        subtext="Memuat daftar lengkap paket bento, krisbar, dan nasi box spesial"
        minDuration={650}
      />

      <section className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
        {/* Navigation & Breadcrumb Bar (Clean & Elegant like CartPage) */}
        <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/menu"
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-2xs transition ${isDark
              ? 'bg-[#2D120F] text-amber-200 border border-[#60241E] hover:text-white hover:border-[#F59E0B] hover:bg-[#3B1814]'
              : 'bg-white text-[#5C3831] border border-[#E6DACD] hover:text-[#2B120E] hover:border-[#D97706] hover:bg-[#FAF5EE]'
              }`}
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Semua Menu</span>
          </Link>

          {product.category && (
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold border ${isDark
                ? 'bg-[#2D120F] text-amber-300 border-[#60241E]'
                : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
            >
              {product.category.name}
            </span>
          )}
        </div>

        {/* 2-COLUMN MAIN GRID (Matches CartPage layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] gap-6 lg:gap-8 items-start">
          {/* ============================================================
              LEFT COLUMN: Produk, Add-ons, dan Pengatur Porsi
          ============================================================ */}
          <div className="space-y-5 sm:space-y-6">
            {/* 1. Primary Product Overview Card */}
            <div
              className={`overflow-hidden rounded-3xl border shadow-xl transition-all ${isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
                }`}
            >
              {/* Product Hero Image */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#1A0A08]">
                <img
                  src={displayImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C0B09]/85 via-black/20 to-transparent pointer-events-none" />

                {/* Min Order Badge */}
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#1C0B09]/90 border border-[#F59E0B]/40 px-3.5 py-1.5 text-xs font-black text-amber-300 shadow-md backdrop-blur">
                  <ShoppingBag size={13} className="text-[#F59E0B]" />
                  <span>Min. {minOrder} Porsi</span>
                </div>

                {/* Lead Time Badge */}
                {leadTimeDays > 0 && (
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-[#F59E0B] px-3 py-1.5 text-xs font-black text-[#1C0B09] shadow-md backdrop-blur">
                    <Clock size={13} />
                    <span>Pesan H-{leadTimeDays}</span>
                  </div>
                )}

                {/* Satisfaction Tag */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#1C0B09]/85 border border-[#60241E]/70 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                  <span className="text-[#F59E0B]">★ 4.9</span>
                  <span>Favorit Katering Pawon Hara</span>
                </div>
              </div>

              {/* Product Info & Highlights */}
              <div className="p-5 sm:p-7">
                <div className="border-b pb-4">
                  <h1
                    className={`text-2xl sm:text-3xl font-dhaksinarga tracking-wide font-black ${isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}
                  >
                    {product.name}
                  </h1>
                  <p
                    className={`mt-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-amber-100/75' : 'text-[#5C3831]'
                      }`}
                  >
                    {product.description ||
                      'Paket katering nasi box spesial dari Pawon Hara dengan cita rasa gurih meresap, higienis, dan dikemas rapi siap santap untuk melengkapi acaramu.'}
                  </p>
                </div>

                {/* Price Tag & Quick Benefits */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div>
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-200/60' : 'text-[#8C6B62]'
                        }`}
                    >
                      Harga Dasar Paket
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black font-poppins text-[#F59E0B]">
                        Rp {basePrice.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`text-xs font-medium ${isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'
                          }`}
                      >
                        / porsi
                      </span>
                    </div>
                  </div>

                  {/* Clean Trust Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark
                        ? 'border-[#60241E] bg-[#2D120F] text-amber-200'
                        : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831]'
                        }`}
                    >
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Alat Makan Lengkap
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark
                        ? 'border-[#60241E] bg-[#2D120F] text-amber-200'
                        : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831]'
                        }`}
                    >
                      <ShieldCheck size={13} className="text-emerald-500" />
                      100% Halal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Add-on & Kustomisasi Cards */}
            {product.addons_enabled && product.addon_groups && product.addon_groups.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                    <h2
                      className={`text-sm font-dhaksinarga tracking-wide font-black uppercase ${isDark ? 'text-white' : 'text-[#2B120E]'
                        }`}
                    >
                      Pilihan Variasi & Add-on
                    </h2>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-amber-200/60' : 'text-[#8C6B62]'}`}>
                    Disesuaikan per porsi
                  </span>
                </div>

                {product.addon_groups.map((group) => {
                  const isSingleSelect = group.max_selection === 1
                  const isRequired = group.min_selection > 0
                  const currentSelected = selectedAddons[group.id] || []

                  return (
                    <div
                      key={group.id}
                      className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-3.5 transition-all ${isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-[#2B120E]'
                                }`}
                            >
                              {group.name}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${isRequired
                                ? isDark
                                  ? 'bg-[#60241E] border-[#F59E0B]/40 text-amber-300'
                                  : 'bg-amber-100 border-amber-300 text-amber-900'
                                : isDark
                                  ? 'bg-[#1C0B09] border-[#60241E] text-amber-100/70'
                                  : 'bg-[#FAF5EE] border-[#E6DACD] text-[#6B423A]'
                                }`}
                            >
                              {isRequired ? 'Wajib Dipilih' : `Opsional (Maks. ${group.max_selection})`}
                            </span>
                          </div>
                          {group.description && (
                            <p
                              className={`text-xs mt-0.5 ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                                }`}
                            >
                              {group.description}
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-amber-300'
                            : 'border-[#E6DACD] bg-[#FAF5EE] text-[#8C4320]'
                            }`}
                        >
                          {currentSelected.length} / {group.max_selection} Dipilih
                        </span>
                      </div>

                      {/* Addon Choice Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {group.addons.map((addon) => {
                          const isSelected = currentSelected.includes(addon.id)
                          const priceNum = Number(addon.price)

                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(group, addon.id)}
                              className={`flex items-center justify-between rounded-2xl p-3.5 text-left border transition-all cursor-pointer ${isSelected
                                ? isDark
                                  ? 'border-[#F59E0B] bg-[#3B1814] shadow-md ring-1 ring-[#F59E0B]'
                                  : 'border-[#D97706] bg-amber-50/80 shadow-md ring-1 ring-[#D97706]'
                                : isDark
                                  ? 'border-[#60241E] bg-[#1C0B09] hover:border-[#F59E0B]/40 hover:bg-[#250D0A]'
                                  : 'border-[#E6DACD] bg-[#FAF5EE] hover:border-[#D97706]/50 hover:bg-white'
                                }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-${isSingleSelect ? 'full' : 'md'
                                    } border transition ${isSelected
                                      ? isDark
                                        ? 'border-[#F59E0B] bg-[#F59E0B] text-[#1C0B09]'
                                        : 'border-[#D97706] bg-[#D97706] text-white'
                                      : isDark
                                        ? 'border-[#60241E] bg-[#2D120F]'
                                        : 'border-[#DDCBC0] bg-white'
                                    }`}
                                >
                                  {isSelected &&
                                    (isSingleSelect ? (
                                      <div
                                        className={`h-2 w-2 rounded-full ${isDark ? 'bg-[#1C0B09]' : 'bg-white'
                                          }`}
                                      />
                                    ) : (
                                      <Check size={12} strokeWidth={3} />
                                    ))}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className={`text-xs sm:text-sm font-bold truncate ${isSelected
                                      ? isDark
                                        ? 'text-[#F59E0B]'
                                        : 'text-[#B45309]'
                                      : isDark
                                        ? 'text-white'
                                        : 'text-[#2B120E]'
                                      }`}
                                  >
                                    {addon.name}
                                  </p>
                                  {addon.description && (
                                    <p
                                      className={`text-[11px] truncate ${isDark ? 'text-amber-100/60' : 'text-[#6B423A]'
                                        }`}
                                    >
                                      {addon.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${priceNum === 0
                                  ? isDark
                                    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : isDark
                                    ? 'border-[#60241E] bg-[#2D120F] text-amber-300'
                                    : 'border-amber-200 bg-amber-100 text-amber-800'
                                  }`}
                              >
                                {priceNum === 0 ? 'Termasuk' : `+Rp ${priceNum.toLocaleString('id-ID')}`}
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

            {/* 3. Porsi & Jumlah Pesanan Card (Styled cleanly like CartPage) */}
            <div
              className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-4 ${isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-[#E6DACD] bg-white'
                }`}
            >
              {/* Header & Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
                <div>
                  <h3
                    className={`text-sm font-dhaksinarga tracking-wide font-black uppercase flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}
                  >
                    <ShoppingBag size={16} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                    <span>Jumlah Porsi Pesanan</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
                    Minimal pemesanan: <strong className="text-[#F59E0B]">{minOrder} porsi</strong>
                  </p>
                </div>

                {/* Mode Switcher */}
                <div
                  className={`inline-flex items-center rounded-xl p-1 border self-start sm:self-auto shadow-inner ${isDark ? 'bg-[#1C0B09] border-[#60241E]' : 'bg-[#FAF5EE] border-[#E6DACD]'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('kelipatan10')}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer ${portionMode === 'kelipatan10'
                      ? 'bg-[#F59E0B] text-[#1C0B09] font-black shadow-sm'
                      : isDark
                        ? 'text-amber-100/70 hover:text-white font-semibold'
                        : 'text-[#6B423A] hover:text-[#2B120E] font-semibold'
                      }`}
                  >
                    Kelipatan 10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('satuan')}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer ${portionMode === 'satuan'
                      ? 'bg-[#F59E0B] text-[#1C0B09] font-black shadow-sm'
                      : isDark
                        ? 'text-amber-100/70 hover:text-white font-semibold'
                        : 'text-[#6B423A] hover:text-[#2B120E] font-semibold'
                      }`}
                  >
                    Satuan (+1)
                  </button>
                </div>
              </div>

              {/* Stepper + Quick Chips */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold mr-1 ${isDark ? 'text-amber-200/50' : 'text-[#8C6B62]'
                      }`}
                  >
                    Pilih Cepat:
                  </span>
                  {[10, 20, 30, 50, 100, 200]
                    .filter((count) => count >= minOrder)
                    .map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuantity(count)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-bold border transition cursor-pointer ${quantity === count
                          ? 'border-transparent bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] font-black shadow-sm'
                          : isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-amber-200/70 hover:bg-[#3B1814] hover:text-white'
                            : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831] hover:bg-white hover:text-[#2B120E]'
                          }`}
                      >
                        {count}
                      </button>
                    ))}
                </div>

                {/* Stepper Buttons */}
                <div
                  className={`inline-flex items-center rounded-2xl border p-1 shadow-inner self-start sm:self-auto ${isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#FAF5EE]'
                    }`}
                >
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= minOrder}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${isDark
                      ? 'border-[#60241E] bg-[#2D120F] text-white hover:bg-[#3B1814]'
                      : 'border-[#E6DACD] bg-white text-[#2B120E] hover:bg-[#FAF5EE]'
                      }`}
                    title={`Kurangi ${step} porsi`}
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>

                  <div className="flex items-center justify-center px-3 min-w-[80px]">
                    <input
                      type="number"
                      value={quantity}
                      step={step}
                      min={minOrder}
                      onChange={(e) => handleQuantityInput(e.target.value)}
                      onBlur={handleQuantityBlur}
                      className={`w-14 text-center font-black text-lg bg-transparent outline-none font-poppins ${isDark ? 'text-white' : 'text-[#2B120E]'
                        }`}
                    />
                    <span
                      className={`text-xs font-semibold ${isDark ? 'text-amber-200/60' : 'text-[#8C6B62]'
                        }`}
                    >
                      porsi
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleIncrease}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#E77B49] text-[#1C0B09] shadow-sm transition hover:brightness-110 active:scale-95 cursor-pointer"
                    title={`Tambah ${step} porsi`}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              RIGHT COLUMN: Sticky Order Summary Card (Like CartPage)
          ============================================================ */}
          <div className="lg:sticky lg:top-28 space-y-4">
            <div
              className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-4 ${isDark
                ? 'border-[#60241E] bg-[#240E0C] text-stone-100'
                : 'border-[#E6DACD] bg-white text-[#2B120E]'
                }`}
            >
              <h3
                className={`text-sm font-dhaksinarga tracking-wide font-black uppercase border-b pb-3 flex items-center justify-between ${isDark ? 'border-[#60241E] text-white' : 'border-[#E6DACD] text-[#2B120E]'
                  }`}
              >
                <span>Ringkasan Pesanan</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${isDark
                    ? 'bg-[#2D120F] border-[#60241E] text-amber-300'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                    }`}
                >
                  {quantity} Porsi
                </span>
              </h3>

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div
                  className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}
                >
                  <span>Harga Satuan:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                    Rp {unitPrice.toLocaleString('id-ID')} / porsi
                  </span>
                </div>

                <div
                  className={`flex justify-between ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}
                >
                  <span>Paket Menu ({quantity} porsi):</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#2B120E]'}`}>
                    Rp {baseTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {selectedAddonSummary.length > 0 &&
                  selectedAddonSummary.some((a) => a.price > 0) && (
                    <div
                      className={`rounded-2xl border p-3 space-y-1.5 ${isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-amber-100/80'
                        : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831]'
                        }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
                          }`}
                      >
                        Kustomisasi Tambahan:
                      </p>
                      {selectedAddonSummary
                        .filter((item) => item.price > 0)
                        .map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] pl-1">
                            <span className="truncate">• {item.addonName}</span>
                            <span
                              className={`font-mono font-semibold shrink-0 ${isDark ? 'text-amber-300' : 'text-[#8C4320]'
                                }`}
                            >
                              +Rp {item.subtotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                {/* Lead Time Notice */}
                {leadTimeDays > 0 && (
                  <div
                    className={`rounded-2xl border p-3 ${isDark
                      ? 'border-[#60241E] bg-[#2D120F] text-amber-100'
                      : 'border-[#E6DACD] bg-[#FAF5EE] text-[#5C3831]'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <Clock
                        size={15}
                        className={`shrink-0 mt-0.5 ${isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'
                          }`}
                      />
                      <div className="text-[11px] leading-snug">
                        <p
                          className={`font-bold font-dhaksinarga tracking-wide ${isDark ? 'text-amber-300' : 'text-[#B45309]'
                            }`}
                        >
                          Batas Waktu Pemesanan (H-{leadTimeDays})
                        </p>
                        <p className={`mt-0.5 ${isDark ? 'text-amber-100/80' : 'text-[#6B423A]'}`}>
                          Minimal dipesan H-{leadTimeDays} sebelum acara Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Estimasi */}
                <div
                  className={`border-t pt-3 flex items-baseline justify-between ${isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                    }`}
                >
                  <div>
                    <p
                      className={`text-xs font-dhaksinarga tracking-wide uppercase font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'
                        }`}
                    >
                      Total Estimasi
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-amber-200/60' : 'text-[#6B423A]'}`}>
                      Harga final via invoice katering
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl font-poppins tracking-wide font-black text-[#F59E0B]">
                    Rp {estimatedTotal.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Desktop Dual CTA Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleOpenOrderModal}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 py-4 text-sm font-dhaksinarga tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 transition hover:brightness-110 active:scale-[0.99] cursor-pointer"
                >
                  <MessageCircle size={20} />
                  <span>Pesan Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-5 py-3 text-xs sm:text-sm font-bold transition active:scale-[0.99] cursor-pointer ${isDark
                    ? 'border-[#60241E] bg-[#2D120F] text-amber-200 hover:border-[#F59E0B] hover:text-white'
                    : 'border-[#E6DACD] bg-white text-[#5C3831] hover:border-[#D97706] hover:bg-[#FAF5EE]'
                    }`}
                >
                  <ShoppingCart size={17} />
                  <span>Tambah ke Keranjang</span>
                </button>
              </div>

              {/* 3 Compact Trust Badges */}
              <div
                className={`pt-2 border-t flex items-center justify-around text-center text-[10px] font-semibold ${isDark ? 'border-[#60241E] text-amber-200/60' : 'border-[#E6DACD] text-[#8C6B62]'
                  }`}
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  100% Halal
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} />
                  Tepat Waktu
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Alat Lengkap
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ORDER CONFIRMATION MODAL (FORM PEMESANAN CATERING)
      ====================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-fade-in w-full max-w-full overflow-hidden overscroll-none"
          style={{ touchAction: 'pan-y' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault()
          }}
        >
          <div
            className={`relative w-full max-w-lg overflow-hidden rounded-t-[2rem] sm:rounded-3xl border shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] ${isDark
              ? 'border-[#60241E] bg-[#240E0C] text-stone-100'
              : 'border-[#E6DACD] bg-[#FBF7F2] text-[#2B120E]'
              }`}
          >
            {/* Modal Header */}
            <div
              className={`border-b px-5 sm:px-6 py-4 shrink-0 ${isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-[#F5EDE4]'
                }`}
            >
              {/* Mobile grab handle */}
              <div
                className={`w-10 h-1 rounded-full mx-auto mb-3 sm:hidden ${isDark ? 'bg-[#60241E]' : 'bg-[#E6DACD]'
                  }`}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${isDark
                      ? 'bg-[#2D120F] text-[#F59E0B] border-[#60241E]'
                      : 'bg-white text-[#D97706] border-[#E6DACD]'
                      }`}
                  >
                    <ShoppingBag size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-dhaksinarga tracking-wide font-black text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-[#2B120E]'
                        }`}
                    >
                      Konfirmasi Pesanan Langsung
                    </h3>
                    <p
                      className={`text-xs truncate ${isDark ? 'text-amber-100/70' : 'text-[#5C3831]'
                        }`}
                    >
                      {product.name} • {quantity} Porsi
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`shrink-0 rounded-full p-2 transition cursor-pointer ${isDark
                    ? 'text-stone-400 hover:bg-[#2D120F] hover:text-white'
                    : 'text-[#6B423A] hover:bg-[#EAE0D5] hover:text-[#2B120E]'
                    }`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <form
              onSubmit={handleSubmitOrder}
              className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-4 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              {/* Compact Order Summary Box */}
              <div
                className={`rounded-2xl border p-3.5 space-y-2 text-xs w-full max-w-full overflow-hidden ${isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-[#E6DACD] bg-white'
                  }`}
              >
                <div className="flex justify-between items-baseline gap-2 min-w-0">
                  <span className="font-semibold truncate">
                    {product.name} ({quantity} porsi)
                  </span>
                  <span
                    className={`font-poppins font-semibold shrink-0 ${isDark ? 'text-[#F59E0B]' : 'text-[#B45309]'
                      }`}
                  >
                    Rp {baseTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {selectedAddonSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-baseline gap-2 text-[11px] pl-2 min-w-0 ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'
                      }`}
                  >
                    <span className="truncate">↳ {item.addonName}</span>
                    <span
                      className={`font-mono font-semibold shrink-0 ${isDark ? 'text-amber-300' : 'text-[#8C4320]'
                        }`}
                    >
                      {item.price > 0
                        ? `+Rp ${(item.price * quantity).toLocaleString('id-ID')}`
                        : 'Termasuk'}
                    </span>
                  </div>
                ))}

                <div
                  className={`border-t pt-2 flex justify-between items-baseline gap-2 font-bold min-w-0 ${isDark ? 'border-[#60241E] text-white' : 'border-[#E6DACD] text-[#2B120E]'
                    }`}
                >
                  <span className="font-dhaksinarga tracking-wide truncate">
                    Total Estimasi ({quantity} Porsi):
                  </span>
                  <span className="text-[#F59E0B] font-poppins tracking-wide font-black text-base shrink-0">
                    Rp {estimatedTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full">
                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                      }`}
                  >
                    Tanggal Acara <span className="text-[#E77B49]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-amber-400' : 'text-[#D97706]'
                        }`}
                    />
                    <input
                      type="date"
                      required
                      min={minDateString}
                      value={eventDate}
                      onChange={handleEventDateChange}
                      className={`w-full max-w-full min-w-0 h-11 rounded-xl border pl-10 pr-3 text-base sm:text-sm font-medium outline-none transition ${isDateInvalid
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
                        Pemesanan minimal H-{leadTimeDays} sebelum acara (paling cepat{' '}
                        {formatMinDateLabel(minDateString)}).
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
                            {dateCapacity?.override_note
                              ? ` (${dateCapacity.override_note})`
                              : ''}{' '}
                            Silakan pilih tanggal lain.
                          </span>
                        </div>
                      ) : isDateFull ? (
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-800 bg-red-950/60 p-2 text-[11px] text-red-200">
                          <AlertCircle size={14} className="shrink-0 text-red-400 mt-0.5" />
                          <span>
                            Kapasitas dapur untuk tanggal ini sudah penuh ({dateCapacity?.max_capacity}{' '}
                            box). Silakan pilih tanggal lain.
                          </span>
                        </div>
                      ) : isExceedingCapacity ? (
                        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-600 bg-amber-950/60 p-2 text-[11px] text-amber-200">
                          <AlertCircle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                          <span>
                            Sisa kuota dapur tanggal ini hanya{' '}
                            <strong>{dateCapacity?.remaining_portions} box</strong> (pesanan Anda:{' '}
                            <strong>{quantity} box</strong>).
                          </span>
                        </div>
                      ) : dateCapacity ? (
                        <div
                          className={`mt-2 flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-[11px] ${isDark
                            ? 'border-[#F59E0B]/40 bg-[#2D120F] text-amber-200'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            }`}
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Kapasitas Dapur Tersedia</span>
                          </span>
                          <span
                            className={`font-bold ${isDark ? 'text-[#F59E0B]' : 'text-emerald-700'
                              }`}
                          >
                            Sisa {dateCapacity.remaining_portions} Box
                          </span>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                      }`}
                  >
                    Jam Acara (Kira-kira)
                  </label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-amber-400' : 'text-[#D97706]'
                        }`}
                    />
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className={`w-full max-w-full min-w-0 h-11 rounded-xl border pl-10 pr-3 text-base sm:text-sm font-medium outline-none transition ${isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                        : 'border-[#E6DACD] bg-white text-[#2B120E] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}
                >
                  Nama Pemesan / Instansi <span className="text-[#E77B49]">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-amber-400' : 'text-[#D97706]'
                      }`}
                  />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bpk. Budi Santoso / PT Sejahtera"
                    className={`w-full max-w-full min-w-0 h-11 rounded-xl border pl-10 pr-3 text-base sm:text-sm font-medium outline-none transition ${isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                      : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                      }`}
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}
                >
                  Nomor WhatsApp Aktif <span className="text-[#E77B49]">*</span>
                </label>
                <div className="relative">
                  <MessageCircle
                    size={16}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-amber-400' : 'text-[#D97706]'
                      }`}
                  />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className={`w-full max-w-full min-w-0 h-11 rounded-xl border pl-10 pr-3 text-base sm:text-sm font-medium outline-none transition ${isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                      : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                      }`}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}
                >
                  Alamat Pengantaran / Lokasi Acara <span className="text-[#E77B49]">*</span>
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className={`absolute left-3.5 top-3 pointer-events-none ${isDark ? 'text-amber-400' : 'text-[#D97706]'
                      }`}
                  />
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Contoh: Gedung Graha Lt. 5, Jl. Sudirman No. 10..."
                    className={`w-full max-w-full min-w-0 rounded-xl border pl-10 pr-3.5 py-2.5 text-base sm:text-sm font-medium outline-none transition resize-none ${isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                      : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                      }`}
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-100/80' : 'text-[#5C3831]'
                    }`}
                >
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Sambal dipisah, minta sendok ekstra, titip di resepsionis..."
                  className={`w-full max-w-full min-w-0 rounded-xl border px-3.5 py-2.5 text-base sm:text-sm font-medium outline-none transition resize-none ${isDark
                    ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20'
                    : 'border-[#E6DACD] bg-white text-[#2B120E] placeholder-stone-400 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                    }`}
                />
              </div>

              {/* Modal Sticky Footer Actions */}
              <div
                className={`pt-3 flex items-center justify-end gap-2.5 border-t w-full max-w-full ${isDark ? 'border-[#60241E]' : 'border-[#E6DACD]'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${isDark
                    ? 'text-amber-200 hover:bg-[#2D120F]'
                    : 'text-[#5C3831] hover:bg-[#EAE0D5]'
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-dhaksinarga tracking-wide font-black transition bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 hover:brightness-110 active:scale-[0.99] disabled:bg-[#2D120F] disabled:text-stone-500 disabled:border disabled:border-[#60241E] disabled:cursor-not-allowed disabled:shadow-none cursor-pointer min-w-0 shrink"
                >
                  {isSubmitting ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <MessageCircle size={16} className="shrink-0" />
                      <span className="truncate">Kirim Pesanan via WhatsApp</span>
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
