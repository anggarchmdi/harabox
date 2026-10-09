import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldAlert,
  Search,
  RotateCcw,
  Clock,
  Trash2,
  PlusCircle,
  FileEdit,
  ArrowLeft,
  User as UserIcon,
  Sparkles,
  HardDriveDownload,
  RefreshCw,
  Layers,
  ShoppingBag,
  Sliders,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { activityLogService } from '../../services/activity-log.service'
import type { ActivityLog } from '../../types/activity-log'
import { useAuthStore } from '../../stores/auth.store'
import { useThemeStore } from '../../stores/theme.store'
import useDebounce from '../../hooks/useDebounce'
import PageLoader from '../../components/ui/PageLoader'
import Pagination from '../../components/ui/Pagination'

export default function AdminActivityLogs() {
  const navigate = useNavigate()
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  // Pagination & Filter States
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput.trim(), 400)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')

  // Prune manual modal
  const [pruneModalOpen, setPruneModalOpen] = useState(false)

  // Guard: Only super admin can access
  const isSuperAdmin = currentUser?.role === 'super_admin'

  // Fetch Logs (Default 50 per page)
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['admin-activity-logs', page, perPage, search, actionFilter, subjectFilter],
    queryFn: () =>
      activityLogService.list({
        page,
        per_page: perPage,
        search: search || undefined,
        action: actionFilter === 'all' ? undefined : actionFilter,
        subject_type: subjectFilter === 'all' ? undefined : subjectFilter,
      }),
    enabled: isSuperAdmin,
  })

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-activity-logs-stats'],
    queryFn: () => activityLogService.getStats(),
    enabled: isSuperAdmin,
  })

  // Prune Mutation
  const pruneMutation = useMutation({
    mutationFn: (days: number) => activityLogService.prune(days),
    onSuccess: (data) => {
      toast.success(data.message)
      setPruneModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs-stats'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal membersihkan log lama.')
    },
  })

  const logs: ActivityLog[] = logsResponse?.data ?? []
  const currentPage = logsResponse?.current_page ?? 1
  const lastPage = logsResponse?.last_page ?? 1
  const total = logsResponse?.total ?? 0

  const handleResetFilters = () => {
    setSearchInput('')
    setActionFilter('all')
    setSubjectFilter('all')
    setPerPage(50)
    setPage(1)
  }

  const hasActiveFilters = Boolean(searchInput || actionFilter !== 'all' || subjectFilter !== 'all' || perPage !== 50)

  // If not super admin, show access denied view
  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
          <ShieldAlert size={32} />
        </div>
        <h2 className={`mt-5 text-xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
          Akses Khusus Super Admin
        </h2>
        <p className={`mt-2 text-xs sm:text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
          Halaman log aktivitas ini dirancang khusus untuk Super Admin guna menjaga kerahasiaan dan keamanan sistem audit.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Trash2 size={10} /> Hapus
          </span>
        )
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <PlusCircle size={10} /> Tambah
          </span>
        )
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FileEdit size={10} /> Ubah
          </span>
        )
      case 'status_change':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <RefreshCw size={10} /> Ganti Status
          </span>
        )
      case 'payment_update':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <DollarSign size={10} /> Pembayaran
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-stone-500/15 text-stone-400 border border-stone-500/30">
            {action}
          </span>
        )
    }
  }

  const getSubjectIcon = (subjectType: string) => {
    switch (subjectType) {
      case 'product':
        return <ShoppingBag size={14} className="text-amber-400" />
      case 'category':
        return <Layers size={14} className="text-emerald-400" />
      case 'order':
        return <Clock size={14} className="text-sky-400" />
      case 'user':
        return <UserIcon size={14} className="text-purple-400" />
      case 'setting':
        return <Sliders size={14} className="text-amber-500" />
      default:
        return <Sparkles size={14} className="text-stone-400" />
    }
  }

  return (
    <>
      <PageLoader
        isLoading={isLoading}
        text="Memuat Log Aktivitas..."
        subtext="Menyiapkan data audit jejak aksi admin"
        minDuration={300}
      />

      <div className={`min-h-screen space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 ${
        isDark ? 'text-stone-100' : 'text-stone-900'
      }`}>
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline cursor-pointer ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ArrowLeft size={13} />
              Kembali ke Kelola Admin
            </button>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Audit Keamanan & Jejak Operasional
              </p>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-stone-950'}`}>
              Log Aktivitas Admin
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-amber-100/70' : 'text-stone-500'}`}>
              Fitur khusus Super Admin untuk memantau siapa yang membuat, mengedit, atau menghapus data (produk, kategori, order, dll) guna mencegah salah input dan manipulasi.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPruneModalOpen(true)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition shadow-2xs cursor-pointer ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-stone-300 hover:bg-[#25100D] hover:text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
              title="Bersihkan log aktivitas yang sudah melebihi 60 hari"
            >
              <HardDriveDownload size={14} className="text-amber-400" />
              <span>Bersihkan Log Lama</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div
            className={`rounded-2xl border p-4 shadow-2xs transition ${
              isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-400">Total Log</span>
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {stats?.total_logs ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-stone-400">Aktivitas tercatat</p>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-2xs transition ${
              isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-400">Aksi Hapus</span>
              <Trash2 size={16} className="text-rose-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-500">
              {stats?.delete_actions ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-stone-400">Tindakan kritis / hapus</p>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-2xs transition ${
              isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-400">Aktivitas Hari Ini</span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {stats?.today_logs ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-stone-400">Hari ini ({new Date().toLocaleDateString('id-ID')})</p>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-2xs transition ${
              isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400">Retensi Otomatis</span>
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              60 Hari
            </p>
            <p className="mt-1 text-[11px] text-stone-400">Dibersihkan otomatis berkala</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          className={`rounded-2xl border p-4 shadow-2xs space-y-3 ${
            isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200'
          }`}
        >
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
                placeholder="Cari nama admin, menu produk, ID order, atau kata kunci aksi..."
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs outline-none transition ${
                  isDark
                    ? 'border-[#5E221C] bg-[#180A08] text-white placeholder-stone-500 focus:border-red-500'
                    : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-red-500'
                }`}
              />
            </div>

            {/* Filter by Action */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              className={`h-10 rounded-xl border px-3 text-xs font-medium outline-none transition ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-stone-200 focus:border-[#F59E0B]'
                  : 'border-stone-200 bg-white text-stone-700 focus:border-red-600'
              }`}
            >
              <option value="all">Semua Tipe Aksi</option>
              <option value="delete">Aksi Hapus (Delete)</option>
              <option value="create">Aksi Tambah (Create)</option>
              <option value="update">Aksi Ubah (Update)</option>
              <option value="status_change">Ubah Status</option>
              <option value="payment_update">Status Pembayaran</option>
            </select>

            {/* Filter by Subject Type */}
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value)
                setPage(1)
              }}
              className={`h-10 rounded-xl border px-3 text-xs font-medium outline-none transition ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-stone-200 focus:border-[#F59E0B]'
                  : 'border-stone-200 bg-white text-stone-700 focus:border-red-600'
              }`}
            >
              <option value="all">Semua Objek</option>
              <option value="product">Menu Produk</option>
              <option value="category">Kategori</option>
              <option value="order">Pesanan</option>
              <option value="user">Akun Admin</option>
              <option value="setting">Pengaturan Toko</option>
              <option value="addon">Addon Pelengkap</option>
              <option value="payment_proof">Bukti Transfer</option>
            </select>

            {/* Filter by Items Per Page */}
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              className={`h-10 rounded-xl border px-3 text-xs font-semibold outline-none transition ${
                isDark
                  ? 'border-[#5E221C] bg-[#180A08] text-amber-300 focus:border-[#F59E0B]'
                  : 'border-stone-200 bg-white text-stone-800 focus:border-red-600'
              }`}
              title="Jumlah baris data per halaman"
            >
              <option value={25}>25 baris / hal</option>
              <option value={50}>50 baris / hal (Standar)</option>
              <option value={100}>100 baris / hal</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 h-10 text-xs font-semibold transition cursor-pointer ${
                  isDark
                    ? 'border-[#5E221C] bg-[#180A08] text-stone-200 hover:bg-[#25100D]'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Logs Table / Cards */}
        {logs.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
              isDark ? 'border-[#5E221C] bg-[#180A08]' : 'border-stone-200 bg-white'
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Clock size={24} />
            </div>
            <h3 className={`mt-3 text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Belum Ada Log Aktivitas
            </h3>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {hasActiveFilters
                ? 'Tidak ada aktivitas yang sesuai dengan filter pencarian.'
                : 'Aktivitas para admin akan otomatis tercatat di sini saat melakukan aksi di sistem.'}
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border shadow-2xs overflow-hidden ${
              isDark ? 'border-[#5E221C] bg-[#180A08]' : 'border-stone-200 bg-white'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead
                  className={`border-b ${
                    isDark ? 'border-[#5E221C] bg-[#220E0B]' : 'border-stone-100 bg-stone-50/70'
                  }`}
                >
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Pelaku (Admin)
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Tipe Aksi
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Deskripsi Aktivitas
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Objek Terkait
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Waktu & Tanggal
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y text-xs ${isDark ? 'divide-[#5E221C]/60' : 'divide-stone-100'}`}>
                  {logs.map((log) => {
                    const dateObj = new Date(log.created_at)
                    const formattedDate = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })

                    return (
                      <tr
                        key={log.id}
                        className={`transition ${isDark ? 'hover:bg-[#25100D]/50' : 'hover:bg-stone-50/70'}`}
                      >
                        {/* Admin Actor */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                              log.user_role === 'super_admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-stone-700/30 text-stone-300 border border-stone-600/30'
                            }`}>
                              {log.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                {log.user_name}
                              </p>
                              <span className={`text-[10px] ${
                                log.user_role === 'super_admin' ? 'text-amber-400' : 'text-stone-400'
                              }`}>
                                {log.user_role === 'super_admin' ? 'Super Admin' : 'Admin Staf'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4">
                          <p className={`font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                            {log.description}
                          </p>
                          {log.ip_address && (
                            <span className="text-[10px] text-stone-500 block mt-0.5">
                              IP: {log.ip_address}
                            </span>
                          )}
                        </td>

                        {/* Subject */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {getSubjectIcon(log.subject_type)}
                            <span className={`capitalize font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                              {log.subject_name || log.subject_type}
                            </span>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <p className={`font-semibold ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                            {formattedTime}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {formattedDate}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-white/5">
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                total={total}
                onPageChange={setPage}
                itemName={`log aktivitas (${perPage}/hal)`}
                showWhenSinglePage={true}
              />
            </div>
          </div>
        )}

        {/* Modal Bersihkan Log Lama */}
        {pruneModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
                isDark ? 'bg-[#180A08] border-[#5E221C] text-stone-100' : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <HardDriveDownload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Bersihkan Log Lama?</h3>
                  <p className="text-xs text-stone-400">Mengoptimalkan kapasitas database</p>
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 bg-amber-950/20 border-amber-900/40 text-amber-200/90">
                <p>
                  Sistem otomatis menghapus log yang berumur lebih dari <strong>60 hari</strong> setiap harinya.
                </p>
                <p>
                  Anda juga dapat memicu pembersihan sekarang secara manual untuk menghapus semua data log yang sudah melewati 60 hari.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPruneModalOpen(false)}
                  disabled={pruneMutation.isPending}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold cursor-pointer ${
                    isDark ? 'border-[#5E221C] text-stone-300 hover:bg-[#25100D]' : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => pruneMutation.mutate(60)}
                  disabled={pruneMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
                >
                  {pruneMutation.isPending ? 'Membersihkan...' : 'Ya, Bersihkan Log > 60 Hari'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
