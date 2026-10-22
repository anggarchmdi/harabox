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
          // Look up full product if possible
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

          // Map addons
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
      `${configuringProduct.name} (${tempQuantity}x${
        selectedAddonList.length > 0 ? ` + ${selectedAddonList.length} addon` : ''
      }) berhasil ditambahkan.`
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

  // Quick payment amount presets
  const handleSetFullPayment = () => {
    setPaidAmount(total)
    setPaymentStatus('paid')
  }

  const handleSetDp50 = () => {
    const half = Math.round(total / 2)
    setPaidAmount(half)
    setPaymentStatus('dp')
  }

  const handleSetZeroPayment = () => {
    setPaidAmount(0)
    setPaymentStatus('unpaid')
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
      return
    }
    if (!customerPhone.trim()) {
      toast.error('Nomor WhatsApp wajib diisi.')
      return
    }
    if (!eventDate) {
      toast.error('Tanggal acara wajib diisi.')
      return
    }
    if (!deliveryAddress.trim()) {
      toast.error('Alamat pengiriman / catatan pengambilan wajib diisi.')
      return
    }
    if (items.length === 0) {
      toast.error('Silakan pilih minimal 1 menu katering.')
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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-3">
        <Loader2 size={36} className="animate-spin text-red-600 mx-auto" />
        <p className="text-sm font-semibold text-stone-500">Memuat rincian pesanan #{orderId}...</p>
      </div>
    )
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle size={44} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-stone-500 max-w-md">
          Pesanan dengan ID #{orderId} mungkin telah dihapus atau Anda tidak memiliki akses.
        </p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 transition-colors duration-300 ${
        isDark ? 'text-stone-100' : 'text-stone-900'
      }`}
    >
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border mb-3 transition cursor-pointer ${
              isDark
                ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:text-white hover:bg-[#2D120F]'
                : 'border-stone-200 bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-50'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Daftar Pesanan</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-wider text-amber-500">
              Perubahan Data & Rincian Pesanan
            </p>
          </div>
          <h1
            className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}
          >
            <span>Edit Pesanan:</span>
            <span className="font-mono text-red-600 dark:text-red-400">
              {order.order_code}
            </span>
          </h1>
          <p
            className={`mt-1 text-xs sm:text-sm max-w-2xl ${
              isDark ? 'text-amber-100/70' : 'text-stone-500'
            }`}
          >
            Anda dapat menyesuaikan menu katering, jumlah porsi, jadwal acara, ongkir, serta status pembayaran.
          </p>
        </div>

        {/* Live Top Summary Chips */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold ${
              isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200 bg-white shadow-2xs'
            }`}
          >
            <ShoppingBag size={14} className="text-red-600" />
            <span>
              {items.length} Menu ({totalBoxes} Box)
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold ${
              isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-amber-400'
                : 'border-stone-200 bg-stone-50 text-red-700 shadow-2xs'
            }`}
          >
            <span>Total: {formatRupiah(total)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: KATALOG MENU KATERING (7 cols)             */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-5">
            <div
              className={`rounded-3xl border p-5 sm:p-6 shadow-sm transition-all ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              {/* Header Katalog */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl ${
                      isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight">Katalog Menu Katering</h2>
                    <p className="text-xs text-stone-400">
                      Tambah atau ganti menu katering untuk pesanan ini.
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className={`w-full rounded-xl border pl-8.5 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                    }`}
                  />
                  {searchProduct && (
                    <button
                      type="button"
                      onClick={() => setSearchProduct('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-red-600 text-white shadow-xs'
                      : isDark
                        ? 'bg-[#1C0B09] text-stone-400 hover:text-white border border-[#60241E]'
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-xs'
                          : isDark
                            ? 'bg-[#1C0B09] text-stone-400 hover:text-white border border-[#60241E]'
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
                <div className="py-16 text-center space-y-2">
                  <AlertCircle size={28} className="mx-auto text-stone-400" />
                  <p className="text-xs font-bold text-stone-400">Tidak ada menu yang sesuai</p>
                  <p className="text-[11px] text-stone-500">
                    Coba kata kunci lain atau pilih kategori berbeda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[720px] overflow-y-auto pr-1.5 scrollbar-thin">
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
                        className={`group relative rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                          cartItemCount > 0
                            ? isDark
                              ? 'border-red-500/60 bg-[#2A100D] shadow-red-950/20'
                              : 'border-red-300 bg-red-50/40 shadow-red-100'
                            : isDark
                              ? 'border-[#60241E]/70 bg-[#1C0B09] hover:border-[#8E342B]'
                              : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-white'
                        }`}
                      >
                        <div>
                          {/* Image & Badges */}
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-stone-200 dark:bg-[#2D120F]">
                            {product.image ? (
                              <img
                                src={getImageUrl(product.image) || ''}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package size={28} />
                              </div>
                            )}

                            {/* Shipping Tag Badge on Image */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {product.has_delivery_fee ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 shadow-md">
                                  <Truck size={10} />
                                  <span>+Ongkir {formatRupiah(product.delivery_fee || 0)}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-md">
                                  <Truck size={10} />
                                  <span>Bebas Ongkir</span>
                                </span>
                              )}
                            </div>

                            {/* Cart Count Overlay if already added */}
                            {cartItemCount > 0 && (
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white shadow-md">
                                  <Check size={11} strokeWidth={3} />
                                  <span>{cartItemCount} box</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="space-y-1">
                            <h3 className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-[11px] text-stone-400 line-clamp-1">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-baseline justify-between pt-1">
                              <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                                {formatRupiah(product.price)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold">
                                Min. {product.minimum_order || 1} box
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add Button */}
                        <div className="pt-3 mt-3 border-t border-stone-200/60 dark:border-[#60241E]/50 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-400 font-medium">
                            {hasAddons ? 'Tersedia pilihan addon' : 'Menu standar'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenConfigure(product)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                              cartItemCount > 0
                                ? 'bg-red-700 hover:bg-red-800 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            <Plus size={13} />
                            <span>{hasAddons ? 'Atur & Tambah' : 'Tambah'}</span>
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
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
            {/* CARD 1: KERANJANG MENU TERPILIH */}
            <div
              className={`rounded-3xl border p-5 shadow-sm transition-all ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                      1. Menu Pesanan ({items.length})
                    </h3>
                  </div>
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
                <div className="py-8 text-center space-y-1.5 border border-dashed border-stone-300 dark:border-[#60241E] rounded-2xl p-4">
                  <ShoppingBag size={24} className="mx-auto text-stone-400" />
                  <p className="text-xs font-bold text-stone-400">Keranjang masih kosong</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    Pilih menu pada katalog di sebelah kiri untuk ditambahkan ke pesanan ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1.5 scrollbar-thin">
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
                        className={`p-3 rounded-2xl border transition ${
                          isDark
                            ? 'border-[#60241E]/60 bg-[#1C0B09]'
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
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-500/20 text-amber-500 shrink-0">
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
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1 ${
                                      isDark
                                        ? 'bg-[#240E0C] text-amber-300 border border-[#60241E]'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
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
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-200/50 dark:border-[#60241E]/40">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.tempId, item.quantity - 1)}
                              className={`h-6 w-6 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                                isDark
                                  ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
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
                              className={`w-12 text-center text-xs font-bold rounded-lg border py-0.5 focus:outline-none ${
                                isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200 bg-white'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.tempId, item.quantity + 1)}
                              className={`h-6 w-6 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                                isDark
                                  ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <Plus size={11} />
                            </button>
                            <span className="text-[10px] text-stone-400 ml-1">box</span>
                          </div>

                          <p className="text-xs font-extrabold text-red-600 dark:text-red-400">
                            {formatRupiah(itemTotal)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* CARD 2: DATA PEMESAN & JADWAL ACARA */}
            <div
              className={`rounded-3xl border p-5 shadow-sm transition-all space-y-4 ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <User size={16} />
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
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
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
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`w-full rounded-xl border pl-7.5 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                        isDark
                          ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                          : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
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
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                        isDark
                          ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                          : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
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
                    placeholder="Contoh: Pisahkan sambal, bungkus per kardus 25 box..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: PENGANTARAN & TOGGLE CUSTOM ONGKIR */}
            <div
              className={`rounded-3xl border p-5 shadow-sm transition-all space-y-4 ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <Truck size={16} />
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
                          ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:text-white'
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
                          ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:text-white'
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
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition resize-none ${
                    isDark
                      ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                  }`}
                />
              </div>

              {/* SHOPEE-STYLE DELIVERY FEE TOGGLE */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  isDeliveryFeeEnabled
                    ? isDark
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-amber-200 bg-amber-50/60'
                    : isDark
                      ? 'border-[#60241E]/60 bg-[#1C0B09]'
                      : 'border-stone-200 bg-stone-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isDeliveryFeeEnabled
                          ? isDark
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                          : isDark
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <Truck size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">Biaya Pengiriman (Ongkir)</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isDeliveryFeeEnabled
                              ? isDark
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isDark
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isDeliveryFeeEnabled ? 'Dikenakan Ongkir' : 'Bebas Ongkir'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {isDeliveryFeeEnabled
                          ? 'Dikenakan tarif ongkir tambahan.'
                          : 'Gratis ongkir (Rp 0) untuk pesanan ini.'}
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
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isDeliveryFeeEnabled
                          ? 'bg-amber-500'
                          : isDark
                            ? 'bg-[#381612]'
                            : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isDeliveryFeeEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Nominal Input & Quick Presets */}
                {isDeliveryFeeEnabled && (
                  <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-[#60241E]/60 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label
                        className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                          isDark ? 'text-amber-200/80' : 'text-stone-600'
                        }`}
                      >
                        Nominal Ongkir Tambahan (Rp)
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
                          className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-extrabold focus:outline-none transition ${
                            isDark
                              ? 'border-amber-500/40 bg-[#1C0B09] text-white focus:border-amber-500'
                              : 'border-amber-300 bg-white text-stone-900 focus:border-amber-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 mb-1.5">
                        Pilihan Cepat Ongkir:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {DELIVERY_PRESETS.map((p) => {
                          const isSelected = deliveryFee === p
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleSelectDeliveryPreset(p)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs'
                                  : isDark
                                    ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:border-amber-500/50'
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
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
                          isDark
                            ? 'border-amber-500/30 bg-[#240E0C] text-amber-200/90'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-amber-500 shrink-0" />
                          <span>
                            Saran dari menu keranjang: <strong>{formatRupiah(suggestedDeliveryFee)}</strong>
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
              className={`rounded-3xl border p-5 shadow-sm transition-all space-y-4 ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <CreditCard size={16} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  4. Kasir & Pembayaran
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Initial Status */}
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
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                    }`}
                  >
                    <option value="pending">Menunggu Konfirmasi</option>
                    <option value="confirmed">Dikonfirmasi</option>
                    <option value="processing">Diproses Dapur</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                {/* Initial Payment Status */}
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
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                    }`}
                  >
                    <option value="unpaid">Belum Bayar</option>
                    <option value="dp">DP Masuk</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>

                {/* Paid Amount */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-stone-300' : 'text-stone-600'
                      }`}
                    >
                      Nominal Dibayar (Rp)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSetZeroPayment}
                        className="text-[10px] text-stone-400 hover:text-stone-200 font-semibold cursor-pointer underline"
                      >
                        Rp 0
                      </button>
                      <span className="text-stone-400 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={handleSetDp50}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold cursor-pointer underline"
                      >
                        DP 50%
                      </button>
                      <span className="text-stone-400 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={handleSetFullPayment}
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer underline"
                      >
                        Lunas Pas
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
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
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
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
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                    }`}
                  />
                </div>
              </div>

              {/* Financial Summary */}
              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'border-[#60241E]/70 bg-[#1C0B09]' : 'border-stone-200 bg-stone-50'
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
                <div className="flex justify-between items-baseline font-black text-sm pt-2 border-t border-stone-200 dark:border-[#60241E]">
                  <span className="text-stone-800 dark:text-stone-200">Total Tagihan Baru:</span>
                  <span className="text-base text-red-600 dark:text-red-400">
                    {formatRupiah(total)}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold pt-1">
                  <span>Nominal Dibayar:</span>
                  <span>{formatRupiah(paidAmount)}</span>
                </div>
                {remainingPayment > 0 ? (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold pt-1 border-t border-dashed border-stone-200 dark:border-[#60241E]">
                    <span>Sisa Tagihan (Piutang):</span>
                    <span>{formatRupiah(remainingPayment)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-dashed border-stone-200 dark:border-[#60241E]">
                    <span>Status Pembayaran:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase">
                      <CheckCircle2 size={13} />
                      <span>Lunas Penuh</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-950/20 transition disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={18} />
                    <span>Simpan Perubahan Pesanan ({formatRupiah(total)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Product Addon Configuration Modal */}
      {configuringProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all ${
              isDark ? 'border-[#60241E] bg-[#1C0B09] text-stone-100' : 'border-stone-200 bg-white text-stone-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-[#60241E]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-600" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-600">
                    Kustomisasi Menu & Addon
                  </p>
                </div>
                <h3 className="text-lg font-extrabold mt-0.5">{configuringProduct.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    Harga Dasar: {formatRupiah(configuringProduct.price)}
                  </span>
                  {configuringProduct.has_delivery_fee ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      +Ongkir {formatRupiah(configuringProduct.delivery_fee || 0)}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      Bebas Ongkir
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringProduct(null)}
                className={`p-2 rounded-full border transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'border-[#60241E] bg-[#240E0C] text-stone-400 hover:text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-900'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Addon Groups & Quantity */}
            <div className="py-4 space-y-5">
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
                      className={`p-3.5 rounded-2xl border space-y-2.5 ${
                        isDark ? 'border-[#60241E]/70 bg-[#240E0C]/70' : 'border-stone-200/90 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold tracking-tight">
                              {group.name}
                            </h4>
                            {groupSelectedCount > 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-600 text-white shadow-2xs">
                                {groupSelectedCount} dipilih
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-stone-400 bg-stone-200/60 dark:bg-stone-800">
                                0 dipilih
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
                            className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer shrink-0"
                          >
                            {allSelectedInGroup ? 'Batal Semua' : 'Pilih Semua'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.addons.map((addon) => {
                          const isSelected = tempSelectedAddons.some(
                            (item) => item.addon.id === addon.id
                          )

                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(group, addon)}
                              className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? isDark
                                    ? 'border-red-500 bg-red-950/40 text-white shadow-xs'
                                    : 'border-red-400 bg-red-50 text-red-950 shadow-xs'
                                  : isDark
                                    ? 'border-[#60241E]/50 bg-[#1C0B09] text-stone-300 hover:border-red-600/40'
                                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? 'bg-red-600 border-red-600 text-white'
                                      : isDark
                                        ? 'border-stone-600 bg-[#240E0C]'
                                        : 'border-stone-300 bg-stone-100'
                                  }`}
                                >
                                  {isSelected && <Check size={11} strokeWidth={3} />}
                                </div>
                                <span className="text-xs font-semibold truncate">{addon.name}</span>
                              </div>
                              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0">
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
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 ${
                  isDark ? 'border-[#60241E]/70 bg-[#240E0C]/70' : 'border-stone-200 bg-stone-50'
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
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Minus size={14} />
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
                    className={`w-16 text-center text-sm font-extrabold rounded-xl border py-1 focus:outline-none ${
                      isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setTempQuantity((prev) => prev + 1)}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-200 dark:border-[#60241E] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-stone-400 block">Total Menu Ini:</span>
                <span className="text-base font-black text-red-600 dark:text-red-400">
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
                      ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F]'
                      : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Tambahkan ke Pesanan</span>
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
