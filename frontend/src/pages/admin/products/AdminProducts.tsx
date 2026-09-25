import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Search,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'

import { productService } from '../../../services/products.service'
import { categoryService } from '../../../services/category.services'
import type { Product } from '../../../types/products'
import ProductTable from '../../../components/admin/products/ProductTable'
import PageLoader from '../../../components/ui/PageLoader'
import Pagination from '../../../components/ui/Pagination'
import { useThemeStore } from '../../../stores/theme.store'
import useDebounce from '../../../hooks/useDebounce'

function ProductTableSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-2xl border shadow-2xs overflow-hidden ${
        isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
      }`}
    >
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead
            className={`border-b ${
              isDark ? 'border-[#60241E] bg-[#2D120F]' : 'border-stone-100 bg-stone-50/70'
            }`}
          >
            <tr>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-100/70' : 'text-stone-400'}`}>
                Menu Katering
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-100/70' : 'text-stone-400'}`}>
                Kategori
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-100/70' : 'text-stone-400'}`}>
                Harga & Min. Order
              </th>
              <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-100/70' : 'text-stone-400'}`}>
                Status
              </th>
              <th className={`px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-100/70' : 'text-stone-400'}`}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#60241E]/40' : 'divide-stone-100'}`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`h-14 w-14 rounded-xl shrink-0 ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                    <div className="space-y-1.5 flex-1">
                      <div className={`h-4 w-36 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                      <div className={`h-2.5 w-48 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className={`h-5 w-20 rounded-md ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-4 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  <div className={`mt-1.5 h-2.5 w-16 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                </td>
                <td className="px-5 py-4">
                  <div className={`h-6 w-20 rounded-full ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                    <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Skeletons */}
      <div className="md:hidden divide-y divide-stone-100 dark:divide-[#60241E]/40 p-3 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="pt-3 first:pt-0 animate-pulse space-y-3">
            <div className="flex items-start gap-3">
              <div className={`h-16 w-16 rounded-xl shrink-0 ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-32 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
                <div className={`h-3 w-20 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-100'}`} />
                <div className={`h-4 w-24 rounded ${isDark ? 'bg-[#2D120F]' : 'bg-stone-200'}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Products() {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput.trim(), 400)
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [page, setPage] = useState(1)

  // Reset page when search or category filter changes
  useEffect(() => {
    setPage(1)
  }, [search, categoryId, isActive])

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
    setCategoryId(undefined)
    setIsActive(null)
    setPage(1)
  }

  const hasActiveFilters = Boolean(searchInput || categoryId !== undefined || isActive !== null)

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        text="Menyiapkan Katalog Produk..."
        subtext="Memuat daftar menu nasi box, bento, dan krisbar"
        minDuration={400}
      />
      <div className={`min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 ${
        isDark ? 'text-stone-100' : 'text-stone-900'
      }`}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-600" />
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Katalog Menu
            </p>
          </div>
          <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-stone-950'}`}>
            Katalog Produk Katering
          </h1>
          <p className={`mt-1 text-xs sm:text-sm max-w-2xl ${isDark ? 'text-amber-100/70' : 'text-stone-500'}`}>
            Atur paket nasi box, kelola harga porsi, ketersediaan menu, dan deskripsi produk yang tampil di website.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/products/create')}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500 transform hover:scale-95 duration-300 hover:cursor-pointer px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className={`rounded-2xl border p-4 shadow-2xs space-y-3 ${
        isDark ? 'border-[#60241E]/80 bg-[#240E0C]' : 'border-stone-200/90 bg-white'
      }`}>
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
              className={`h-10 w-full rounded-xl border pl-9 pr-8 text-xs font-medium outline-none transition ${
                isDark
                  ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder-stone-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]'
                  : 'border-stone-200 bg-stone-50/70 text-stone-900 placeholder-stone-400 focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600'
              }`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-400 hover:text-stone-700'}`}
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
            className={`h-10 rounded-xl border px-3 text-xs font-medium outline-none transition ${
              isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-stone-200 focus:border-[#F59E0B]'
                : 'border-stone-200 bg-white text-stone-700 focus:border-red-600'
            }`}
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
            className={`h-10 rounded-xl border px-3 text-xs font-medium outline-none transition ${
              isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-stone-200 focus:border-[#F59E0B]'
                : 'border-stone-200 bg-white text-stone-700 focus:border-red-600'
            }`}
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
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 h-10 text-xs font-semibold transition ${
                isDark
                  ? 'border-[#60241E] bg-[#1C0B09] text-stone-200 hover:bg-[#2D120F]'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Table / Cards */}
      {isLoading ? (
        <ProductTableSkeleton isDark={isDark} />
      ) : (
        <>
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={total}
            onPageChange={setPage}
            itemName="produk katering"
            className="rounded-2xl mt-4"
          />
        </>
      )}
    </div>
    </>
  )
}
