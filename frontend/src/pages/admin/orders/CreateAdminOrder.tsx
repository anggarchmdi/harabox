import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { OrderStatus, PaymentStatus } from '../../../types/orders'
import type { Product } from '../../../types/products'
import type { Addon, AddonGroup } from '../../../types/addon'
import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'
import { ordersService } from '../../../services/orders.service'
import { useThemeStore } from '../../../stores/theme.store'
import { getImageUrl } from '../../../utils/image'

function formatRupiah(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function toDateInputValue(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface SelectedOrderItem {
  tempId: string
  product: Product
  quantity: number
  selectedAddons: {
    addon: Addon
    groupName: string
  }[]
}

export default function CreateAdminOrder() {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form Fields
  const now = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(now.getDate() + 1)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState(toDateInputValue(tomorrow))
  const [eventTime, setEventTime] = useState('11:00')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState<number>(10000)
  const [notes, setNotes] = useState('')

  // Status & Payment
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('confirmed')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState('Transfer BCA')
  const [paymentNote, setPaymentNote] = useState('')

  // Cart / Items
  const [items, setItems] = useState<SelectedOrderItem[]>([])

  // Product Selection & Addon Modal
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
  const [tempQuantity, setTempQuantity] = useState(1)
  const [tempSelectedAddons, setTempSelectedAddons] = useState<
    { addon: Addon; groupName: string; groupId: number }[]
  >([])

  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Filtered products
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

  const total = useMemo(() => {
    return subtotal + Number(deliveryFee || 0)
  }, [subtotal, deliveryFee])

  const remainingPayment = useMemo(() => {
    return Math.max(0, total - Number(paidAmount || 0))
  }, [total, paidAmount])

  // Open Product Configuration Modal
  const handleOpenConfigure = (product: Product) => {
    setConfiguringProduct(product)
    setTempQuantity(Math.max(1, product.minimum_order || 1))
    setTempSelectedAddons([])
  }

  // Toggle single addon in modal (multi-select / checkbox)
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
      }) ditambahkan ke pesanan.`
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

  // Handle Payment Status change auto-fill
  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status)
    if (status === 'paid') {
      setPaidAmount(total)
    } else if (status === 'unpaid') {
      setPaidAmount(0)
    }
  }

  // Submit Order Form
  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      setIsSubmitting(true)

      const payload = {
        customers_name: customerName.trim(),
        customers_phone: customerPhone.trim(),
        event_date: eventDate,
        event_time: eventTime.trim() || undefined,
        delivery_address: deliveryAddress.trim(),
        delivery_fee: Number(deliveryFee) || 0,
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

      const createdOrder = await ordersService.createManualOrder(payload)

      toast.success(
        `Pesanan manual ${createdOrder.order_code} berhasil disimpan!`
      )

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-order-recap'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      navigate('/admin/orders')
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menyimpan pesanan manual. Periksa data kembali.'
      )
    } finally {
      setIsSubmitting(false)
    }
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
            <span className="flex h-2 w-2 rounded-full bg-red-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Input Offline / Walk-in
            </p>
          </div>
          <h1
            className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}
          >
            Tambah Pesanan Manual
          </h1>
          <p
            className={`mt-1 text-xs sm:text-sm max-w-2xl ${
              isDark ? 'text-amber-100/70' : 'text-stone-500'
            }`}
          >
            Formulir khusus admin untuk mencatat orderan offline, pesanan katering dadakan, atau pelanggan yang datang langsung ke toko.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: Customer Info, Event Info & Product Selector (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Data Pemesan & Acara */}
            <div
              className={`rounded-2xl border p-5 sm:p-6 shadow-2xs ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div
                  className={`p-2 rounded-xl ${
                    isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">1. Data Pemesan & Jadwal Acara</h2>
                  <p className="text-[11px] text-stone-400">
                    Informasi kontak pelanggan dan waktu pengantaran katering.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
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
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                    }`}
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                    }`}
                  />
                </div>

                {/* Event Date */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
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
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
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
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Waktu Acara (Jam)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: 11:30"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                        isDark
                          ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                          : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-stone-300' : 'text-stone-600'
                      }`}
                    >
                      Alamat Pengantaran / Catatan Lokasi <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryAddress('Ambil Sendiri di Toko / Outlet Pawon Hara')
                        setDeliveryFee(0)
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer underline"
                    >
                      Preset: Ambil di Toko (Ongkir Rp 0)
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Alamat lengkap tujuan pengiriman atau tulis 'Ambil di Toko'..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition resize-none ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                    }`}
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Catatan Khusus Pesanan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pisahkan sambal, bungkus per kardus 25 box..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600 placeholder:text-stone-500'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600 placeholder:text-stone-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pemilihan Menu Katering */}
            <div
              className={`rounded-2xl border p-5 sm:p-6 shadow-2xs ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <Package size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">2. Pilih Menu Katering</h2>
                    <p className="text-[11px] text-stone-400">
                      Cari dan tambahkan menu nasi box atau snack box ke dalam pesanan.
                    </p>
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="text"
                      placeholder="Cari menu..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className={`w-36 sm:w-44 rounded-xl border pl-7.5 pr-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition ${
                        isDark
                          ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500'
                          : 'border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400'
                      }`}
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-900'
                    }`}
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Grid */}
              {productsLoading ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  Memuat katalog produk katering...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-stone-400">
                  Tidak ada menu katering yang cocok.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {filteredProducts.map((product) => {
                    const hasAddons =
                      product.addons_enabled &&
                      ((product.addon_groups && product.addon_groups.length > 0) ||
                        (product.addonGroups && product.addonGroups.length > 0))

                    return (
                      <div
                        key={product.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all hover:border-red-500/40 ${
                          isDark
                            ? 'border-[#60241E]/60 bg-[#1C0B09] hover:bg-[#2D120F]/40'
                            : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {product.image ? (
                            <img
                              src={getImageUrl(product.image) || ''}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                isDark ? 'bg-[#240E0C] text-stone-500' : 'bg-stone-200 text-stone-400'
                              }`}
                            >
                              <Package size={20} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{product.name}</p>
                            <p className="text-xs font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                              {formatRupiah(product.price)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400">
                              <span>Min {product.minimum_order} box</span>
                              {hasAddons && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-500 font-semibold">Ada Addon</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenConfigure(product)}
                          className="shrink-0 p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                          title="Pilih & Atur Porsi"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Selected Items (Cart), Financials & Submit (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            {/* Selected Items / Cart */}
            <div
              className={`rounded-2xl border p-5 shadow-2xs ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-red-600" />
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                    Menu Terpilih ({items.length})
                  </h3>
                </div>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-10 text-center space-y-1.5">
                  <AlertCircle size={28} className="mx-auto text-stone-400" />
                  <p className="text-xs font-semibold text-stone-400">Belum ada menu yang dipilih</p>
                  <p className="text-[11px] text-stone-500">
                    Pilih menu dari katalog di sebelah kiri untuk menambahkan pesanan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
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
                        className={`p-3 rounded-xl border ${
                          isDark ? 'border-[#60241E]/60 bg-[#1C0B09]' : 'border-stone-200 bg-stone-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-snug">{item.product.name}</p>
                            <p className="text-[11px] text-stone-400 font-medium">
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
                                      <span className="opacity-75 font-semibold">
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

                        {/* Quantity Stepper & Subtotal */}
                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-stone-200/50 dark:border-[#60241E]/40">
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
                                handleUpdateItemQuantity(item.tempId, Math.max(1, Number(e.target.value) || 1))
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

            {/* Section 3: Status & Payment Controls */}
            <div
              className={`rounded-2xl border p-5 shadow-2xs space-y-4 ${
                isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200/60 dark:border-[#60241E]/60">
                <CreditCard size={16} className="text-red-600" />
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  Status Pesanan & Pembayaran
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
                    <option value="completed">Selesai (Langsung)</option>
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
                <div>
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
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Delivery Fee Input */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Biaya Ongkir (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                    }`}
                  />
                </div>

                {/* Payment Note Input */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Catatan Bayar (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lunas tunai di toko"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white focus:border-red-600'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-red-600'
                    }`}
                  />
                </div>
              </div>

              {/* Financial Summary */}
              <div
                className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                  isDark ? 'border-[#60241E]/60 bg-[#1C0B09]' : 'border-stone-200 bg-stone-50/70'
                }`}
              >
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal Menu:</span>
                  <span className="font-semibold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold">{formatRupiah(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-stone-200 dark:border-[#60241E]">
                  <span>Total Tagihan:</span>
                  <span className="text-red-600 dark:text-red-400">{formatRupiah(total)}</span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold">
                  <span>Nominal Dibayar:</span>
                  <span>{formatRupiah(paidAmount)}</span>
                </div>
                {remainingPayment > 0 ? (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                    <span>Sisa Tagihan (Piutang):</span>
                    <span>{formatRupiah(remainingPayment)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Status Pembayaran:</span>
                    <span>LUNAS</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-950/20 transition disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <FileCheck2 size={16} />
                <span>{isSubmitting ? 'Menyimpan Pesanan...' : 'Simpan & Buat Pesanan Manual'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Product Addon Configuration Modal */}
      {configuringProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all ${
              isDark ? 'border-[#60241E] bg-[#1C0B09] text-stone-100' : 'border-stone-200 bg-white text-stone-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-[#60241E]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-600" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Kustomisasi Menu & Addon (Pilihan Banyak)
                  </p>
                </div>
                <h3 className="text-lg font-extrabold mt-0.5">{configuringProduct.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    Harga Dasar: {formatRupiah(configuringProduct.price)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300">
                    Bebas Pilih Banyak
                  </span>
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
                          const priceNum = Number(addon.price || 0)

                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(group, addon)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2.5 ${
                                isSelected
                                  ? isDark
                                    ? 'border-red-500 bg-red-950/40 text-white shadow-xs ring-1 ring-red-500/40'
                                    : 'border-red-600 bg-red-50 text-red-950 shadow-xs ring-1 ring-red-500/20'
                                  : isDark
                                    ? 'border-[#60241E]/60 bg-[#1C0B09] text-stone-300 hover:border-red-600/50 hover:bg-[#250E0C]'
                                    : 'border-stone-200 bg-white text-stone-700 hover:border-red-300 hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Checkbox Indicator */}
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? 'border-red-600 bg-red-600 text-white'
                                      : isDark
                                        ? 'border-stone-600 bg-[#240E0C]'
                                        : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check size={11} strokeWidth={3} />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate leading-tight">
                                    {addon.name}
                                  </p>
                                  {addon.description && (
                                    <p className="text-[10px] text-stone-400 truncate">
                                      {addon.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md ${
                                  priceNum > 0
                                    ? isSelected
                                      ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50'
                                      : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800'
                                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                                }`}
                              >
                                {priceNum > 0 ? `+${formatRupiah(priceNum)}` : 'Termasuk'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
              )}

              {/* Quantity */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'border-[#60241E]/60 bg-[#240E0C]' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">Jumlah Porsi (Box)</p>
                  <p className="text-[10px] text-stone-400">
                    Minimal order: {configuringProduct.minimum_order} box
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTempQuantity((q) => Math.max(1, q - 1))}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-200'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={tempQuantity}
                    onChange={(e) => setTempQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className={`w-14 text-center text-xs font-bold rounded-lg border py-1 focus:outline-none ${
                      isDark ? 'border-[#60241E] bg-[#1C0B09]' : 'border-stone-200 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setTempQuantity((q) => q + 1)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-200'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Live Price Summary Box in Modal */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'border-[#60241E]/70 bg-[#1C0B09]' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex justify-between text-stone-400">
                  <span>Harga dasar menu:</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-200">
                    {formatRupiah(configuringProduct.price)} / box
                  </span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Total addon dipilih:</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-200">
                    {modalAddonsExtraPerUnit > 0
                      ? `+${formatRupiah(modalAddonsExtraPerUnit)} (${tempSelectedAddons.length} addon)`
                      : 'Rp 0 (Tanpa addon)'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Harga per box:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {formatRupiah(modalUnitPrice)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-[#60241E] flex justify-between items-center font-extrabold text-sm">
                  <span>Subtotal ({tempQuantity} box):</span>
                  <span className="text-red-600 dark:text-red-400 text-base">
                    {formatRupiah(modalTotalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200 dark:border-[#60241E] flex items-center justify-between gap-2">
              <div className="text-[11px] text-stone-400 hidden sm:block">
                {tempSelectedAddons.length > 0
                  ? `${tempSelectedAddons.length} addon dipilih`
                  : 'Belum ada addon dipilih'}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setConfiguringProduct(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isDark
                      ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:text-white'
                      : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Tambahkan ({formatRupiah(modalTotalPrice)})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
