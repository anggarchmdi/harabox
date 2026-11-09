import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
  AlertCircle,
  FileCheck2,
  Check,
  Truck,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { OrderStatus, PaymentStatus, UpdateAdminOrderPayload } from '../../../types/orders'
import type { Product } from '../../../types/products'
import type { Addon, AddonGroup } from '../../../types/addon'
import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'
import { ordersService } from '../../../services/orders.service'
import { useThemeStore } from '../../../stores/theme.store'
import { getImageUrl } from '../../../utils/image'
import { TimeInput24 } from '../../../components/ui/TimeInput24'
import OrderEditDiffModal, {
  type OrderDiffSummary,
  type FieldDiffItem,
  type ItemSummaryDetail,
} from '../../../components/admin/orders/OrderEditDiffModal'

function formatRupiah(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDateReadable(dateStr?: string | null) {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatToDateInputValue(dateStrOrObj?: string | Date | null): string {
  if (!dateStrOrObj) {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (typeof dateStrOrObj === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStrOrObj)) {
      return dateStrOrObj.slice(0, 10)
    }
    const d = new Date(dateStrOrObj)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  if (dateStrOrObj instanceof Date && !isNaN(dateStrOrObj.getTime())) {
    const year = dateStrOrObj.getFullYear()
    const month = String(dateStrOrObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateStrOrObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const DELIVERY_PRESETS = [10000, 15000, 20000, 25000, 30000]

interface SelectedOrderItem {
  tempId: string
  product: Product
  quantity: number
  selectedAddons: {
    addon: Addon
    groupName: string
  }[]
}

export default function EditAdminOrder() {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const queryClient = useQueryClient()

  // Mobile navigation tab: 'details' (Order details & cart) vs 'catalog' (Browse food items)
  const [mobileTab, setMobileTab] = useState<'details' | 'catalog'>('details')

  // Form Fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState(() => formatToDateInputValue())
  const [eventTime, setEventTime] = useState('11:00')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  // Delivery Fee & Toggle State
  const [isDeliveryFeeEnabled, setIsDeliveryFeeEnabled] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [userOverrodeDelivery, setUserOverrodeDelivery] = useState(true)

  const [notes, setNotes] = useState('')

  // Status & Payment
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('confirmed')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState('Transfer BSI')
  const [paymentNote, setPaymentNote] = useState('')

  // Cart / Items
  const [items, setItems] = useState<SelectedOrderItem[]>([])
  const [hasInitializedData, setHasInitializedData] = useState(false)

  // Product Selection & Addon Modal
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
  const [tempQuantity, setTempQuantity] = useState(1)
  const [tempSelectedAddons, setTempSelectedAddons] = useState<
    { addon: Addon; groupName: string; groupId: number }[]
  >([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<UpdateAdminOrderPayload | null>(null)
  const [diffSummary, setDiffSummary] = useState<OrderDiffSummary | null>(null)

  // Fetch categories
  const { data: categoryResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAdminAll(1),
  })
  const categories = categoryResponse?.data ?? []

  // Fetch active products with addons
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-active-products'],
    queryFn: () => productService.getAdminAll({ is_active: true, per_page: 100 }),
  })
  const products = productsData?.data ?? []

  // Fetch existing order data
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useQuery({
    queryKey: ['admin-order-edit', orderId],
    queryFn: () => ordersService.getById(orderId),
    enabled: !isNaN(orderId) && orderId > 0,
  })

  // Pre-populate fields when order and products are available
  useEffect(() => {
    if (order && !hasInitializedData) {
      setCustomerName(order.customers_name || '')
      setCustomerPhone(order.customers_phone || '')
      setEventDate(formatToDateInputValue(order.event_date))
      setEventTime(order.event_time ? order.event_time.slice(0, 5) : '11:00')
      setDeliveryAddress(order.delivery_address || '')

      const initialFee = Number(order.delivery_fee) || 0
      setDeliveryFee(initialFee)
      setIsDeliveryFeeEnabled(initialFee > 0)
      setUserOverrodeDelivery(true)

      setNotes(order.notes || '')
      setOrderStatus(order.status)
      setPaymentStatus(order.payment_status)
      setPaidAmount(Number(order.paid_amount) || 0)
      setPaymentMethod(order.payment_method || 'Transfer BSI')
      setPaymentNote(order.payment_note || '')

      // Map existing order items
      if (order.items && order.items.length > 0) {
        const mappedItems: SelectedOrderItem[] = order.items.map((it, idx) => {
          const matchedProduct = products.find((p) => p.id === it.product_id) || {
            id: it.product_id || 0,
            name: it.item_name,
            slug: it.product?.slug || '',
            price: it.price,
            minimum_order: 1,
            is_active: true,
            has_delivery_fee: false,
            delivery_fee: 0,
            addon_groups: [],
          } as unknown as Product

          const mappedAddons = (it.addons || []).map((ad) => ({
            addon: {
              id: ad.addon_id || 0,
              name: ad.addon_name || '',
              price: ad.price,
            } as Addon,
            groupName: ad.addon_group_name || 'Addon',
          }))

          return {
            tempId: `existing-${it.id || idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product: matchedProduct,
            quantity: it.quantity,
            selectedAddons: mappedAddons,
          }
        })
        setItems(mappedItems)
      }

      setHasInitializedData(true)
    }
  }, [order, products, hasInitializedData])

  // Filtered products for catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchProduct ||
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchProduct.toLowerCase()))
      const matchCat =
        selectedCategory === 'all' || String(p.category_id) === selectedCategory
      return matchSearch && matchCat
    })
  }, [products, searchProduct, selectedCategory])

  // Suggested delivery fee based on products in cart
  const suggestedDeliveryFee = useMemo(() => {
    const fees = items
      .filter((i) => i.product.has_delivery_fee)
      .map((i) => Number(i.product.delivery_fee) || 0)
    return fees.length > 0 ? Math.max(...fees) : 0
  }, [items])

  const hasDeliveryFeeProducts = suggestedDeliveryFee > 0

  // Calculation
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const addonsPrice = item.selectedAddons.reduce(
        (sum, a) => sum + Number(a.addon.price || 0),
        0
      )
      const unitPrice = Number(item.product.price) + addonsPrice
      return acc + unitPrice * item.quantity
    }, 0)
  }, [items])

  const effectiveDeliveryFee = isDeliveryFeeEnabled ? Number(deliveryFee || 0) : 0

  const total = useMemo(() => {
    return subtotal + effectiveDeliveryFee
  }, [subtotal, effectiveDeliveryFee])

  const remainingPayment = useMemo(() => {
    return Math.max(0, total - Number(paidAmount || 0))
  }, [total, paidAmount])

  // Total boxes ordered across all items
  const totalBoxes = useMemo(() => {
    return items.reduce((acc, i) => acc + i.quantity, 0)
  }, [items])

  // Open Product Configuration Modal
  const handleOpenConfigure = (product: Product) => {
    setConfiguringProduct(product)
    setTempQuantity(Math.max(1, product.minimum_order || 1))
    setTempSelectedAddons([])
  }

  // Toggle single addon in modal
  const handleToggleAddon = (group: AddonGroup, addon: Addon) => {
    setTempSelectedAddons((prev) => {
      const isSelected = prev.some((item) => item.addon.id === addon.id)
      if (isSelected) {
        return prev.filter((item) => item.addon.id !== addon.id)
      } else {
        return [...prev, { addon, groupName: group.name, groupId: group.id }]
      }
    })
  }

  // Select all addons in a group
  const handleSelectAllInGroup = (group: AddonGroup) => {
    setTempSelectedAddons((prev) => {
      const otherGroups = prev.filter((item) => item.groupId !== group.id)
      const allThisGroup = group.addons.map((a) => ({
        addon: a,
        groupName: group.name,
        groupId: group.id,
      }))
      return [...otherGroups, ...allThisGroup]
    })
  }

  // Clear all addons in a group
  const handleClearGroup = (groupId: number) => {
    setTempSelectedAddons((prev) => prev.filter((item) => item.groupId !== groupId))
  }

  // Modal live calculations
  const modalAddonsExtraPerUnit = useMemo(() => {
    return tempSelectedAddons.reduce(
      (sum, item) => sum + Number(item.addon.price || 0),
      0
    )
  }, [tempSelectedAddons])

  const modalUnitPrice = useMemo(() => {
    return Number(configuringProduct?.price || 0) + modalAddonsExtraPerUnit
  }, [configuringProduct, modalAddonsExtraPerUnit])

  const modalTotalPrice = useMemo(() => {
    return modalUnitPrice * tempQuantity
  }, [modalUnitPrice, tempQuantity])

  // Confirm Product Addition to Cart
  const handleConfirmAddToCart = () => {
    if (!configuringProduct) return

    if (tempQuantity < (configuringProduct.minimum_order || 1)) {
      toast.error(
        `Minimal pemesanan untuk ${configuringProduct.name} adalah ${configuringProduct.minimum_order} porsi.`
      )
      return
    }

    const selectedAddonList = tempSelectedAddons.map(({ addon, groupName }) => ({
      addon,
      groupName,
    }))

    const newItem: SelectedOrderItem = {
      tempId: `${configuringProduct.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product: configuringProduct,
      quantity: tempQuantity,
      selectedAddons: selectedAddonList,
    }

    setItems((prev) => [...prev, newItem])
    setConfiguringProduct(null)
    toast.success(
      `${configuringProduct.name} (${tempQuantity}x) berhasil ditambahkan.`
    )
  }

  // Change quantity of item in cart
  const handleUpdateItemQuantity = (tempId: string, newQty: number) => {
    if (newQty <= 0) {
      setItems((prev) => prev.filter((i) => i.tempId !== tempId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, quantity: newQty } : i))
    )
  }

  // Remove item from cart
  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }

  // Handle Delivery Toggle Switch
  const handleToggleDelivery = () => {
    setUserOverrodeDelivery(true)
    if (isDeliveryFeeEnabled) {
      setIsDeliveryFeeEnabled(false)
      setDeliveryFee(0)
    } else {
      setIsDeliveryFeeEnabled(true)
      setDeliveryFee(suggestedDeliveryFee > 0 ? suggestedDeliveryFee : 10000)
    }
  }

  // Handle Custom Delivery Preset click
  const handleSelectDeliveryPreset = (val: number) => {
    setUserOverrodeDelivery(true)
    setIsDeliveryFeeEnabled(true)
    setDeliveryFee(val)
  }

  // Reset to auto suggested delivery fee
  const handleResetToAutoDelivery = () => {
    setUserOverrodeDelivery(false)
    if (hasDeliveryFeeProducts) {
      setIsDeliveryFeeEnabled(true)
      setDeliveryFee(suggestedDeliveryFee)
    } else {
      setIsDeliveryFeeEnabled(false)
      setDeliveryFee(0)
    }
    toast.info('Ongkir disesuaikan kembali dengan saran produk katering.')
  }

  // Handle Payment Status change auto-fill
  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status)
    if (status === 'paid') {
      setPaidAmount(total)
    } else if (status === 'unpaid') {
      setPaidAmount(0)
    }
  }

  const computeOrderDiff = (): OrderDiffSummary => {
    const fieldDiffs: FieldDiffItem[] = []
    let criticalCount = 0

    // 1. Nama Pemesan
    const currentCustomerName = customerName.trim()
    const origCustomerName = (order?.customers_name || '').trim()
    if (origCustomerName !== currentCustomerName) {
      fieldDiffs.push({
        key: 'customers_name',
        label: 'Nama Pemesan',
        oldValue: origCustomerName || '(Kosong)',
        newValue: currentCustomerName || '(Kosong)',
        category: 'customer',
      })
    }

    // 2. No. WhatsApp
    const currentPhone = customerPhone.trim()
    const origPhone = (order?.customers_phone || '').trim()
    if (origPhone !== currentPhone) {
      fieldDiffs.push({
        key: 'customers_phone',
        label: 'Nomor WhatsApp',
        oldValue: origPhone || '(Kosong)',
        newValue: currentPhone || '(Kosong)',
        category: 'customer',
      })
    }

    // 3. Tanggal Acara (Critical)
    const currentEventDate = formatToDateInputValue(eventDate)
    const origEventDate = formatToDateInputValue(order?.event_date)
    if (origEventDate !== currentEventDate) {
      criticalCount++
      fieldDiffs.push({
        key: 'event_date',
        label: 'Tanggal Acara / Pengiriman',
        oldValue: formatDateReadable(origEventDate),
        newValue: formatDateReadable(currentEventDate),
        isCritical: true,
        category: 'schedule',
      })
    }

    // 4. Jam Acara / Pengiriman (Critical)
    const currentEventTime = eventTime.trim()
    const origEventTime = order?.event_time ? order.event_time.slice(0, 5) : ''
    if (origEventTime !== currentEventTime) {
      criticalCount++
      fieldDiffs.push({
        key: 'event_time',
        label: 'Jam Pengiriman / Acara',
        oldValue: origEventTime ? `${origEventTime} WIB` : '(Kosong)',
        newValue: currentEventTime ? `${currentEventTime} WIB` : '(Kosong)',
        isCritical: true,
        category: 'schedule',
      })
    }

    // 5. Alamat Pengiriman (Critical)
    const currentAddress = deliveryAddress.trim()
    const origAddress = (order?.delivery_address || '').trim()
    if (origAddress !== currentAddress) {
      criticalCount++
      fieldDiffs.push({
        key: 'delivery_address',
        label: 'Alamat Pengiriman',
        oldValue: origAddress || '(Kosong)',
        newValue: currentAddress || '(Kosong)',
        isCritical: true,
        category: 'delivery',
      })
    }

    // 6. Ongkos Kirim
    const currentDeliveryFee = isDeliveryFeeEnabled ? Number(deliveryFee) || 0 : 0
    const origDeliveryFee = Number(order?.delivery_fee || 0)
    if (origDeliveryFee !== currentDeliveryFee) {
      fieldDiffs.push({
        key: 'delivery_fee',
        label: 'Biaya Ongkos Kirim',
        oldValue: formatRupiah(origDeliveryFee),
        newValue: formatRupiah(currentDeliveryFee),
        category: 'delivery',
      })
    }

    // 7. Status Pesanan
    if (order?.status && order.status !== orderStatus) {
      fieldDiffs.push({
        key: 'status',
        label: 'Status Pesanan',
        oldValue: order.status.toUpperCase(),
        newValue: orderStatus.toUpperCase(),
        category: 'payment',
      })
    }

    // 8. Status Pembayaran
    if (order?.payment_status && order.payment_status !== paymentStatus) {
      fieldDiffs.push({
        key: 'payment_status',
        label: 'Status Pembayaran',
        oldValue: order.payment_status.toUpperCase(),
        newValue: paymentStatus.toUpperCase(),
        category: 'payment',
      })
    }

    // 9. Nominal Dibayar
    const currentPaid = Number(paidAmount || 0)
    const origPaid = Number(order?.paid_amount || 0)
    if (origPaid !== currentPaid) {
      fieldDiffs.push({
        key: 'paid_amount',
        label: 'Jumlah yang Telah Dibayar',
        oldValue: formatRupiah(origPaid),
        newValue: formatRupiah(currentPaid),
        category: 'payment',
      })
    }

    // 10. Metode Pembayaran
    const currentMethod = paymentMethod.trim()
    const origMethod = (order?.payment_method || '').trim()
    if (origMethod !== currentMethod) {
      fieldDiffs.push({
        key: 'payment_method',
        label: 'Metode Pembayaran',
        oldValue: origMethod || '(Kosong)',
        newValue: currentMethod || '(Kosong)',
        category: 'payment',
      })
    }

    // 11. Catatan Khusus Pesanan
    const currentNotes = notes.trim()
    const origNotes = (order?.notes || '').trim()
    if (origNotes !== currentNotes) {
      fieldDiffs.push({
        key: 'notes',
        label: 'Catatan Khusus Pesanan',
        oldValue: origNotes || '(Kosong)',
        newValue: currentNotes || '(Kosong)',
        category: 'notes',
      })
    }

    // 12. Catatan Pembayaran
    const currentPayNote = paymentNote.trim()
    const origPayNote = (order?.payment_note || '').trim()
    if (origPayNote !== currentPayNote) {
      fieldDiffs.push({
        key: 'payment_note',
        label: 'Catatan Pembayaran',
        oldValue: origPayNote || '(Kosong)',
        newValue: currentPayNote || '(Kosong)',
        category: 'payment',
      })
    }

    // 13. Menu Items & Addons Comparison
    const oldItems: ItemSummaryDetail[] = (order?.items || []).map((it) => ({
      name: it.item_name,
      quantity: it.quantity,
      price: Number(it.price || 0),
      addons: (it.addons || []).map((a) => a.addon_name || '').filter(Boolean),
    }))

    const newItems: ItemSummaryDetail[] = items.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      price: Number(it.product.price || 0),
      addons: it.selectedAddons.map((a) => a.addon.name),
    }))

    const serializeItems = (arr: ItemSummaryDetail[]) =>
      arr
        .map((it) => `${it.name.trim().toLowerCase()}|${it.quantity}|${[...it.addons].sort().join(',')}`)
        .sort()
        .join(';')

    const itemsChanged = serializeItems(oldItems) !== serializeItems(newItems)
    const oldTotalBoxes = oldItems.reduce((acc, i) => acc + i.quantity, 0)
    const newTotalBoxes = newItems.reduce((acc, i) => acc + i.quantity, 0)

    if (itemsChanged && oldTotalBoxes !== newTotalBoxes) {
      criticalCount++
    }

    const oldTotal = Number(order?.total || 0)
    const newTotal = total
    const diffTotal = newTotal - oldTotal

    const hasChanges =
      fieldDiffs.length > 0 || itemsChanged || Math.abs(diffTotal) > 0

    return {
      hasChanges,
      criticalCount,
      fieldDiffs,
      itemsChanged,
      oldTotalBoxes,
      newTotalBoxes,
      oldItems,
      newItems,
      oldTotal,
      newTotal,
      diffTotal,
      oldPaid: origPaid,
      newPaid: currentPaid,
    }
  }

  // Submit Order Form - Opens Diff Confirmation Modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast.error('Nama pemesan wajib diisi.')
      setMobileTab('details')
      return
    }
    if (!customerPhone.trim()) {
      toast.error('Nomor WhatsApp wajib diisi.')
      setMobileTab('details')
      return
    }
    if (!eventDate) {
      toast.error('Tanggal acara wajib diisi.')
      setMobileTab('details')
      return
    }
    if (!deliveryAddress.trim()) {
      toast.error('Alamat pengiriman / catatan pengambilan wajib diisi.')
      setMobileTab('details')
      return
    }
    if (items.length === 0) {
      toast.error('Silakan pilih minimal 1 menu katering.')
      setMobileTab('catalog')
      return
    }

    const payload: UpdateAdminOrderPayload = {
      customers_name: customerName.trim(),
      customers_phone: customerPhone.trim(),
      event_date: eventDate,
      event_time: eventTime.trim() || undefined,
      delivery_address: deliveryAddress.trim(),
      delivery_fee: isDeliveryFeeEnabled ? Number(deliveryFee) || 0 : 0,
      notes: notes.trim() || undefined,
      status: orderStatus,
      payment_status: paymentStatus,
      paid_amount: Number(paidAmount) || 0,
      payment_method: paymentMethod.trim() || undefined,
      payment_note: paymentNote.trim() || undefined,
      items: items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        addons: i.selectedAddons.map((a) => ({
          addon_id: a.addon.id,
        })),
      })),
    }

    const summary = computeOrderDiff()
    setDiffSummary(summary)
    setPendingPayload(payload)
    setIsReviewModalOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!pendingPayload) return
    await doUpdate(pendingPayload, false)
  }

  const doUpdate = async (payload: UpdateAdminOrderPayload, force: boolean) => {
    try {
      setIsSubmitting(true)
      const updated = await ordersService.update(orderId, {
        ...payload,
        force,
      })

      toast.success(`Pesanan ${updated.order_code} berhasil diperbarui!`)

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-order-edit', orderId] })
      queryClient.invalidateQueries({ queryKey: ['admin-order-recap'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-today-capacity'] })
      queryClient.invalidateQueries({ queryKey: ['admin-capacity-overview'] })

      navigate('/admin/orders')
    } catch (err: any) {
      if (err.response?.data?.requires_confirmation) {
        const confirmForce = window.confirm(
          `${err.response.data.message}\n\nApakah Anda ingin tetap memproses pesanan ini melebihi kuota dapur?`
        )
        if (confirmForce) {
          await doUpdate(payload, true)
          return
        }
      } else {
        toast.error(
          err.response?.data?.message ||
            'Gagal memperbarui pesanan. Pastikan seluruh data telah sesuai.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-3 ${
          isDark ? 'bg-[#140D0C] text-stone-300' : 'bg-[#FAF8F5] text-stone-700'
        }`}
      >
        <Loader2 size={36} className="animate-spin text-[#95271D] mx-auto" />
        <p className="text-sm font-semibold">Memuat rincian pesanan #{orderId}...</p>
      </div>
    )
  }

  if (orderError || !order) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 ${
          isDark ? 'bg-[#140D0C] text-stone-100' : 'bg-[#FAF8F5] text-stone-900'
        }`}
      >
        <AlertCircle size={44} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-stone-500 max-w-md">
          Pesanan dengan ID #{orderId} mungkin telah dihapus atau Anda tidak memiliki akses.
        </p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#95271D] text-white text-xs font-bold hover:bg-[#A82D22] transition"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen space-y-4 sm:space-y-6 p-3 sm:p-6 lg:p-8 pb-28 lg:pb-12 transition-colors duration-300 ${
        isDark ? 'bg-[#140D0C] text-stone-100' : 'bg-[#FAF8F5] text-stone-900'
      }`}
    >
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-[#352321]/40 dark:border-[#352321]/60">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <Link
              to="/admin/orders"
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white hover:bg-[#281A19]'
                  : 'border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <ArrowLeft size={13} />
              <span>Daftar Pesanan</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <h1
              className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}
            >
              Edit Pesanan
            </h1>
            <span className="font-mono text-sm sm:text-base font-bold text-[#D9534F] dark:text-[#E06A55] bg-red-50 dark:bg-[#261311] px-2 py-0.5 rounded-lg border border-red-200/50 dark:border-red-900/40">
              #{order.order_code}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Perbarui data pemesan, menu katering, jadwal pengiriman, dan status keuangan.
          </p>
        </div>

        {/* Live Top Summary Chips (Desktop Only) */}
        <div className="hidden sm:flex items-center gap-2 self-stretch sm:self-auto">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
              isDark
                ? 'border-[#382321] bg-[#1A1211] text-stone-300'
                : 'border-stone-200 bg-white text-stone-700 shadow-xs'
            }`}
          >
            <ShoppingBag size={14} className="text-[#95271D]" />
            <span className="font-semibold">
              {items.length} Menu ({totalBoxes} Box)
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold ${
              isDark
                ? 'border-[#382321] bg-[#221615] text-amber-300'
                : 'border-stone-200 bg-stone-50 text-stone-900 shadow-xs'
            }`}
          >
            <span className="text-stone-400 font-normal">Total:</span>
            <span className="text-[#D9534F] dark:text-[#E06A55] font-extrabold">
              {formatRupiah(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Segmented Navigation Switcher (lg:hidden) */}
      <div className="lg:hidden">
        <div
          className={`grid grid-cols-2 p-1 rounded-2xl border ${
            isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200 bg-stone-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileTab('details')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              mobileTab === 'details'
                ? isDark
                  ? 'bg-[#2E1B19] text-white shadow-sm border border-[#4A2825]'
                  : 'bg-white text-stone-900 shadow-xs'
                : isDark
                  ? 'text-stone-400 hover:text-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag
              size={14}
              className={mobileTab === 'details' ? 'text-[#D9534F]' : ''}
            />
            <span>Rincian & Kasir</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                mobileTab === 'details'
                  ? 'bg-[#95271D] text-white'
                  : isDark
                    ? 'bg-stone-800 text-stone-300'
                    : 'bg-stone-200 text-stone-700'
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              mobileTab === 'catalog'
                ? isDark
                  ? 'bg-[#2E1B19] text-white shadow-sm border border-[#4A2825]'
                  : 'bg-white text-stone-900 shadow-xs'
                : isDark
                  ? 'text-stone-400 hover:text-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package
              size={14}
              className={mobileTab === 'catalog' ? 'text-[#D9534F]' : ''}
            />
            <span>Katalog Menu</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                mobileTab === 'catalog'
                  ? 'bg-amber-600 text-white'
                  : isDark
                    ? 'bg-stone-800 text-stone-400'
                    : 'bg-stone-200 text-stone-600'
              }`}
            >
              {products.length}
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: KATALOG MENU KATERING (7 cols)             */}
          {/* ======================================================== */}
          <div
            className={`lg:col-span-7 space-y-4 ${
              mobileTab === 'catalog' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div
              className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm transition-all ${
                isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200/90 bg-white'
              }`}
            >
              {/* Header Katalog: Title & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#352321]/40 dark:border-[#352321]/60">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      isDark
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <Package size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold tracking-tight">
                      Katalog Menu Katering
                    </h2>
                    <p className="text-[11px] text-stone-400">
                      Pilih menu untuk ditambahkan ke pesanan
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari menu katering..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className={`w-full rounded-xl border pl-8.5 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#95271D] transition ${
                      isDark
                        ? 'border-[#382321] bg-[#221615] text-white placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                    }`}
                  />
                  {searchProduct && (
                    <button
                      type="button"
                      onClick={() => setSearchProduct('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#95271D] text-white shadow-xs font-bold'
                      : isDark
                        ? 'bg-[#221615] text-stone-400 hover:text-white border border-[#382321]'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Semua ({products.length})
                </button>
                {categories.map((c) => {
                  const countInCat = products.filter((p) => p.category_id === c.id).length
                  const isSelected = selectedCategory === String(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(String(c.id))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#95271D] text-white shadow-xs font-bold'
                          : isDark
                            ? 'bg-[#221615] text-stone-400 hover:text-white border border-[#382321]'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {c.name} {countInCat > 0 && `(${countInCat})`}
                    </button>
                  )
                })}
              </div>

              {/* Product Grid */}
              {productsLoading ? (
                <div className="py-16 text-center space-y-2">
                  <Package size={28} className="mx-auto text-stone-400 animate-bounce" />
                  <p className="text-xs text-stone-400">Memuat katalog produk katering...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <AlertCircle size={26} className="mx-auto text-stone-400" />
                  <p className="text-xs font-bold text-stone-400">Tidak ada menu yang sesuai</p>
                  <p className="text-[11px] text-stone-500">
                    Coba kata kunci lain atau pilih kategori berbeda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredProducts.map((product) => {
                    const hasAddons =
                      product.addons_enabled &&
                      ((product.addon_groups && product.addon_groups.length > 0) ||
                        (product.addonGroups && product.addonGroups.length > 0))

                    const cartItemCount = items
                      .filter((i) => i.product.id === product.id)
                      .reduce((sum, i) => sum + i.quantity, 0)

                    return (
                      <div
                        key={product.id}
                        className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 ${
                          cartItemCount > 0
                            ? isDark
                              ? 'border-[#95271D]/70 bg-[#241412] shadow-xs'
                              : 'border-red-200 bg-red-50/40 shadow-xs'
                            : isDark
                              ? 'border-[#382321] bg-[#1E1413] hover:border-[#52332F]'
                              : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-white'
                        }`}
                      >
                        <div>
                          {/* Image & Subtle Badges */}
                          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden mb-2.5 bg-stone-200 dark:bg-[#281816]">
                            {product.image ? (
                              <img
                                src={getImageUrl(product.image) || ''}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package size={24} />
                              </div>
                            )}

                            {/* Delivery Fee Badge */}
                            <div className="absolute top-2 left-2">
                              {product.has_delivery_fee ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-amber-300 backdrop-blur-xs">
                                  <Truck size={10} />
                                  <span>+Ongkir {formatRupiah(product.delivery_fee || 0)}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-emerald-300 backdrop-blur-xs">
                                  <Truck size={10} />
                                  <span>Bebas Ongkir</span>
                                </span>
                              )}
                            </div>

                            {/* Cart Count Badge */}
                            {cartItemCount > 0 && (
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#95271D] text-white shadow-xs">
                                  <Check size={11} strokeWidth={2.5} />
                                  <span>{cartItemCount} box</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="space-y-0.5">
                            <h3 className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-[11px] text-stone-400 line-clamp-1">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-baseline justify-between pt-1">
                              <span className="text-xs sm:text-sm font-extrabold text-[#D9534F] dark:text-[#E06A55]">
                                {formatRupiah(product.price)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-medium">
                                Min. {product.minimum_order || 1} box
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add Button */}
                        <div className="pt-2.5 mt-2.5 border-t border-[#352321]/30 dark:border-[#352321]/50 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-400 font-medium">
                            {hasAddons ? 'Pilihan addon' : 'Menu standar'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenConfigure(product)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                              cartItemCount > 0
                                ? 'bg-[#95271D] hover:bg-[#A82D22] text-white font-bold'
                                : 'bg-[#95271D] hover:bg-[#A82D22] text-white'
                            }`}
                          >
                            <Plus size={13} />
                            <span>{hasAddons ? 'Atur Addon' : 'Tambah'}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: KASIR, DATA PEMESAN & ONGKIR (5 cols)     */}
          {/* ======================================================== */}
          <div
            className={`lg:col-span-5 space-y-4 lg:sticky lg:top-4 ${
              mobileTab === 'details' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* CARD 1: KERANJANG MENU TERPILIH */}
            <div
              className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm transition-all ${
                isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#352321]/40 dark:border-[#352321]/60">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <ShoppingBag size={15} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                    1. Menu Pesanan ({items.length})
                  </h3>
                </div>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-7 text-center space-y-2 border border-dashed border-[#382321] dark:border-[#382321] rounded-2xl p-4">
                  <ShoppingBag size={22} className="mx-auto text-stone-400" />
                  <p className="text-xs font-bold text-stone-400">Keranjang masih kosong</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    Pilih menu dari katalog untuk ditambahkan ke pesanan ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileTab('catalog')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#95271D] hover:bg-[#A82D22] text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Buka Katalog Menu</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {items.map((item) => {
                    const addonsPrice = item.selectedAddons.reduce(
                      (sum, a) => sum + Number(a.addon.price || 0),
                      0
                    )
                    const unitPrice = Number(item.product.price) + addonsPrice
                    const itemTotal = unitPrice * item.quantity

                    return (
                      <div
                        key={item.tempId}
                        className={`p-2.5 sm:p-3 rounded-xl border transition ${
                          isDark
                            ? 'border-[#382321] bg-[#1E1413]'
                            : 'border-stone-200 bg-stone-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold leading-snug truncate">
                                {item.product.name}
                              </p>
                              {item.product.has_delivery_fee && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-400 shrink-0">
                                  +Ongkir
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 font-semibold">
                              @{formatRupiah(unitPrice)}
                            </p>

                            {/* Addon Pills */}
                            {item.selectedAddons.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.selectedAddons.map((a, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-1 ${
                                      isDark
                                        ? 'bg-[#2A1816] text-amber-200/90 border border-[#382321]'
                                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                                    }`}
                                  >
                                    <span>{a.addon.name}</span>
                                    {Number(a.addon.price || 0) > 0 && (
                                      <span className="opacity-80 font-bold">
                                        (+{formatRupiah(a.addon.price)})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.tempId)}
                            className="text-stone-400 hover:text-rose-500 transition p-1 cursor-pointer shrink-0"
                            title="Hapus menu ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Stepper & Line Subtotal */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#352321]/30 dark:border-[#352321]/40">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemQuantity(item.tempId, item.quantity - 1)
                              }
                              className={`h-7 w-7 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                                isDark
                                  ? 'border-[#382321] bg-[#241614] text-stone-300 hover:bg-[#2F1D1B]'
                                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemQuantity(
                                  item.tempId,
                                  Math.max(1, Number(e.target.value) || 1),
                                )
                              }
                              className={`w-11 text-center text-xs font-bold rounded-lg border py-0.5 focus:outline-none ${
                                isDark
                                  ? 'border-[#382321] bg-[#1A1211]'
                                  : 'border-stone-200 bg-white'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItemQuantity(item.tempId, item.quantity + 1)
                              }
                              className={`h-7 w-7 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                                isDark
                                  ? 'border-[#382321] bg-[#241614] text-stone-300 hover:bg-[#2F1D1B]'
                                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <Plus size={11} />
                            </button>
                            <span className="text-[10px] text-stone-400 ml-1">box</span>
                          </div>

                          <p className="text-xs font-extrabold text-[#D9534F] dark:text-[#E06A55]">
                            {formatRupiah(itemTotal)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Quick Jump to Catalog button */}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMobileTab('catalog')}
                  className={`w-full mt-2.5 py-1.5 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isDark
                      ? 'border-[#382321] hover:border-[#95271D] text-stone-400 hover:text-stone-200'
                      : 'border-stone-300 hover:border-[#95271D] text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Plus size={12} />
                  <span>Tambah Menu Lain dari Katalog</span>
                </button>
              )}
            </div>

            {/* CARD 2: DATA PEMESAN & JADWAL ACARA */}
            <div
              className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm transition-all space-y-3.5 ${
                isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#352321]/40 dark:border-[#352321]/60">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-700'
                  }`}
                >
                  <User size={15} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  2. Data Pemesan & Jadwal Acara
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer Name */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Nama Pemesan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rina / Bpk. Heru"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#95271D] transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D] placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D] placeholder:text-stone-400'
                    }`}
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={12}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`w-full rounded-xl border pl-8 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#95271D] transition ${
                        isDark
                          ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D] placeholder:text-stone-500'
                          : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D] placeholder:text-stone-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Event Date */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Tanggal Acara <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#95271D] transition ${
                        isDark
                          ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D]'
                          : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D]'
                      }`}
                    />
                  </div>
                </div>

                {/* Event Time */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Waktu / Jam Siap
                  </label>
                  <TimeInput24
                    value={eventTime}
                    onChange={setEventTime}
                    isDark={isDark}
                    placeholder="11:30"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Catatan Pesanan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pisahkan sambal, kardus per 25 box..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#95271D] transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D] placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D] placeholder:text-stone-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: PENGANTARAN & TOGGLE CUSTOM ONGKIR */}
            <div
              className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm transition-all space-y-3.5 ${
                isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#352321]/40 dark:border-[#352321]/60">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Truck size={15} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  3. Pengantaran & Ongkos Kirim
                </h3>
              </div>

              {/* Delivery Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Alamat Pengantaran / Lokasi <span className="text-red-500">*</span>
                  </label>
                </div>

                {/* Quick Presets for Address */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryAddress('Ambil Sendiri di Toko / Outlet Pawon Hara')
                      setUserOverrodeDelivery(true)
                      setIsDeliveryFeeEnabled(false)
                      setDeliveryFee(0)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      deliveryAddress.includes('Ambil Sendiri')
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDark
                          ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white'
                          : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <MapPin size={10} />
                    <span>Ambil di Toko (Gratis)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (deliveryAddress.includes('Ambil Sendiri')) {
                        setDeliveryAddress('')
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      !deliveryAddress.includes('Ambil Sendiri') && deliveryAddress.length > 0
                        ? 'bg-amber-600 text-white border-amber-600'
                        : isDark
                          ? 'border-[#382321] bg-[#1E1413] text-stone-300 hover:text-white'
                          : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Truck size={10} />
                    <span>Diantar ke Lokasi</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder="Alamat lengkap tujuan pengantaran..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#95271D] transition resize-none ${
                    isDark
                      ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D] placeholder:text-stone-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D] placeholder:text-stone-400'
                  }`}
                />
              </div>

              {/* REFINED ENTERPRISE DELIVERY FEE TOGGLE */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  isDeliveryFeeEnabled
                    ? isDark
                      ? 'border-amber-500/30 bg-[#241712]'
                      : 'border-amber-200 bg-amber-50/60'
                    : isDark
                      ? 'border-[#382321] bg-[#1E1413]'
                      : 'border-stone-200 bg-stone-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isDeliveryFeeEnabled
                          ? isDark
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-amber-100 text-amber-700'
                          : isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Truck size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">Biaya Ongkir</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isDeliveryFeeEnabled
                              ? isDark
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-amber-100 text-amber-800'
                              : isDark
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isDeliveryFeeEnabled ? 'Dikenakan' : 'Gratis'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        {isDeliveryFeeEnabled
                          ? 'Dikenakan tarif pengiriman tambahan.'
                          : 'Bebas ongkir untuk pesanan ini.'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDeliveryFeeEnabled}
                      onClick={handleToggleDelivery}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isDeliveryFeeEnabled
                          ? 'bg-amber-500'
                          : isDark
                            ? 'bg-[#352321]'
                            : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isDeliveryFeeEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Nominal Input & Quick Presets */}
                {isDeliveryFeeEnabled && (
                  <div className="mt-3 pt-3 border-t border-[#352321]/30 dark:border-[#352321]/50 space-y-2.5 animate-in fade-in duration-200">
                    <div>
                      <label
                        className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          isDark ? 'text-amber-200/80' : 'text-stone-600'
                        }`}
                      >
                        Nominal Ongkir (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                          Rp
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={deliveryFee}
                          onChange={(e) => {
                            setUserOverrodeDelivery(true)
                            setDeliveryFee(Math.max(0, Number(e.target.value) || 0))
                          }}
                          className={`w-full rounded-xl border pl-9 pr-3 py-1.5 text-xs font-extrabold focus:outline-none transition ${
                            isDark
                              ? 'border-amber-500/40 bg-[#1A1211] text-white focus:border-amber-500'
                              : 'border-amber-300 bg-white text-stone-900 focus:border-amber-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {DELIVERY_PRESETS.map((p) => {
                          const isSelected = deliveryFee === p
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleSelectDeliveryPreset(p)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-stone-950 border-amber-500'
                                  : isDark
                                    ? 'border-[#382321] bg-[#1A1211] text-stone-300 hover:border-amber-500/50'
                                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              {p.toLocaleString('id-ID')}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Auto-detected hint */}
                    {hasDeliveryFeeProducts && (
                      <div
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[10px] ${
                          isDark
                            ? 'border-amber-500/30 bg-[#221615] text-amber-200/90'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-amber-500 shrink-0" />
                          <span>
                            Saran ongkir katering: <strong>{formatRupiah(suggestedDeliveryFee)}</strong>
                          </span>
                        </div>
                        {userOverrodeDelivery && deliveryFee !== suggestedDeliveryFee && (
                          <button
                            type="button"
                            onClick={handleResetToAutoDelivery}
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <RotateCcw size={10} />
                            <span>Gunakan Saran</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CARD 4: KASIR, STATUS PEMBAYARAN & SUBMIT */}
            <div
              className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm transition-all space-y-3.5 ${
                isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#352321]/40 dark:border-[#352321]/60">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-700'
                  }`}
                >
                  <CreditCard size={15} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  4. Kasir & Pembayaran
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Order Status */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Status Pesanan
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D]'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D]'
                    }`}
                  >
                    <option value="pending">Menunggu Konfirmasi</option>
                    <option value="confirmed">Dikonfirmasi</option>
                    <option value="processing">Diproses Dapur</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Status Bayar
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D]'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D]'
                    }`}
                  >
                    <option value="unpaid">Belum Bayar</option>
                    <option value="dp">DP Masuk</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>

                {/* Paid Amount */}
                <div className="col-span-2">
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Nominal Dibayar (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D]'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D]'
                    }`}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Metode Bayar
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D]'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D]'
                    }`}
                  >
                    <option value="Tunai / Cash">Tunai / Cash</option>
                    <option value="Transfer BSI">Transfer BSI</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Payment Note Input */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Catatan Kasir
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tunai pas di toko"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#382321] bg-[#1E1413] text-white focus:border-[#95271D] placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-[#95271D] placeholder:text-stone-400'
                    }`}
                  />
                </div>
              </div>

              {/* Financial Summary */}
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                  isDark ? 'border-[#382321] bg-[#1E1413]' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex justify-between text-stone-500">
                  <span>
                    Subtotal Menu ({items.length} item, {totalBoxes} box):
                  </span>
                  <span className="font-semibold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-500">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold">
                    {effectiveDeliveryFee > 0 ? (
                      formatRupiah(effectiveDeliveryFee)
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Bebas Ongkir (Rp 0)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline font-black text-sm pt-2 border-t border-[#352321]/30 dark:border-[#352321]/50">
                  <span className="text-stone-800 dark:text-stone-200">Total Tagihan:</span>
                  <span className="text-base text-[#D9534F] dark:text-[#E06A55] font-extrabold">
                    {formatRupiah(total)}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold pt-1">
                  <span>Nominal Dibayar:</span>
                  <span>{formatRupiah(paidAmount)}</span>
                </div>
                {remainingPayment > 0 ? (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold pt-1 border-t border-dashed border-[#352321]/30 dark:border-[#352321]/50">
                    <span>Sisa Tagihan (Piutang):</span>
                    <span>{formatRupiah(remainingPayment)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-dashed border-[#352321]/30 dark:border-[#352321]/50">
                    <span>Status Pembayaran:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase">
                      <CheckCircle2 size={13} />
                      <span>Lunas Penuh</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button (Desktop Only) */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3 rounded-xl bg-[#95271D] hover:bg-[#A82D22] text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={16} />
                    <span>Simpan Perubahan Pesanan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM BAR FOR MOBILE (lg:hidden) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 dark:bg-[#1A1211]/95 backdrop-blur-md border-t border-stone-200 dark:border-[#382321] shadow-xl">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">Total Pesanan:</span>
              <span className="text-sm font-extrabold text-[#D9534F] dark:text-[#E06A55]">
                {formatRupiah(total)}
              </span>
              <span className="text-[10px] text-stone-400 ml-1">
                ({items.length} menu)
              </span>
            </div>

            {mobileTab === 'catalog' ? (
              <button
                type="button"
                onClick={() => setMobileTab('details')}
                className="px-4 py-2.5 rounded-xl bg-[#95271D] hover:bg-[#A82D22] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Rincian ({items.length})</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="px-5 py-2.5 rounded-xl bg-[#95271D] hover:bg-[#A82D22] text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={14} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Product Addon Configuration Modal */}
      {configuringProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin rounded-t-3xl sm:rounded-3xl border p-4 sm:p-6 shadow-2xl transition-all ${
              isDark
                ? 'border-[#382321] bg-[#1A1211] text-stone-100'
                : 'border-stone-200 bg-white text-stone-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#352321]/40 dark:border-[#352321]/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[#95271D]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#D9534F] dark:text-[#E06A55]">
                    Kustomisasi Menu
                  </p>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold mt-0.5">
                  {configuringProduct.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-[#D9534F] dark:text-[#E06A55]">
                    Harga Dasar: {formatRupiah(configuringProduct.price)}
                  </span>
                  {configuringProduct.has_delivery_fee ? (
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      +Ongkir {formatRupiah(configuringProduct.delivery_fee || 0)}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Bebas Ongkir
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringProduct(null)}
                className={`p-1.5 rounded-full border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'border-[#382321] bg-[#241614] text-stone-400 hover:text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-900'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Addon Groups & Quantity */}
            <div className="py-3.5 space-y-4">
              {/* Addon Groups */}
              {((configuringProduct.addon_groups || configuringProduct.addonGroups || []) as AddonGroup[]).map(
                (group) => {
                  const groupSelectedCount = tempSelectedAddons.filter(
                    (item) => item.groupId === group.id
                  ).length
                  const allSelectedInGroup =
                    group.addons.length > 0 &&
                    group.addons.every((a) =>
                      tempSelectedAddons.some((item) => item.addon.id === a.id)
                    )

                  return (
                    <div
                      key={group.id}
                      className={`p-3 rounded-2xl border space-y-2 ${
                        isDark ? 'border-[#382321] bg-[#1E1413]' : 'border-stone-200/90 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold tracking-tight">
                              {group.name}
                            </h4>
                            {groupSelectedCount > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#95271D] text-white">
                                {groupSelectedCount} dipilih
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium text-stone-400 bg-stone-200/60 dark:bg-stone-800">
                                0
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-[11px] text-stone-400 mt-0.5">{group.description}</p>
                          )}
                        </div>

                        {/* Quick group toggle */}
                        {group.addons.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              allSelectedInGroup
                                ? handleClearGroup(group.id)
                                : handleSelectAllInGroup(group)
                            }
                            className="text-[10px] font-bold text-[#D9534F] dark:text-[#E06A55] hover:underline cursor-pointer shrink-0"
                          >
                            {allSelectedInGroup ? 'Batal Semua' : 'Pilih Semua'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {group.addons.map((addon) => {
                          const isSelected = tempSelectedAddons.some(
                            (item) => item.addon.id === addon.id
                          )

                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(group, addon)}
                              className={`p-2 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? isDark
                                    ? 'border-[#95271D] bg-[#2C1614] text-white shadow-xs'
                                    : 'border-red-400 bg-red-50 text-red-950 shadow-xs'
                                  : isDark
                                    ? 'border-[#382321] bg-[#1A1211] text-stone-300 hover:border-[#52332F]'
                                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? 'bg-[#95271D] border-[#95271D] text-white'
                                      : isDark
                                        ? 'border-stone-600 bg-[#241614]'
                                        : 'border-stone-300 bg-stone-100'
                                  }`}
                                >
                                  {isSelected && <Check size={11} strokeWidth={2.5} />}
                                </div>
                                <span className="text-xs font-semibold truncate">{addon.name}</span>
                              </div>
                              <span className="text-[11px] font-bold text-[#D9534F] dark:text-[#E06A55] shrink-0">
                                +{formatRupiah(addon.price)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
              )}

              {/* Quantity Stepper */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-4 ${
                  isDark ? 'border-[#382321] bg-[#1E1413]' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">Jumlah Porsi / Box</h4>
                  <p className="text-[11px] text-stone-400">
                    Minimal {configuringProduct.minimum_order || 1} box
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTempQuantity((prev) =>
                        Math.max(configuringProduct.minimum_order || 1, prev - 1)
                      )
                    }
                    className={`h-8 w-8 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                      isDark
                        ? 'border-[#382321] bg-[#241614] text-stone-300 hover:bg-[#2F1D1B]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    min={configuringProduct.minimum_order || 1}
                    value={tempQuantity}
                    onChange={(e) =>
                      setTempQuantity(
                        Math.max(
                          configuringProduct.minimum_order || 1,
                          Number(e.target.value) || 1
                        )
                      )
                    }
                    className={`w-14 text-center text-xs font-extrabold rounded-xl border py-1 focus:outline-none ${
                      isDark ? 'border-[#382321] bg-[#1A1211]' : 'border-stone-200 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setTempQuantity((prev) => prev + 1)}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                      isDark
                        ? 'border-[#382321] bg-[#241614] text-stone-300 hover:bg-[#2F1D1B]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#352321]/40 dark:border-[#352321]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-stone-400 block">Total Menu Ini:</span>
                <span className="text-base font-black text-[#D9534F] dark:text-[#E06A55]">
                  {formatRupiah(modalTotalPrice)}
                </span>
                <span className="text-[10px] text-stone-400 ml-1.5">
                  ({tempQuantity} × {formatRupiah(modalUnitPrice)})
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setConfiguringProduct(null)}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'border-[#382321] bg-[#241614] text-stone-300 hover:bg-[#2F1D1B]'
                      : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#95271D] hover:bg-[#A82D22] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Tambahkan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Confirm Edit Order Diff Modal */}
      {diffSummary && (
        <OrderEditDiffModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onConfirm={handleConfirmSave}
          diff={diffSummary}
          orderCode={order?.order_code || ''}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
