import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { productService } from '../../../services/products.service'

import type { Product } from '../../../types/products'

import ProductTable from '../../../components/admin/products/ProductTable'

export default function AdminProducts() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<Product | null>(null)

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-products'],
    queryFn: productService.getAll,
  })


  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      productService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-products'],
      })

      setDeleteTarget(null)

      toast.success('Produk berhasil dihapus.')
    },

    onError: () => {
      toast.error('Gagal menghapus produk.')
    },
  })

  const handleTambah = () => {
    setLoading(true);
    setTimeout(() => {
        navigate('/admin/products/create')
    }, 700)
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    deleteMutation.mutate(deleteTarget.id)
  }

  return (
    <div className="p-8 rounded-lg space-y-8 bg-white">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-red-600">
            Catalog
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900">
            Products
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Kelola produk dan menu yang tersedia di HaraBox.
          </p>
        </div>

        <button
        onClick={handleTambah}
          className="inline-flex cursor-pointer transition-all transform hover:scale-95 duration-300 items-center justify-center rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-600"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Produk
          </p>

          <p className="mt-2 text-3xl font-black text-gray-900">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Produk Aktif
          </p>

          <p className="mt-2 text-3xl font-black text-green-600">
            {products.filter((item) => item.is_active).length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Produk Nonaktif
          </p>

          <p className="mt-2 text-3xl font-black text-gray-400">
            {products.filter((item) => !item.is_active).length}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center">
          <p className="text-sm font-medium text-gray-500">
            Memuat produk...
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
          <p className="font-semibold text-red-700">
            Gagal mengambil data produk.
          </p>

          <button
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ['admin-products'],
              })
            }
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <ProductTable
          products={products}
          onEdit={(product) =>
            navigate(`/admin/products/${product.id}/edit`)
          }
          onDelete={setDeleteTarget}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">
              Hapus produk?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Produk{' '}
              <strong className="text-gray-900">
                {deleteTarget.name}
              </strong>{' '}
              akan dihapus secara permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending
                  ? 'Menghapus...'
                  : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
