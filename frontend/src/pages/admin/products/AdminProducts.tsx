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
  X,
} from 'lucide-react'

import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'

import type { Product } from '../../../types/products'

import ProductTable from '../../../components/admin/products/ProductTable'

export default function Products() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // =========================
  // SEARCH
  // =========================

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // =========================
  // FILTER
  // =========================

  const [categoryId, setCategoryId] =
    useState<number | undefined>()

  const [isActive, setIsActive] =
    useState<boolean | null>(null)

  // =========================
  // PAGINATION
  // =========================

  const [page, setPage] = useState(1)

  // =========================
  // DEBOUNCE SEARCH
  // =========================

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)

    return () => {
      clearTimeout(timeout)
    }
  }, [searchInput])

  // =========================
  // CATEGORIES
  // =========================

  const {
    data: categoryResponse,
    isLoading: isCategoryLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      categoryService.getAdminAll(1),
    staleTime: 5 * 60 * 1000,
  })

  const categories = categoryResponse?.data ?? []

  // =========================
  // PRODUCTS
  // =========================

  const {
    data: productResponse,
    isLoading,
    isFetching,
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

    placeholderData: (previousData) =>
      previousData,
  })

  const products: Product[] =
    productResponse?.data ?? []

  const currentPage =
    productResponse?.current_page ?? 1

  const lastPage =
    productResponse?.last_page ?? 1

  const total =
    productResponse?.total ?? 0

  const from =
    productResponse?.from ?? 0

  const to =
    productResponse?.to ?? 0

  // =========================
  // EDIT
  // =========================

  const handleEdit = (product: Product) => {
    navigate(
      `/admin/products/${product.id}/edit`,
    )
  }

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (
    product: Product,
  ) => {
    const confirmed = window.confirm(
      `Hapus produk "${product.name}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await productService.delete(product.id)

      toast.success(
        'Produk berhasil dihapus',
      )

      // Refresh semua query products,
      // termasuk query dengan filter/page berbeda.
      await queryClient.invalidateQueries({
        queryKey: ['products'],
        refetchType: 'all',
      })

      // Kalau halaman terakhir cuma punya
      // satu produk lalu dihapus,
      // kembali ke halaman sebelumnya.
      if (
        products.length === 1 &&
        page > 1
      ) {
        setPage((prev) => prev - 1)
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Gagal menghapus produk',
      )
    }
  }

  // =========================
  // RESET FILTER
  // =========================

  const handleResetFilter = () => {
    setSearchInput('')
    setSearch('')

    setCategoryId(undefined)

    setIsActive(null)

    setPage(1)
  }

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Memuat produk...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* =========================
          HEADER
      ========================= */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Produk
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola produk dan menu.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/admin/products/create',
            )
          }
          className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Tambah Produk
        </button>
      </div>

      {/* =========================
          SEARCH & FILTER
      ========================= */}

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value,
                )
              }
              placeholder="Cari nama produk..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* CATEGORY */}

          <select
            value={categoryId ?? ''}
            onChange={(event) => {
              const value =
                event.target.value

              setCategoryId(
                value
                  ? Number(value)
                  : undefined,
              )

              setPage(1)
            }}
            disabled={isCategoryLoading}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50"
          >
            <option value="">
              {isCategoryLoading
                ? 'Memuat kategori...'
                : 'Semua kategori'}
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

          {/* STATUS */}

          <select
            value={
              isActive === null
                ? ''
                : isActive
                  ? '1'
                  : '0'
            }
            onChange={(event) => {
              const value =
                event.target.value

              setIsActive(
                value === ''
                  ? null
                  : value === '1',
              )

              setPage(1)
            }}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          >
            <option value="">
              Semua status
            </option>

            <option value="1">
              Aktif
            </option>

            <option value="0">
              Nonaktif
            </option>
          </select>

          {/* RESET */}

          {(searchInput ||
            categoryId !== undefined ||
            isActive !== null) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <X size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* =========================
          TABLE
      ========================= */}

      <div className="relative">
        {isFetching && !isLoading && (
          <div className="mb-3 text-xs text-gray-400">
            Memperbarui data produk...
          </div>
        )}

        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* =========================
            PAGINATION
        ========================= */}

        {total > 0 && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan{' '}

              <span className="font-semibold text-gray-700">
                {from}
              </span>{' '}

              -{' '}

              <span className="font-semibold text-gray-700">
                {to}
              </span>{' '}

              dari{' '}

              <span className="font-semibold text-gray-700">
                {total}
              </span>{' '}

              produk
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  currentPage <= 1 ||
                  isFetching
                }
                onClick={() =>
                  setPage(
                    (prev) => prev - 1,
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>

              <span className="px-3 text-sm font-semibold text-gray-700">
                {currentPage} / {lastPage}
              </span>

              <button
                type="button"
                disabled={
                  currentPage >=
                    lastPage ||
                  isFetching
                }
                onClick={() =>
                  setPage(
                    (prev) => prev + 1,
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
