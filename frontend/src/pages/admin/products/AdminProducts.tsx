import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  X,
  Package,
} from 'lucide-react'

import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'
import type { Product } from '../../../types/products'
import ProductTable from '../../../components/admin/products/ProductTable'
import PageLoader from '../../../components/ui/PageLoader'

export default function Products() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [page, setPage] = useState(1)

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timeout)
  }, [searchInput])

  // Categories query
  const {
    data: categoryResponse,
    isLoading: isCategoryLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAdminAll(1),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoryResponse?.data ?? []

  // Products query
  const {
    data: productResponse,
    isLoading,
  } = useQuery({
    queryKey: [
      'products',
      {
        page,
        search,
        categoryId,
        isActive,
      },
    ],
    queryFn: () =>
      productService.getAdminAll({
        page,
        search,
        category_id: categoryId,
        is_active: isActive,
        per_page: 10,
      }),
    placeholderData: (previousData) => previousData,
  })

  const products: Product[] = productResponse?.data ?? []
  const currentPage = productResponse?.current_page ?? 1
  const lastPage = productResponse?.last_page ?? 1
  const total = productResponse?.total ?? 0
  const from = productResponse?.from ?? 0
  const to = productResponse?.to ?? 0

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/${product.id}/edit`)
  }

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Hapus produk "${product.name}"?`)
    if (!confirmed) return

    try {
      await productService.delete(product.id)
      toast.success('Produk berhasil dihapus.')
      await queryClient.invalidateQueries({
        queryKey: ['products'],
        refetchType: 'all',
      })
      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Gagal menghapus produk.',
      )
    }
  }

  const handleResetFilter = () => {
    setSearchInput('')
    setSearch('')
    setCategoryId(undefined)
    setIsActive(null)
    setPage(1)
  }

  const hasActiveFilters = Boolean(searchInput || categoryId !== undefined || isActive !== null)

  return (
    <div className="min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 text-stone-900">
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Katalog Produk..."
        subtext="Memuat daftar menu nasi box, bento, dan krisbar"
        minDuration={400}
      />
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Katalog Menu
            </p>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
            Katalog Produk Katering
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            Atur paket nasi box, kelola harga porsi, ketersediaan menu, dan deskripsi produk yang tampil di website.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/products/create')}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama produk katering..."
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/70 pl-9 pr-8 text-xs font-medium outline-none focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Select */}
          <select
            value={categoryId ?? ''}
            onChange={(e) => {
              const val = e.target.value
              setCategoryId(val ? Number(val) : undefined)
              setPage(1)
            }}
            disabled={isCategoryLoading}
            className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 outline-none focus:border-red-600"
          >
            <option value="">
              {isCategoryLoading ? 'Memuat kategori...' : 'Semua Kategori'}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={isActive === null ? '' : isActive ? '1' : '0'}
            onChange={(e) => {
              const val = e.target.value
              setIsActive(val === '' ? null : val === '1')
              setPage(1)
            }}
            className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 outline-none focus:border-red-600"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif di Menu</option>
            <option value="0">Nonaktif</option>
          </select>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 h-10 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Table / Cards */}
      {isLoading ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-2xs space-y-3">
          <Package size={24} className="mx-auto text-stone-400 animate-bounce" />
          <p className="text-xs text-stone-500 font-medium">Memuat katalog produk katering...</p>
        </div>
      ) : (
        <>
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {total > 0 && lastPage > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-stone-500">
              <p>
                Menampilkan{' '}
                <span className="font-bold text-stone-900">{from}</span> -{' '}
                <span className="font-bold text-stone-900">{to}</span> dari{' '}
                <span className="font-bold text-stone-900">{total}</span> produk
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="px-3 font-semibold text-stone-800">
                  {currentPage} / {lastPage}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
