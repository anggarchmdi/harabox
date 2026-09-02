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
} from 'lucide-react'

import { toast } from 'sonner'

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { AxiosError } from 'axios'

import type {
  Category,
  CategoryForm,
} from '../../types/category'

import { categoryService } from '../../services/category.services'

const initialForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
}

export default function AdminCategories() {
  const queryClient = useQueryClient()

  // =========================
  // PAGINATION
  // =========================

  const [page, setPage] = useState(1)

  // =========================
  // SEARCH
  // =========================

  const [searchInput, setSearchInput] =
    useState('')

  const [search, setSearch] =
    useState('')

  // =========================
  // MODAL
  // =========================

  const [modalOpen, setModalOpen] =
    useState(false)

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null)

  const [form, setForm] =
    useState<CategoryForm>(initialForm)

  const [saving, setSaving] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<number | null>(null)

  // =========================
  // CATEGORY QUERY
  // =========================

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['categories', page],

    queryFn: () =>
      categoryService.getAdminAll(page),
  })

  const categories =
    data?.data ?? []

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
  // LOCAL SEARCH
  // =========================

  const filteredCategories =
    categories.filter((category) => {
      const keyword =
        search.toLowerCase()

      return (
        category.name
          .toLowerCase()
          .includes(keyword) ||
        category.slug
          .toLowerCase()
          .includes(keyword)
      )
    })

  // =========================
  // MODAL
  // =========================

  const openCreateModal = () => {
    setEditingCategory(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEditModal = async (
    category: Category,
  ) => {
    try {
      const detail =
        await categoryService.getAdminById(
          category.id,
        )

      setEditingCategory(detail)

      setForm({
        name: detail.name,
        slug: detail.slug,
        description:
          detail.description ?? '',
      })

      setModalOpen(true)
    } catch (error) {
      const axiosError =
        error as AxiosError<{
          message?: string
        }>

      toast.error(
        axiosError.response?.data
          ?.message ??
          'Gagal mengambil data kategori.',
      )
    }
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    setModalOpen(false)
    setEditingCategory(null)
    setForm(initialForm)
  }

  // =========================
  // FORM
  // =========================

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target

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

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error(
        'Nama kategori wajib diisi.',
      )
      return
    }

    if (!form.slug.trim()) {
      toast.error(
        'Slug kategori wajib diisi.',
      )
      return
    }

    try {
      setSaving(true)

      const payload: CategoryForm = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description:
          form.description.trim(),
      }

      if (editingCategory) {
        await categoryService.update(
          editingCategory.id,
          payload,
        )

        toast.success(
          'Kategori berhasil diperbarui.',
        )
      } else {
        await categoryService.create(
          payload,
        )

        toast.success(
          'Kategori berhasil ditambahkan.',
        )
      }

      // Refresh seluruh query categories.
      await queryClient.invalidateQueries({
        queryKey: ['categories'],
        refetchType: 'all',
      })

      closeModal()
    } catch (error) {
      const axiosError =
        error as AxiosError<{
          message?: string
          errors?: Record<
            string,
            string[]
          >
        }>

      const validationMessage =
        axiosError.response?.data?.errors

      if (validationMessage) {
        const firstError =
          Object.values(
            validationMessage,
          ).flat()[0]

        toast.error(firstError)
      } else {
        toast.error(
          axiosError.response?.data
            ?.message ??
            'Gagal menyimpan kategori.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (
    category: Category,
  ) => {
    const confirmed =
      window.confirm(
        `Yakin ingin menghapus kategori "${category.name}"?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(category.id)

      await categoryService.delete(
        category.id,
      )

      toast.success(
        'Kategori berhasil dihapus.',
      )

      await queryClient.invalidateQueries({
        queryKey: ['categories'],
        refetchType: 'all',
      })

      // Kalau halaman terakhir kosong
      if (
        categories.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) => current - 1,
        )
      }
    } catch (error) {
      const axiosError =
        error as AxiosError<{
          message?: string
        }>

      toast.error(
        axiosError.response?.data
          ?.message ??
          'Gagal menghapus kategori.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* =========================
          HEADER
      ========================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola kategori produk HaraBox.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl"
        >
          <Plus size={18} />
          Tambah Kategori
        </button>
      </div>

      {/* =========================
          TOOLBAR
      ========================= */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(
                event.target.value,
              )
            }
            placeholder="Cari kategori..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
          />
        </div>

        {isFetching && !isLoading && (
          <p className="text-xs text-gray-400">
            Memperbarui data...
          </p>
        )}
      </div>

      {/* =========================
          LOADING
      ========================= */}

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-600" />

            <p className="mt-4 text-sm text-gray-500">
              Memuat kategori...
            </p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        /* =========================
           EMPTY
        ========================= */

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <FolderOpen size={25} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-900">
            {search
              ? 'Kategori tidak ditemukan'
              : 'Belum ada kategori'}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {search
              ? 'Coba gunakan kata kunci pencarian lain.'
              : 'Tambahkan kategori pertama untuk mulai mengelola menu.'}
          </p>

          {!search && (
            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Plus size={17} />
              Tambah Kategori
            </button>
          )}
        </div>
      ) : (
        <>
          {/* =========================
              TABLE
          ========================= */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Kategori
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Slug
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Deskripsi
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Produk
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map(
                    (category) => (
                      <tr
                        key={category.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* NAME */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                              <FolderOpen
                                size={19}
                              />
                            </div>

                            <div>
                              <p className="font-bold text-gray-900">
                                {category.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                ID #
                                {category.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* SLUG */}

                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-600">
                            {category.slug}
                          </span>
                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-xs px-6 py-5">
                          <p className="truncate text-sm text-gray-600">
                            {category.description ||
                              '-'}
                          </p>
                        </td>

                        {/* PRODUCTS */}

                        <td className="px-6 py-5">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                            {category.products_count ??
                              0}{' '}
                            produk
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  category,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              <Edit3
                                size={15}
                              />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  category,
                                )
                              }
                              disabled={
                                deletingId ===
                                category.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2
                                size={15}
                              />

                              {deletingId ===
                              category.id
                                ? 'Menghapus...'
                                : 'Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* =========================
                PAGINATION
            ========================= */}

            {data &&
              data.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                  <p className="text-sm text-gray-500">
                    Menampilkan{' '}

                    <span className="font-semibold text-gray-700">
                      {data.from ?? 0}
                    </span>{' '}

                    -{' '}

                    <span className="font-semibold text-gray-700">
                      {data.to ?? 0}
                    </span>{' '}

                    dari{' '}

                    <span className="font-semibold text-gray-700">
                      {data.total}
                    </span>{' '}

                    kategori
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        page === 1 ||
                        isFetching
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current - 1,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={17}
                      />
                    </button>

                    <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-semibold text-white">
                      {page}
                    </div>

                    <button
                      type="button"
                      disabled={
                        page >=
                          data.last_page ||
                        isFetching
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current + 1,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight
                        size={17}
                      />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </>
      )}

      {/* =========================
          CREATE / EDIT MODAL
      ========================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory
                    ? 'Edit Kategori'
                    : 'Tambah Kategori'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCategory
                    ? 'Perbarui informasi kategori.'
                    : 'Tambahkan kategori baru.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
            >
              <div className="space-y-5 p-6">
                {/* NAME */}

                <div>
                  <label
                    htmlFor="category-name"
                    className="mb-2 block text-sm font-semibold text-gray-900"
                  >
                    Nama Kategori
                  </label>

                  <input
                    id="category-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    placeholder="Contoh: Nasi Box"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>

                {/* SLUG */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="category-slug"
                      className="block text-sm font-semibold text-gray-900"
                    >
                      Slug
                    </label>

                    <button
                      type="button"
                      onClick={
                        generateSlug
                      }
                      disabled={
                        saving ||
                        !form.name.trim()
                      }
                      className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Generate dari nama
                    </button>
                  </div>

                  <input
                    id="category-slug"
                    name="slug"
                    type="text"
                    value={form.slug}
                    onChange={
                      handleChange
                    }
                    placeholder="nasi-box"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />

                  <p className="mt-1.5 text-xs text-gray-400">
                    Digunakan sebagai URL kategori.
                  </p>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label
                    htmlFor="category-description"
                    className="mb-2 block text-sm font-semibold text-gray-900"
                  >
                    Deskripsi
                  </label>

                  <textarea
                    id="category-description"
                    name="description"
                    rows={4}
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Deskripsi kategori..."
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving
                    ? 'Menyimpan...'
                    : editingCategory
                      ? 'Simpan Perubahan'
                      : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
