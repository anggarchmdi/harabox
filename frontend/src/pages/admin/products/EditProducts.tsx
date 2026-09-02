import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { toast } from 'sonner'

import {
  ArrowLeft,
  Save,
} from 'lucide-react'

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'

interface ProductForm {
  category_id: string
  name: string
  description: string
  price: string
  image: string
  is_active: boolean
}

export default function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [form, setForm] =
    useState<ProductForm>({
      category_id: '',
      name: '',
      description: '',
      price: '',
      image: '',
      is_active: true,
    })

  const {
    data: categoryResponse,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      categoryService.getAdminAll(1),
  })

  const categories =
    categoryResponse?.data ?? []

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        toast.error(
          'ID produk tidak ditemukan',
        )

        navigate('/admin/products')
        return
      }

      const productId = Number(id)

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        toast.error(
          'ID produk tidak valid',
        )

        navigate('/admin/products')
        return
      }

      try {
        setLoading(true)

        const product =
          await productService.getAdminById(
            productId,
          )

        setForm({
          category_id: String(
            product.category_id,
          ),
          name: product.name,
          description:
            product.description ?? '',
          price: String(product.price),
          image: product.image ?? '',
          is_active: product.is_active,
        })
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            'Gagal mengambil data produk',
        )

        navigate('/admin/products')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, navigate])

  const handleChange = (
    e: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    if (!id) {
      toast.error(
        'ID produk tidak ditemukan',
      )
      return
    }

    const productId = Number(id)

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      toast.error(
        'ID produk tidak valid',
      )
      return
    }

    if (!form.name.trim()) {
      toast.error(
        'Nama produk wajib diisi',
      )
      return
    }

    if (!form.category_id) {
      toast.error(
        'Kategori produk wajib dipilih',
      )
      return
    }

    if (
      !form.price ||
      Number(form.price) <= 0
    ) {
      toast.error(
        'Harga produk harus lebih dari 0',
      )
      return
    }

    try {
      setSaving(true)

      await productService.update(
        productId,
        {
          category_id: Number(
            form.category_id,
          ),
          name: form.name.trim(),
          description:
            form.description.trim(),
          price: Number(form.price),
          image:
            form.image.trim() ||
            undefined,
          is_active: form.is_active,
        },
      )

      toast.success(
        'Produk berhasil diperbarui',
      )

      // Tandai cache sebagai stale
      await queryClient.invalidateQueries({
        queryKey: ['products'],
      })

      // Ambil data terbaru
      await queryClient.refetchQueries({
        queryKey: ['products'],
      })

      navigate('/admin/products')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Gagal memperbarui produk',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Memuat data produk...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            navigate('/admin/products')
          }
          className="rounded-lg p-2 transition hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Produk
          </h1>

          <p className="text-sm text-gray-500">
            Perbarui data produk
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm"
      >
        <div className="space-y-5">
          {/* Category */}
          <div>
            <label
              htmlFor="category_id"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Kategori
            </label>

            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              disabled={
                categoriesLoading ||
                saving
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            >
              <option value="">
                {categoriesLoading
                  ? 'Memuat kategori...'
                  : 'Pilih kategori'}
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nama Produk
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              disabled={saving}
              placeholder="Masukkan nama produk"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Deskripsi
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={saving}
              rows={4}
              placeholder="Masukkan deskripsi produk"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Harga
            </label>

            <input
              id="price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              disabled={saving}
              placeholder="Masukkan harga"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {/* Image */}
          <div>
            <label
              htmlFor="image"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              URL Gambar
            </label>

            <input
              id="image"
              name="image"
              type="text"
              value={form.image}
              onChange={handleChange}
              disabled={saving}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_active:
                    e.target.checked,
                }))
              }
              disabled={saving}
              className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
            />

            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700"
            >
              Produk aktif
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              navigate('/admin/products')
            }
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              categoriesLoading
            }
            className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />

            {saving
              ? 'Menyimpan...'
              : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
