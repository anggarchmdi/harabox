import { useState, useEffect, useMemo, useRef } from 'react'
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
  User,
  UtensilsCrossed,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageLoader from '../components/ui/PageLoader'
import { TimeInput24 } from '../components/ui/TimeInput24'
import { productService } from '../services/products.service'
import { ordersService } from '../services/orders.service'
import { settingsService } from '../services/settings.service'
import { getImageUrl } from '../utils/image'
import { useCartStore, type CartItemAddon } from '../stores/cart.store'
import { useThemeStore } from '../stores/theme.store'
import { useSEO } from '../hooks/useSEO'
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

  const seoDisplayImage = product ? getProductDisplayImage(product) : undefined
  const productImageUrl = seoDisplayImage
    ? seoDisplayImage.startsWith('http')
      ? seoDisplayImage
      : `https://pawonhara.com${seoDisplayImage}`
    : 'https://pawonhara.com/og-image.jpg'

  const productSchema = useMemo(() => {
    if (!product) return undefined
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: [productImageUrl],
      description: product.description || `Pesan paket ${product.name} lezat dari Pawon Hara Katering Jogja.`,
      sku: `PH-${product.id}`,
      brand: {
        '@type': 'Brand',
        name: 'Pawon Hara',
      },
      offers: {
        '@type': 'Offer',
        url: `https://pawonhara.com/menu/${slug}`,
        priceCurrency: 'IDR',
        price: product.price,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Pawon Hara',
        },
      },
    }
  }, [product, productImageUrl, slug])

  useSEO({
    title: product ? `${product.name} | Pawon Hara Nasi Box Jogja` : 'Detail Menu | Pawon Hara',
    description: product?.description
      ? `${product.description} Pesan sekarang di Pawon Hara Jogja dengan harga Rp ${Number(product.price).toLocaleString('id-ID')}.`
      : 'Pesan paket katering dan nasi box lezat dari Pawon Hara Jogja.',
    canonical: `/menu/${slug}`,
    ogImage: productImageUrl,
    ogType: 'product',
    keywords: product
      ? `${product.name}, pesan ${product.name}, nasi box jogja, catering jogja, pawon hara`
      : undefined,
    schema: productSchema,
  })

  const [quantity, setQuantity] = useState<number>(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false)
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
    if (isModalOpen || isImageLightboxOpen) {
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
  }, [isModalOpen, isImageLightboxOpen])

  // Image Lightbox Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 })

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(3, Number((prev + 0.5).toFixed(2))))
  }

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(2)))
      if (next === 1) setPanPosition({ x: 0, y: 0 })
      return next
    })
  }

  const handleResetZoom = () => {
    setZoomScale(1)
    setPanPosition({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const closeImageLightbox = () => {
    setIsImageLightboxOpen(false)
    handleResetZoom()
  }

  useEffect(() => {
    if (!isImageLightboxOpen) {
      handleResetZoom()
    }
  }, [isImageLightboxOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageLightbox()
      } else if (isImageLightboxOpen) {
        if (e.key === '+' || e.key === '=') {
          handleZoomIn()
        } else if (e.key === '-' || e.key === '_') {
          handleZoomOut()
        } else if (e.key === '0') {
          handleResetZoom()
        }
      }
    }
    if (isImageLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImageLightboxOpen])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panPosition.x,
      startPanY: panPosition.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return
    e.preventDefault()
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    const maxPan = 240 * (zoomScale - 1)
    setPanPosition({
      x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.startPanX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.startPanY + dy)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      startPanX: panPosition.x,
      startPanY: panPosition.y,
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomScale <= 1) return
    const dx = e.touches[0].clientX - dragStartRef.current.x
    const dy = e.touches[0].clientY - dragStartRef.current.y
    const maxPan = 240 * (zoomScale - 1)
    setPanPosition({
      x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.startPanX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.startPanY + dy)),
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))
    } else if (e.deltaY > 0) {
      setZoomScale((prev) => {
        const next = Math.max(1, Number((prev - 0.25).toFixed(2)))
        if (next === 1) setPanPosition({ x: 0, y: 0 })
        return next
      })
    }
  }

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleResetZoom()
    } else {
      setZoomScale(2)
      setPanPosition({ x: 0, y: 0 })
    }
  }

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

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(minOrder, prev - 1))
  }

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1)
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
      step: 1,
      portion_mode: 'satuan',
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

      const waUrl = `https://wa.me/6281122225520?text=${encodeURIComponent(waText)}`

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
            className={`mt-3 text-2xl font-poppins tracking-wide ${isDark ? 'text-white' : 'text-[#2B120E]'
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
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsImageLightboxOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsImageLightboxOpen(true)
                  }
                }}
                title="Klik untuk memperbesar foto menu"
                className={`group relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden cursor-pointer select-none transition-colors ${isDark
                  ? 'bg-gradient-to-br from-[#2D120F] via-[#240E0C] to-[#1C0B09]'
                  : 'bg-gradient-to-br from-[#FAF5EE] via-[#F4ECE1] to-[#EAE0D3]'
                  }`}
              >
                <img
                  src={displayImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 drop-shadow-md"
                />

                {/* Harmonized subtle overlay */}
                {isDark ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C0B09]/80 via-black/15 to-transparent pointer-events-none" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2B120E]/20 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Min Order Badge */}
                <div
                  className={`absolute left-3.5 top-3.5 sm:left-4 sm:top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-3.5 text-xs font-black shadow-md backdrop-blur-md transition-transform duration-300 group-hover:scale-105 ${isDark
                    ? 'bg-[#1C0B09]/90 border border-[#F59E0B]/40 text-amber-300'
                    : 'bg-white/95 border border-[#E6DACD] text-[#8C3A00]'
                    }`}
                >
                  <ShoppingBag size={13} className="text-[#F59E0B]" />
                  <span>Min. {minOrder} Porsi</span>
                </div>

                {/* Lead Time Badge */}
                {leadTimeDays > 0 && (
                  <div className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 flex items-center gap-1.5 rounded-full bg-[#F59E0B] px-3 py-1.5 text-xs font-black text-[#1C0B09] shadow-md backdrop-blur transition-transform duration-300 group-hover:scale-105">
                    <Clock size={13} />
                    <span>Pesan H-{leadTimeDays}</span>
                  </div>
                )}

                {/* Satisfaction Tag */}
                <div
                  className={`absolute bottom-3.5 left-3.5 sm:bottom-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md ${isDark
                    ? 'bg-[#1C0B09]/85 border border-[#60241E]/70 text-white'
                    : 'bg-white/95 border border-[#E6DACD] text-[#2B120E]'
                    }`}
                >
                  <span className="text-[#F59E0B]">★ 4.9</span>
                  <span className="hidden xs:inline">Favorit Katering Pawon Hara</span>
                  <span className="xs:hidden">Favorit Hara</span>
                </div>

                {/* Zoom / Expand Hint Badge */}
                <div
                  className={`absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all duration-300 group-hover:scale-105 ${isDark
                    ? 'bg-[#1C0B09]/90 border border-[#60241E] text-amber-300 group-hover:border-[#F59E0B]'
                    : 'bg-white/95 border border-[#E6DACD] text-[#5C3831] group-hover:border-[#D97706]'
                    }`}
                >
                  <Maximize2 size={13} className="text-[#F59E0B]" />
                  <span className="hidden sm:inline">Perbesar Foto</span>
                </div>
              </div>

              {/* Product Info & Highlights */}
              <div className="p-5 sm:p-7">
                <div className="border-b pb-4">
                  <h1
                    className={`text-2xl sm:text-3xl font-poppins  tracking-wide font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'
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

                {/* Daftar Isi Paket (Termasuk dalam Paket Dasar) */}
                {product.package_items && product.package_items.length > 0 && (
                  <div
                    className={`mt-5 rounded-2xl border p-4 sm:p-5 transition-all ${isDark
                      ? 'border-[#60241E]/90 bg-[#1F0C0A]'
                      : 'border-[#E6DACD] bg-[#FAF5EE]/90'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-inherit">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg ${isDark
                            ? 'bg-[#3B1814] text-[#F59E0B]'
                            : 'bg-[#FAF0E4] text-[#D97706]'
                            }`}
                        >
                          <UtensilsCrossed size={13} />
                        </div>
                        <h2
                          className={`text-xs sm:text-sm font-bold tracking-wide uppercase font-poppins ${isDark ? 'text-white' : 'text-[#2B120E]'
                            }`}
                        >
                          Sudah Termasuk Dalam Paket
                        </h2>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isDark
                          ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                      >
                        Harga Dasar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {product.package_items.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium border transition-colors ${isDark
                            ? 'border-[#60241E]/50 bg-[#2D120F]/60 text-amber-100/90'
                            : 'border-[#E6DACD]/70 bg-white text-[#4A261F]'
                            }`}
                        >
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Add-on & Kustomisasi Cards */}
            {product.addons_enabled && product.addon_groups && product.addon_groups.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    {/* <Sparkles size={16} className={isDark ? 'text-[#F59E0B]' : 'text-[#D97706]'} /> */}
                    <h2
                      className={`text-sm font-poppins tracking-wide font-black uppercase ${isDark ? 'text-white' : 'text-[#2B120E]'
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
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
                <div>
                  <h3
                    className={`text-sm font-poppins tracking-wide font-black uppercase flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#2B120E]'
                      }`}
                  >
                    <span>Jumlah Porsi Pesanan</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-100/70' : 'text-[#6B423A]'}`}>
                    Minimal pemesanan: <strong className="text-[#F59E0B]">{minOrder} porsi</strong>
                  </p>
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
                    title="Kurangi 1 porsi"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>

                  <div className="flex items-center justify-center px-3 min-w-[80px]">
                    <input
                      type="number"
                      value={quantity}
                      step={1}
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
                    title="Tambah 1 porsi"
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
                className={`text-sm font-poppins tracking-wide font-black uppercase border-b pb-3 flex items-center justify-between ${isDark ? 'border-[#60241E] text-white' : 'border-[#E6DACD] text-[#2B120E]'
                  }`}
              >
                <span>Ringkasan Pesanan</span>
                <span
                  className={`rounded-full font-poppins border px-2.5 py-0.5 text-xs font-bold ${isDark
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
                          className={`font-bold font-poppins tracking-wide ${isDark ? 'text-amber-300' : 'text-[#B45309]'
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
                      className={`text-xs font-poppins tracking-wide uppercase font-bold ${isDark ? 'text-white' : 'text-[#2B120E]'
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
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] px-6 py-4 text-sm font-poppins tracking-wide font-black text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 transition hover:brightness-110 active:scale-[0.99] cursor-pointer"
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
                  <span className="font-poppins tracking-wide truncate">
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
                  <TimeInput24
                    value={eventTime}
                    onChange={setEventTime}
                    isDark={isDark}
                    placeholder="Contoh: 11:30"
                  />
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-poppins tracking-wide font-black transition bg-gradient-to-r from-[#F59E0B] via-[#E77B49] to-[#F59E0B] text-[#1C0B09] shadow-lg shadow-[#F59E0B]/20 hover:brightness-110 active:scale-[0.99] disabled:bg-[#2D120F] disabled:text-stone-500 disabled:border disabled:border-[#60241E] disabled:cursor-not-allowed disabled:shadow-none cursor-pointer min-w-0 shrink"
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

      {/* ============================================================
          PHOTO LIGHTBOX / MODAL PREVIEW
      ============================================================ */}
      {isImageLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${product.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
          onClick={closeImageLightbox}
        >
          {/* Close button at top right of viewport */}
          <button
            type="button"
            onClick={closeImageLightbox}
            aria-label="Tutup preview foto"
            className="absolute top-4 right-4 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/90 border border-white/20 transition active:scale-95 cursor-pointer shadow-xl backdrop-blur-sm"
          >
            <X size={22} />
          </button>

          {/* Modal Content Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center rounded-3xl overflow-hidden border shadow-2xl transition-all ${isDark
              ? 'border-[#60241E] bg-[#240E0C]'
              : 'border-[#E6DACD] bg-[#FAF5EE]'
              }`}
          >
            {/* Image Canvas with theme-harmonized background & Zoom Controls */}
            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              className={`relative w-full flex items-center justify-center p-4 sm:p-8 min-h-[280px] max-h-[75vh] overflow-hidden select-none ${isDark
                ? 'bg-gradient-to-br from-[#2D120F] via-[#240E0C] to-[#1C0B09]'
                : 'bg-gradient-to-br from-[#FAF5EE] via-[#F4ECE1] to-[#EAE0D3]'
                } ${zoomScale > 1
                  ? isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-zoom-in'
                }`}
            >
              {/* Floating Zoom Controls Bar */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 left-4 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1.5 backdrop-blur-md shadow-lg border border-white/20 bg-black/65 text-white"
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 1}
                  title="Perkecil (-)"
                  aria-label="Perkecil"
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ZoomOut size={16} />
                </button>

                <span className="min-w-[42px] text-center text-xs font-mono font-bold text-amber-300 select-none">
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 3}
                  title="Perbesar (+)"
                  aria-label="Perbesar"
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ZoomIn size={16} />
                </button>

                {zoomScale > 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset Zoom (0)"
                    aria-label="Reset Zoom"
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer border-l border-white/20 pl-1 ml-0.5"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Navigation hint when zoomed */}
              {zoomScale > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-amber-200/90 shadow backdrop-blur-sm whitespace-nowrap">
                  Geser untuk navigasi • Klik 2x untuk reset
                </div>
              )}

              <img
                src={displayImage}
                alt={product.name}
                draggable={false}
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                }}
                className="max-h-[68vh] max-w-full w-auto h-auto object-contain drop-shadow-2xl select-none pointer-events-none"
              />
            </div>

            {/* Bottom Info Bar */}
            <div
              className={`w-full px-5 py-3.5 sm:px-6 sm:py-4 border-t flex flex-wrap items-center justify-between gap-3 ${isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white'
                : 'border-[#E6DACD] bg-white text-[#2B120E]'
                }`}
            >
              <div className="min-w-0">
                <h3 className="font-poppins font-bold text-sm sm:text-base truncate">
                  {product.name}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-200/70' : 'text-[#8C6B62]'}`}>
                  {product.category?.name ? `${product.category.name} • ` : ''}Min. {minOrder} Porsi
                </p>
              </div>

              <button
                type="button"
                onClick={closeImageLightbox}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${isDark
                  ? 'bg-[#2D120F] text-amber-200 border border-[#60241E] hover:bg-[#3B1814]'
                  : 'bg-[#FAF5EE] text-[#5C3831] border border-[#E6DACD] hover:bg-[#F3EBE0]'
                  }`}
              >
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
