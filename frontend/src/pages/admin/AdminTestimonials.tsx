import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { testimonialService, type TestimonialFilters } from '../../services/testimonial.service'
import type { Testimonial } from '../../types/testimonial'

export default function AdminTestimonials() {
  const queryClient = useQueryClient()

  // State filter
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'displayed' | 'hidden'>('all')
  const [page, setPage] = useState(1)

  // State Modal Tambah Manual
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalInstitution, setModalInstitution] = useState('')
  const [modalQuantity, setModalQuantity] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [modalRating, setModalRating] = useState(5)
  const [modalIsDisplayed, setModalIsDisplayed] = useState(true)

  // State Modal Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)

  // Filter params untuk service
  const queryParams: TestimonialFilters = {
    page,
    search: search.trim() || undefined,
    is_displayed:
      statusFilter === 'displayed'
        ? true
        : statusFilter === 'hidden'
          ? false
          : '',
  }

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['admin-testimonials', queryParams],
    queryFn: () => testimonialService.getAdminAll(queryParams),
    placeholderData: (prev) => prev,
  })

  // Mutation Toggle
  const toggleMutation = useMutation({
    mutationFn: (id: number) => testimonialService.toggleDisplay(id),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      const statusText = updatedItem.is_displayed
        ? 'ditampilkan di beranda'
        : 'disembunyikan dari beranda'
      toast.success(`Testimoni dari "${updatedItem.name}" berhasil ${statusText}.`)
    },
    onError: () => {
      toast.error('Gagal memperbarui status tampilan testimoni.')
    },
  })

  // Mutation Create Manual
  const createMutation = useMutation({
    mutationFn: () =>
      testimonialService.createAdmin({
        name: modalName.trim(),
        institution: modalInstitution.trim() || undefined,
        rating: modalRating,
        order_quantity: modalQuantity.trim(),
        message: modalMessage.trim(),
        is_displayed: modalIsDisplayed,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      toast.success('Testimoni baru berhasil ditambahkan!')
      setIsModalOpen(false)
      resetModalForm()
    },
    onError: (err: unknown) => {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Gagal menambahkan testimoni.'
      toast.error(errorMsg || 'Gagal menambahkan testimoni.')
    },
  })

  // Mutation Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => testimonialService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      toast.success('Testimoni berhasil dihapus.')
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Gagal menghapus testimoni.')
    },
  })

  const resetModalForm = () => {
    setModalName('')
    setModalInstitution('')
    setModalQuantity('')
    setModalMessage('')
    setModalRating(5)
    setModalIsDisplayed(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalName.trim() || !modalQuantity.trim() || !modalMessage.trim()) {
      toast.error('Mohon lengkapi seluruh kolom yang wajib diisi.')
      return
    }
    createMutation.mutate()
  }

  const testimonials = data?.data?.data ?? []
  const summary = data?.summary ?? {
    total: 0,
    displayed: 0,
    hidden: 0,
    average_rating: 5,
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Testimoni & Ulasan Pelanggan
            </h1>
            <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
              Live Filter
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Pilih dan filter testimoni pelanggan yang akan ditampilkan pada slider beranda utama.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-stone-800 transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Tambah Ulasan Manual
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Total Ulasan</span>
            <div className="h-8 w-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <MessageSquareQuote size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900">{summary.total}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Semua ulasan yang tercatat</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Tampil di Beranda</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-900">{summary.displayed}</div>
          <p className="text-[11px] text-emerald-700/70 mt-0.5">Aktif di slider homepage</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Disembunyikan</span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <EyeOff size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-900">{summary.hidden}</div>
          <p className="text-[11px] text-amber-700/70 mt-0.5">Tidak muncul di homepage</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Rata-Rata Rating</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star size={16} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 flex items-center gap-1.5">
            {summary.average_rating}
            <span className="text-xs font-bold text-amber-500">/ 5.0</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Tingkat kepuasan pesanan</p>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Semua ({summary.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('displayed')
                setPage(1)
              }}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'displayed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Ditampilkan ({summary.displayed})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('hidden')
                setPage(1)
              }}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'hidden'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Disembunyikan ({summary.hidden})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama, instansi, ulasan..."
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 py-2 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Tabel Data Testimoni */}
        <div className="overflow-x-auto rounded-2xl border border-stone-100">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-100">
              <tr>
                <th className="px-4 py-3.5">Pelanggan & Instansi</th>
                <th className="px-4 py-3.5">Rating & Pesanan</th>
                <th className="px-4 py-3.5 min-w-[280px]">Isi Ulasan Testimoni</th>
                <th className="px-4 py-3.5 text-center">Status Tampil</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="animate-spin h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Memuat data testimoni...</span>
                    </div>
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <MessageSquareQuote size={32} className="text-stone-300" />
                      <p className="font-bold text-stone-700">Belum ada testimoni yang sesuai</p>
                      <p className="text-xs text-stone-400">
                        {search
                          ? 'Coba ganti kata kunci pencarian Anda.'
                          : 'Ulasan baru dari formulir /testimoni akan otomatis muncul di sini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                testimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition">
                    {/* Nama & Instansi */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-black text-stone-900">{item.name}</div>
                      <div className="text-[11px] text-stone-500">
                        {item.institution || 'Pelanggan Personal'}
                      </div>
                      {item.order_code && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-stone-400">
                          {item.order_code}
                        </span>
                      )}
                    </td>

                    {/* Rating & Jumlah Pesanan */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: item.rating }).map((_, r) => (
                          <Star key={r} size={13} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="mt-1">
                        <span className="inline-block rounded-full bg-stone-100 border border-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                          {item.order_quantity}
                        </span>
                      </div>
                    </td>

                    {/* Isi Ulasan */}
                    <td className="px-4 py-3.5 align-top">
                      <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                        "{item.message}"
                      </p>
                      {item.created_at && (
                        <span className="block mt-1 text-[10px] text-stone-400">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </td>

                    {/* Toggle Status Tampil */}
                    <td className="px-4 py-3.5 align-top text-center">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(item.id)}
                        disabled={toggleMutation.isPending}
                        title={
                          item.is_displayed
                            ? 'Klik untuk menyembunyikan dari homepage'
                            : 'Klik untuk menampilkan di homepage'
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                          item.is_displayed
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                        }`}
                      >
                        {item.is_displayed ? (
                          <>
                            <Eye size={13} className="text-emerald-700" />
                            <span>Tampil</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} className="text-stone-400" />
                            <span>Sembunyi</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Aksi Hapus */}
                    <td className="px-4 py-3.5 align-top text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus ulasan ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {data?.data && data.data.last_page > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500">
              Menampilkan {data.data.from ?? 0} - {data.data.to ?? 0} dari {data.data.total} testimoni
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-bold text-stone-800">
                {page} / {data.data.last_page}
              </span>
              <button
                type="button"
                disabled={page >= data.data.last_page}
                onClick={() => setPage((p) => Math.min(p + 1, data.data.last_page))}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          MODAL TAMBAH ULASAN MANUAL (ADMIN)
      ====================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-red-600" />
                <h3 className="text-base font-black text-stone-900">Tambah Ulasan Testimoni</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Rating Bintang */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Rating Bintang (1 - 5) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setModalRating(s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={
                          s <= modalRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">{modalRating} Bintang</span>
                </div>
              </div>

              {/* Nama & Instansi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nama Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="Contoh: Dian Safitri"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nama Instansi / Acara
                  </label>
                  <input
                    type="text"
                    value={modalInstitution}
                    onChange={(e) => setModalInstitution(e.target.value)}
                    placeholder="Contoh: PT Mandiri / Syukuran"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jumlah Pesanan */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Jumlah Pesanan *</span>
                  <span className="text-[10px] text-stone-400 font-normal">Tanpa addons</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(e.target.value)}
                  placeholder="Contoh: 85 Box atau 50 Porsi"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Teks Pesan */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Isi Testimoni / Ulasan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  placeholder="Ceritakan kepuasan pelanggan..."
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs sm:text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Langsung Tampilkan Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsDisplayed"
                  checked={modalIsDisplayed}
                  onChange={(e) => setModalIsDisplayed(e.target.checked)}
                  className="h-4 w-4 rounded-md border-stone-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="modalIsDisplayed" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Langsung tampilkan di slider homepage
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Testimoni'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL KONFIRMASI HAPUS
      ====================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-black text-stone-900">Hapus Testimoni?</h3>
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus testimoni dari{' '}
              <strong className="text-stone-800">{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 border border-stone-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
