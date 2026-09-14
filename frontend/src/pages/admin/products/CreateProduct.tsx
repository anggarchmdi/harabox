import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  UploadCloud,
  X,
  ImageIcon,
  Sparkles,
  Package,
  Check,
  Plus,
  Trash2,
  Info,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'

interface PackageAddonItem {
  id?: number
  name: string
  price: string
}

const ADDON_PRESETS = [
  { label: '+ Tambah Nasi (+Rp 2.000)', name: 'Tambah Nasi', price: '2000' },
  { label: '+ Nasi Kuning (+Rp 3.000)', name: 'Nasi Kuning', price: '3000' },
  { label: '+ Nasi Uduk (+Rp 3.000)', name: 'Nasi Uduk', price: '3000' },
  { label: '+ Telur Balado (+Rp 4.000)', name: 'Telur Balado', price: '4000' },
  { label: '+ Sambal Bawang (+Rp 1.500)', name: 'Sambal Bawang Extra', price: '1500' },
  { label: '+ Tahu Tempe (+Rp 2.500)', name: 'Tahu & Tempe Bacem', price: '2500' },
  { label: '+ Es Teh Manis (+Rp 3.000)', name: 'Es Teh Manis', price: '3000' },
]

export default function CreateProduct() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { data: categoryResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAdminAll(1),
  })

  const categories = categoryResponse?.data ?? []

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    minimum_order: '10',
    lead_time_days: '3',
    addons_enabled: false,
    image: null as File | null,
    is_active: true,
  })

  const [packageAddons, setPackageAddons] = useState<PackageAddonItem[]>([
    { name: 'Tambah Nasi', price: '2000' },
    { name: 'Nasi Kuning', price: '3000' },
  ])

  const handleAddAddonRow = (presetName = '', presetPrice = '0') => {
    setPackageAddons((prev) => [...prev, { name: presetName, price: presetPrice }])
  }

  const handleRemoveAddonRow = (index: number) => {
    setPackageAddons((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddonFieldChange = (index: number, field: 'name' | 'price', value: string) => {
    setPackageAddons((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WEBP')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2 MB')
      return
    }

    setForm((prev) => ({ ...prev, image: file }))
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: null }))
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Nama produk wajib diisi')
      return
    }

    if (!form.category_id) {
      toast.error('Kategori produk wajib dipilih')
      return
    }

    if (!form.price || Number(form.price) <= 0) {
      toast.error('Harga produk harus lebih dari 0')
      return
    }

    if (form.image) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(form.image.type)) {
        toast.error('Format gambar harus JPG, PNG, atau WEBP')
        return
      }

      if (form.image.size > 2 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 2 MB')
        return
      }
    }

    try {
      setLoading(true)

      const validAddons = form.addons_enabled
        ? packageAddons
          .filter((a) => a.name.trim().length > 0)
          .map((a) => ({
            id: a.id,
            name: a.name.trim(),
            price: Math.max(0, Number(a.price) || 0),
            is_active: true,
          }))
        : []

      await productService.create({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        minimum_order: Math.max(1, Number(form.minimum_order) || 1),
        lead_time_days: Math.max(0, Number(form.lead_time_days) || 0),
        addons_enabled: form.addons_enabled,
        addons: validAddons,
        image: form.image,
        is_active: form.is_active,
      })

      toast.success('Produk berhasil ditambahkan')

      await queryClient.invalidateQueries({
        queryKey: ['products'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['product'],
      })

      await queryClient.refetchQueries({
        queryKey: ['products'],
      })

      navigate('/admin/products')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Gagal menambahkan produk',
      )
    } finally {
      setLoading(false)
    }
  }

  const formattedPrice = form.price && !isNaN(Number(form.price))
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(form.price))
    : null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-2xs transition hover:bg-stone-50 hover:text-stone-900 active:scale-95"
            title="Kembali ke Katalog Produk"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
              <span className="cursor-pointer hover:text-stone-600" onClick={() => navigate('/admin/products')}>Katalog Produk</span>
              <span>/</span>
              <span className="text-red-700">Tambah Produk</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Tambah Produk Baru
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={loading}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 shadow-2xs transition hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || categoriesLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save size={16} />
            )}
            <span>{loading ? 'Menyimpan...' : 'Simpan Produk'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Product Info & Details (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-2xs">
            <div className="mb-5 flex items-center gap-2.5 border-b border-stone-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700">
                <Package size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Informasi Utama</h2>
                <p className="text-xs text-stone-500">Nama menu, kategori produk, dan harga satuan</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Nama Produk <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Contoh: Paket Nasi Ayam Bakar Madu"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 sm:py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Category, Price, Minimum Order, Lead Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Category */}
                <div>
                  <label htmlFor="category_id" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Kategori Menu <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    disabled={categoriesLoading || loading}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 sm:py-3 text-sm text-stone-900 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                  >
                    <option value="">
                      {categoriesLoading ? 'Memuat kategori...' : '-- Pilih Kategori --'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Harga Satuan <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                      Rp
                    </span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="500"
                      value={form.price}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="35000"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-10 pr-4 py-2.5 sm:py-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  {formattedPrice && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      Preview: {formattedPrice} / porsi
                    </p>
                  )}
                </div>

                {/* Minimum Order */}
                <div>
                  <label htmlFor="minimum_order" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Minimal Pesanan (Porsi) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="minimum_order"
                    name="minimum_order"
                    type="number"
                    min="1"
                    step="1"
                    value={form.minimum_order}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="10"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 sm:py-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Gunakan 1 untuk satuan, atau 10 untuk paket
                  </p>
                </div>

                {/* Lead Time Days */}
                <div>
                  <label htmlFor="lead_time_days" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Batas Order (H- Hari) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="lead_time_days"
                    name="lead_time_days"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    value={form.lead_time_days}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="3"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 sm:py-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Minimal H-X hari sebelum acara (0 = bisa hari H)
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Deskripsi Menu
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={loading}
                  rows={4}
                  placeholder="Jelaskan isi paket, lauk pelengkap, rasa khas, atau catatan saji..."
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>
          </div>

          {/* Add-on & Customization Card (1 Paket Menu) */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">Kustomisasi & Pilihan Tambahan Paket</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${form.addons_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {form.addons_enabled ? 'ON (Aktif)' : 'OFF (Nonaktif)'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500 max-w-xl">
                  Add-on ini menjadi satu kesatuan paket dengan menu produk. Pilihan seperti tambah nasi, variasi nasi kuning, atau aneka lauk akan dikalikan sesuai jumlah porsi pesanan.
                </p>
              </div>

              {/* On/Off Switch Button */}
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, addons_enabled: !prev.addons_enabled }))}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.addons_enabled ? 'bg-emerald-600' : 'bg-stone-300'}`}
                role="switch"
                aria-checked={form.addons_enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.addons_enabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {form.addons_enabled ? (
              <div className="mt-5 space-y-4">
                {/* Info alert */}
                <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                  <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Sistem Harga 1 Paket:</span> Harga add-on di bawah adalah penambahan per porsi. Jika pelanggan memesan 100 porsi dan memilih <em>Tambah Nasi (+Rp 2.000)</em>, sistem otomatis menghitung tambahan Rp 2.000 × 100 = Rp 200.000.
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Klik Cepat untuk Tambah Pilihan Populer:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ADDON_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddAddonRow(preset.name, preset.price)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition active:scale-95"
                      >
                        <Plus size={12} className="text-stone-400" />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Addon Items List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Daftar Pilihan Add-on / Variasi Paket ({packageAddons.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddAddonRow('', '0')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      <Plus size={14} />
                      Tambah Pilihan Baru
                    </button>
                  </div>

                  {packageAddons.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-500">
                      Belum ada pilihan add-on untuk paket ini. Silakan klik salah satu tombol pilihan populer di atas atau tombol "Tambah Pilihan Baru".
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {packageAddons.map((addon, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/60 p-2.5 transition focus-within:border-red-500 focus-within:bg-white"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-200 text-[11px] font-bold text-stone-600">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={addon.name}
                              onChange={(e) => handleAddonFieldChange(index, 'name', e.target.value)}
                              placeholder="Nama Pilihan (contoh: Nasi Kuning / Telur Balado)"
                              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative w-36 sm:w-40">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-500">
                                +Rp
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={addon.price}
                                onChange={(e) => handleAddonFieldChange(index, 'price', e.target.value)}
                                placeholder="0"
                                className="w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveAddonRow(index)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
                              title="Hapus baris ini"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-stone-50 p-3.5 text-xs text-stone-500">
                Fitur Add-on sedang <strong className="text-stone-700">Nonaktif</strong>. Menu ini akan dijual sebagai paket standar tanpa pilihan variasi kustomisasi.
              </div>
            )}
          </div>

          {/* Visibility / Status Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${form.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                  <Check size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Status Ketersediaan Produk</h3>
                  <p className="text-xs text-stone-500">
                    {form.is_active
                      ? 'Produk aktif dan dapat langsung dipesan oleh pelanggan'
                      : 'Produk nonaktif / disembunyikan sementara dari katalog'}
                  </p>
                </div>
              </div>

              {/* Modern Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                disabled={loading}
                onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.is_active ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${form.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Image Upload & Tips (1 Col) */}
        <div className="space-y-6">
          {/* Photo Upload Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ImageIcon size={15} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">Foto Menu Produk</h3>
              </div>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-600 transition hover:text-red-700"
                >
                  <X size={13} />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={loading}
              className="hidden"
            />

            {previewUrl ? (
              <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-48 w-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/40 opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-sm transition hover:bg-white active:scale-95"
                  >
                    Ganti Foto
                  </button>
                </div>
                {form.image && (
                  <div className="border-t border-stone-100 bg-white p-2.5 text-center">
                    <p className="truncate text-xs font-medium text-stone-700">{form.image.name}</p>
                    <p className="text-[10px] text-stone-400">
                      {(form.image.size / 1024).toFixed(0)} KB • Siap diunggah
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-6 text-center transition hover:border-red-400 hover:bg-red-50/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-2xs transition group-hover:scale-110 group-hover:text-red-600">
                  <UploadCloud size={24} />
                </div>
                <p className="mt-3 text-xs font-bold text-stone-800">
                  Klik untuk unggah foto menu
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  JPG, PNG, atau WEBP (Maksimal 2 MB)
                </p>
              </div>
            )}
          </div>

          {/* Quick Guidelines Card */}
          <div className="rounded-2xl border border-amber-200/60 bg-linear-to-br from-amber-50/50 to-orange-50/30 p-5 text-stone-700 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-700">
              <Sparkles size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Tips Foto Menarik</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-stone-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Gunakan foto berpencahayaan alami dan beresolusi tinggi rasio 1:1 atau 4:3.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Perlihatkan porsi makanan secara jelas agar pelanggan tahu isi paket.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>Minimum order catering default otomatis terset 10 porsi.</span>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
