import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  X,
  Sparkles,
  Layers,
  UtensilsCrossed,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import type { Category, CategoryForm } from '../../types/category'
import { categoryService } from '../../services/category.services'
import PageLoader from '../../components/ui/PageLoader'
import { useThemeStore } from '../../stores/theme.store'
import useDebounce from '../../hooks/useDebounce'

const initialForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
}

export default function AdminCategories() {
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)

  // Search
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput.trim(), 400)

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(initialForm)
  const [saving, setSaving] = useState(false)

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['categories', page],
    queryFn: () => categoryService.getAdminAll(page),
  })

  const categories = data?.data ?? []

  // Filtered categories
  const filteredCategories = categories.filter((category) => {
    const keyword = search.toLowerCase()
    return (
      category.name.toLowerCase().includes(keyword) ||
      category.slug.toLowerCase().includes(keyword)
    )
  })

  // Metric aggregates
  const totalCategories = data?.total ?? categories.length
  const totalProducts = categories.reduce((acc, c) => acc + (c.products_count ?? 0), 0)

  // Modal Open Handlers
  const openCreateModal = () => {
    setEditingCategory(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEditModal = async (category: Category) => {
    try {
      const detail = await categoryService.getAdminById(category.id)
      setEditingCategory(detail)
      setForm({
        name: detail.name,
        slug: detail.slug,
        description: detail.description ?? '',
      })
      setModalOpen(true)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      toast.error(
        axiosError.response?.data?.message ?? 'Gagal mengambil data kategori.',
      )
    }
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingCategory(null)
    setForm(initialForm)
  }

  // Form Handlers
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const generateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    setForm((current) => ({
      ...current,
      slug,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Nama kategori wajib diisi.')
      return
    }

    if (!form.slug.trim()) {
      toast.error('Slug kategori wajib diisi.')
      return
    }

    try {
      setSaving(true)

      const payload: CategoryForm = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
      }

      if (editingCategory) {
        await categoryService.update(editingCategory.id, payload)
        toast.success('Kategori berhasil diperbarui.')
      } else {
        await categoryService.create(payload)
        toast.success('Kategori berhasil ditambahkan.')
      }

      await queryClient.invalidateQueries({
        queryKey: ['categories'],
        refetchType: 'all',
      })

      closeModal()
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string
        errors?: Record<string, string[]>
      }>

      const validationMessage = axiosError.response?.data?.errors
      if (validationMessage) {
        const firstError = Object.values(validationMessage).flat()[0]
        toast.error(firstError)
      } else {
        toast.error(
          axiosError.response?.data?.message ?? 'Gagal menyimpan kategori.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // In-App Delete Handlers
  const triggerDelete = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      setDeleting(true)
      await categoryService.delete(categoryToDelete.id)
      toast.success('Kategori berhasil dihapus.')

      await queryClient.invalidateQueries({
        queryKey: ['categories'],
        refetchType: 'all',
      })

      if (categories.length === 1 && page > 1) {
        setPage((current) => current - 1)
      }

      setDeleteModalOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      toast.error(
        axiosError.response?.data?.message ?? 'Gagal menghapus kategori.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <PageLoader
        isLoading={isLoading}
        text="Memuat Kategori Menu..."
        subtext="Menyiapkan kelompok kategori paket katering"
        minDuration={400}
      />
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Kategori Menu
          </h1>
          <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-amber-100/60' : 'text-stone-500'}`}>
            Kelola pengelompokan menu dan katalog pesanan HaraBox
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:cursor-pointer transform hover:scale-95 duration-300 px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 active:scale-95"
        >
          <Plus size={18} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`flex items-center gap-3.5 rounded-2xl border p-4 sm:p-5 shadow-2xs ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
        }`}>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-700'
          }`}>
            <Layers size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total Kategori</p>
            <p className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{totalCategories}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3.5 rounded-2xl border p-4 sm:p-5 shadow-2xs ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
        }`}>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-700'
          }`}>
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Produk Terkategori</p>
            <p className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {isLoading ? '...' : totalProducts} menu
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3.5 rounded-2xl border p-4 sm:p-5 shadow-2xs ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
        }`}>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <FolderOpen size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Status Sistem</p>
            <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Aktif & Tersinkron</p>
          </div>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama atau slug kategori..."
            className={`w-full rounded-xl border py-2.5 pl-10 pr-9 text-xs sm:text-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
              isDark
                ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500 focus:bg-[#1C0B09]'
                : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:bg-white'
            }`}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {isFetching && !isLoading && (
          <p className="text-xs text-stone-400 animate-pulse">
            Memperbarui data kategori...
          </p>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className={`flex min-h-[320px] items-center justify-center rounded-2xl border shadow-2xs ${
          isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
        }`}>
          <div className="text-center">
            <div className={`mx-auto h-8 w-8 animate-spin rounded-full border-2 ${
              isDark ? 'border-[#60241E] border-t-red-500' : 'border-stone-200 border-t-red-600'
            }`} />
            <p className={`mt-3 text-xs sm:text-sm font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Memuat data kategori...
            </p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className={`rounded-2xl border px-6 py-16 text-center shadow-2xs ${
          isDark
            ? 'border-[#60241E] bg-[#240E0C]'
            : 'border-dashed border-stone-200 bg-white'
        }`}>
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            <FolderOpen size={26} />
          </div>
          <h3 className={`mt-4 text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {search ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
          </h3>
          <p className={`mx-auto mt-1 max-w-sm text-xs sm:text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {search
              ? `Tidak ditemukan kategori yang cocok dengan "${search}".`
              : 'Tambahkan kategori pertama untuk mulai mengelompokkan menu catering HaraBox.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-red-700"
            >
              <Plus size={16} />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (hidden on md and down) */}
          <div className={`hidden md:block overflow-hidden rounded-2xl border shadow-2xs ${
            isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#60241E]/60 bg-[#1C0B09] text-stone-400' : 'border-stone-100 bg-stone-50/70 text-stone-500'
                }`}>
                  <tr>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5">Slug URL</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5">Jumlah Menu</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${
                  isDark ? 'divide-[#60241E]/40 text-stone-200' : 'divide-stone-100'
                }`}>
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className={`group transition ${
                        isDark ? 'hover:bg-[#2D120F]' : 'hover:bg-stone-50/50'
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                            isDark
                              ? 'bg-red-950/60 text-red-400 group-hover:bg-red-900/60'
                              : 'bg-red-50 text-red-700 group-hover:bg-red-100'
                          }`}>
                            <FolderOpen size={18} />
                          </div>
                          <div>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>{category.name}</p>
                            <p className={`text-[11px] font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                              ID: #{category.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 font-mono text-xs ${
                          isDark
                            ? 'border-[#60241E] bg-[#1C0B09] text-stone-300'
                            : 'border-stone-200 bg-stone-50 text-stone-600'
                        }`}>
                          {category.slug}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="max-w-xs px-6 py-4">
                        <p className={`truncate text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                          {category.description || '-'}
                        </p>
                      </td>

                      {/* Product Count */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isDark ? 'bg-[#1C0B09] text-stone-300' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {category.products_count ?? 0} menu
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition ${
                              isDark
                                ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                            }`}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerDelete(category)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              isDark
                                ? 'border-red-900/80 bg-red-950/40 text-red-400 hover:bg-red-900/50'
                                : 'border-red-200/80 bg-red-50/50 text-red-600 hover:bg-red-100/70'
                            }`}
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data && data.last_page && data.last_page > 1 && (
              <div className={`flex items-center justify-between border-t px-6 py-3.5 text-xs ${
                isDark ? 'border-[#60241E]/60' : 'border-stone-100'
              }`}>
                <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                  Menampilkan <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{data.from ?? 0}</span>-
                  <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{data.to ?? 0}</span> dari{' '}
                  <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{data.total}</span> kategori
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1 || isFetching}
                    onClick={() => setPage((c) => c - 1)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40 ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-red-600 px-2.5 font-bold text-white">
                    {page}
                  </span>
                  <button
                    type="button"
                    disabled={page >= data.last_page || isFetching}
                    onClick={() => setPage((c) => c + 1)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40 ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Responsive Cards View (block md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`rounded-2xl border p-4 shadow-2xs ${
                  isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-700'
                    }`}>
                      <FolderOpen size={18} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>{category.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`font-mono text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          {category.slug}
                        </span>
                        <span className={isDark ? 'text-stone-600' : 'text-stone-300'}>•</span>
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          {category.products_count ?? 0} menu
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {category.description && (
                  <p className={`mt-2.5 text-xs line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {category.description}
                  </p>
                )}

                <div className={`mt-3.5 flex items-center justify-end gap-2 border-t pt-3 ${
                  isDark ? 'border-[#60241E]/60' : 'border-stone-100'
                }`}>
                  <button
                    type="button"
                    onClick={() => openEditModal(category)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerDelete(category)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      isDark
                        ? 'border-red-900/80 bg-red-950/40 text-red-400 hover:bg-red-900/50'
                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {data && data.last_page && data.last_page > 1 && (
              <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                isDark ? 'border-[#60241E] bg-[#240E0C]' : 'border-stone-200/90 bg-white'
              }`}>
                <span className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                  Halaman {page} dari {data.last_page}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1 || isFetching}
                    onClick={() => setPage((c) => c - 1)}
                    className={`rounded-lg border px-3 py-1 font-semibold disabled:opacity-40 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= data.last_page || isFetching}
                    onClick={() => setPage((c) => c + 1)}
                    className={`rounded-lg border px-3 py-1 font-semibold disabled:opacity-40 transition ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-lg overflow-hidden rounded-2xl shadow-xl ${
            isDark ? 'bg-[#240E0C] border border-[#60241E]' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-6 py-4 ${
              isDark ? 'border-[#60241E]/60' : 'border-stone-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-700'
                }`}>
                  <FolderPlus size={16} />
                </div>
                <div>
                  <h2 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {editingCategory ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-stone-500'}`}>
                    {editingCategory
                      ? 'Perbarui data identitas dan slug kategori'
                      : 'Buat kategori baru untuk menu hidangan'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isDark ? 'text-stone-400 hover:bg-[#2D120F] hover:text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
                }`}
              >
                <X size={17} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 p-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="category-name"
                    className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="category-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Contoh: Paket Nasi Box Premium"
                    disabled={saving}
                    className={`w-full rounded-xl border px-4 py-2.5 sm:py-3 text-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500 focus:bg-[#1C0B09]'
                        : 'border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white'
                    }`}
                  />
                </div>

                {/* Slug with Auto Generator */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="category-slug"
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-stone-300' : 'text-stone-600'
                      }`}
                    >
                      Slug URL <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateSlug}
                      disabled={saving || !form.name.trim()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition hover:text-red-400 disabled:opacity-40"
                    >
                      <Sparkles size={12} />
                      <span>Buat dari Nama</span>
                    </button>
                  </div>

                  <input
                    id="category-slug"
                    name="slug"
                    type="text"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="paket-nasi-box-premium"
                    disabled={saving}
                    className={`w-full rounded-xl border px-4 py-2.5 sm:py-3 font-mono text-xs sm:text-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500 focus:bg-[#1C0B09]'
                        : 'border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white'
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Hanya huruf kecil, angka, dan tanda hubung (-). Digunakan untuk URL halaman menu.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="category-description"
                    className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    Deskripsi Kategori
                  </label>
                  <textarea
                    id="category-description"
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Tuliskan keterangan singkat jenis menu kategori ini..."
                    disabled={saving}
                    className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                      isDark
                        ? 'border-[#60241E] bg-[#1C0B09] text-white placeholder:text-stone-500 focus:bg-[#1C0B09]'
                        : 'border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className={`flex items-center justify-end gap-2.5 border-t px-6 py-3.5 ${
                isDark ? 'border-[#60241E]/60 bg-[#1C0B09]' : 'border-stone-100 bg-stone-50/60'
              }`}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold shadow-2xs transition disabled:opacity-50 ${
                    isDark
                      ? 'border-[#60241E] bg-[#240E0C] text-stone-300 hover:bg-[#2D120F] hover:text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  <span>
                    {saving
                      ? 'Menyimpan...'
                      : editingCategory
                        ? 'Simpan Perubahan'
                        : 'Tambah Kategori'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION DIALOG */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-xl ${
            isDark ? 'bg-[#240E0C] border border-[#60241E]' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 text-red-500">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'
              }`}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>Hapus Kategori?</h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className={`mt-4 text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className={isDark ? 'text-white' : 'text-stone-900'}>"{categoryToDelete.name}"</strong>?
              {categoryToDelete.products_count && categoryToDelete.products_count > 0 ? (
                <span className={`mt-1 block font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  Perhatian: Kategori ini masih memiliki {categoryToDelete.products_count} menu terkait.
                </span>
              ) : null}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setCategoryToDelete(null)
                }}
                disabled={deleting}
                className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold shadow-2xs transition disabled:opacity-50 ${
                  isDark
                    ? 'border-[#60241E] bg-[#1C0B09] text-stone-300 hover:bg-[#2D120F]'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                <span>{deleting ? 'Menghapus...' : 'Ya, Hapus Kategori'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
