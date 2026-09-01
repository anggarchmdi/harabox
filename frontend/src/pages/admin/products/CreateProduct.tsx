import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { productService } from '../../../services/products.service'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../../../services/category.services'

export default function CreateProduct() {
  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image: '',
    is_active: true,
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Nama produk wajib diisi.')
      return
    }

    if (!form.category_id) {
      toast.error('Kategori wajib dipilih.')
      return
    }

    if (!form.price) {
      toast.error('Harga wajib diisi.')
      return
    }

    try {
      setLoading(true)

      await productService.create({
        category_id: Number(form.category_id),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image: form.image || undefined,
        is_active: form.is_active,
      })

      await queryClient.invalidateQueries({
        queryKey: ['products'],
      })

      toast.success('Produk berhasil dibuat.')

      navigate('/admin/products')
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Gagal membuat produk.'

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tambah Produk
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Tambahkan produk baru ke katalog Harabox.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="space-y-6 p-6 sm:p-8">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              Nama Produk
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Contoh: Nasi Box Ayam Krispy"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category_id"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              Kategori
            </label>

            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              disabled={categoriesLoading || loading}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            >
              <option value="">
                {categoriesLoading
                  ? 'Memuat kategori...'
                  : 'Pilih kategori'}
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              Deskripsi
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Deskripsi produk..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              Harga
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                Rp
              </span>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="18000"
                className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label
              htmlFor="image"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              URL Gambar
            </label>

            <input
              id="image"
              name="image"
              type="text"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />

            <p className="mt-2 text-xs text-gray-400">
              Upload gambar akan kita buat setelah CRUD dasar selesai.
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Status Produk
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Produk aktif akan ditampilkan di katalog.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  is_active: !current.is_active,
                }))
              }
              className={`relative h-6 w-11 rounded-full transition ${
                form.is_active
                  ? 'bg-red-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                  form.is_active
                    ? 'left-6'
                    : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />

            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </div>
  )
}
