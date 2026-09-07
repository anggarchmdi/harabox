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
  Check,
  Package,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'

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
    image: null as File | null,
    is_active: true,
  })

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

      await productService.create({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        minimum_order: 10,
        image: form.image,
        is_active: form.is_active,
      })

      toast.success('Produk berhasil ditambahkan')

      await queryClient.invalidateQueries({
        queryKey: ['products'],
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

              {/* Category & Price in 2 cols */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <label htmlFor="category_id" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Kategori <span className="text-red-600">*</span>
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
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.is_active ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    form.is_active ? 'translate-x-5' : 'translate-x-0'
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
