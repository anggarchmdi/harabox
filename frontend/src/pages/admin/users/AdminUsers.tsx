import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Plus,
  Search,
  KeyRound,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import type { User, UserRole, CreateAdminUserRequest, UpdateAdminUserRequest } from '../../../types/auth'
import { userService } from '../../../services/user.service'
import { useAuthStore } from '../../../stores/auth.store'
import { useThemeStore } from '../../../stores/theme.store'
import useDebounce from '../../../hooks/useDebounce'
import { showDynamicIslandToast } from '../../../components/ui/AppToaster'

export default function AdminUsers() {
  const navigate = useNavigate()
  const isDark = useThemeStore((state) => state.theme === 'dark')
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput.trim(), 400)
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Selected User
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState<CreateAdminUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    is_active: true,
  })
  const [editForm, setEditForm] = useState<UpdateAdminUserRequest>({
    name: '',
    email: '',
    role: 'admin',
    is_active: true,
  })
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter],
    queryFn: () =>
      userService.list({
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  // Stats
  const totalUsers = users.length
  const totalSuperAdmins = users.filter((u) => u.role === 'super_admin').length
  const totalStaffAdmins = users.filter((u) => u.role === 'admin').length
  const totalActive = users.filter((u) => u.is_active).length

  // Handlers
  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      is_active: true,
    })
    setShowPassword(false)
    setCreateModalOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'admin',
      is_active: user.is_active ?? true,
    })
    setEditModalOpen(true)
  }

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user)
    setNewPassword('')
    setShowPassword(false)
    setPasswordModalOpen(true)
  }

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Mohon lengkapi seluruh field yang diperlukan.')
      return
    }

    setSubmitting(true)
    try {
      await userService.create(createForm)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreateModalOpen(false)
      showDynamicIslandToast({
        title: 'Admin Berhasil Ditambahkan',
        message: `${createForm.name} (${createForm.role === 'super_admin' ? 'Super Admin' : 'Admin'}) siap login.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : 'Gagal menambahkan admin baru.'
      toast.error(msg || 'Gagal menambahkan admin baru.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setSubmitting(true)
    try {
      await userService.update(selectedUser.id, editForm)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditModalOpen(false)
      showDynamicIslandToast({
        title: 'Data Admin Diperbarui',
        message: `Akun ${editForm.name} berhasil diperbarui.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : 'Gagal memperbarui data admin.'
      toast.error(msg || 'Gagal memperbarui data admin.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) {
      toast.error('Masukkan password baru minimal 6 karakter.')
      return
    }

    setSubmitting(true)
    try {
      await userService.resetPassword(selectedUser.id, newPassword)
      setPasswordModalOpen(false)
      showDynamicIslandToast({
        title: 'Password Berhasil Diubah',
        message: `Password akun ${selectedUser.name} telah diganti.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : 'Gagal mengganti password.'
      toast.error(msg || 'Gagal mengganti password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (currentUser?.id === user.id) return

    setTogglingId(user.id)
    try {
      const updated = await userService.toggleStatus(user.id)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      showDynamicIslandToast({
        title: updated.is_active ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan',
        message: updated.is_active
          ? `Akun ${user.name} sekarang aktif dan dapat login.`
          : `Akun ${user.name} telah dinonaktifkan dari sistem.`,
        type: updated.is_active ? 'success' : 'info',
      })
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : 'Gagal mengubah status akun.'
      toast.error(msg || 'Gagal mengubah status akun.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      await userService.delete(selectedUser.id)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteModalOpen(false)
      showDynamicIslandToast({
        title: 'Akun Dihapus',
        message: `Akun ${selectedUser.name} telah dihapus dari sistem.`,
        type: 'info',
      })
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : 'Gagal menghapus akun.'
      toast.error(msg || 'Gagal menghapus akun.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Manajemen Akun Admin
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/25">
              <ShieldCheck size={13} />
              <span>Super Admin Area</span>
            </span>
          </div>
          <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Kelola akses staf operasional dan tim IT agar sesi login tidak saling bertabrakan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div
          className={`rounded-2xl border p-4 transition ${
            isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Total Akun</span>
            <Users size={16} className="text-amber-500" />
          </div>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {totalUsers}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">Terdaftar di sistem</p>
        </div>

        <div
          className={`rounded-2xl border p-4 transition ${
            isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Super Admin</span>
            <ShieldCheck size={16} className="text-amber-400" />
          </div>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {totalSuperAdmins}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">Tim IT & Manajemen</p>
        </div>

        <div
          className={`rounded-2xl border p-4 transition ${
            isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Admin Staf</span>
            <UserCheck size={16} className="text-amber-600" />
          </div>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {totalStaffAdmins}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">Operasional Pesanan</p>
        </div>

        <div
          className={`rounded-2xl border p-4 transition ${
            isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Akun Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <p className={`mt-2 text-2xl font-bold text-emerald-400`}>
            {totalActive}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">Dapat melakukan login</p>
        </div>
      </div>

      {/* Super Admin Secret Audit Log Banner Card */}
      {currentUser?.role === 'super_admin' && (
        <div
          onClick={() => navigate('/admin/activity-logs')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md ${
            isDark
              ? 'bg-gradient-to-r from-[#220E0B] via-[#2A110D] to-[#1E0C0A] border-[#5E221C] hover:border-amber-500/50'
              : 'bg-gradient-to-r from-amber-50/70 via-rose-50/40 to-white border-amber-200/80 hover:border-amber-400'
          }`}
        >
          {/* Decorative background glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-300" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
                isDark
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-xs'
                  : 'bg-amber-100 text-amber-700 border border-amber-300/60 shadow-xs'
              }`}>
                <ShieldAlert size={24} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    <ShieldCheck size={11} /> Rahasia Super Admin
                  </span>
                  <span className={`text-[11px] font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    • Retensi 60 Hari
                  </span>
                </div>

                <h3 className={`mt-1 text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Audit Log & Rekam Jejak Aksi Admin
                </h3>

                <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-100/70' : 'text-stone-600'}`}>
                  Pantau siapa yang menghapus produk, mengubah kategori, memproses order, atau mengedit pengaturan sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 text-xs shadow-xs transition group-hover:translate-x-0.5">
                <span>Buka Log Aktivitas</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200 shadow-2xs'
        }`}
      >
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-stone-400' : 'text-stone-400'
            }`}
          />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau email admin..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`w-full rounded-xl border py-2 pl-9 pr-4 text-xs transition focus:outline-hidden ${
              isDark
                ? 'border-[#5E221C] bg-[#180A08] text-white focus:border-amber-400'
                : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role selector */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'super_admin' | 'admin')}
            className={`rounded-xl border py-2 px-3 text-xs font-medium transition focus:outline-hidden ${
              isDark
                ? 'border-[#5E221C] bg-[#180A08] text-stone-200'
                : 'border-stone-200 bg-stone-50 text-stone-700'
            }`}
          >
            <option value="all">Semua Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin Staf</option>
          </select>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className={`rounded-xl border py-2 px-3 text-xs font-medium transition focus:outline-hidden ${
              isDark
                ? 'border-[#5E221C] bg-[#180A08] text-stone-200'
                : 'border-stone-200 bg-stone-50 text-stone-700'
            }`}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table / List */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#220E0B] border-[#5E221C]' : 'bg-white border-stone-200 shadow-2xs'
        }`}
      >
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-amber-500" />
            <span className="text-xs text-stone-400">Memuat data pengguna...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
            <UserX size={36} className="text-stone-400" />
            <p className="text-sm font-semibold">Tidak ada akun admin yang ditemukan</p>
            <p className="text-xs text-stone-400">
              {searchInput ? 'Coba ganti kata kunci pencarian.' : 'Klik tombol tambah untuk membuat akun admin pertama.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark
                    ? 'border-[#5E221C] bg-[#1C0B09] text-amber-200/70'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Pengguna</th>
                  <th className="py-3.5 px-4">Role Akses</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => {
                  const isCurrent = currentUser?.id === user.id
                  const isSuper = user.role === 'super_admin'

                  return (
                    <tr
                      key={user.id}
                      className={`transition ${
                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold uppercase shadow-inner ${
                              isSuper
                                ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950'
                                : 'bg-stone-800 text-stone-200'
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/10 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                            <ShieldCheck size={13} className="text-amber-400" />
                            <span>Super Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-500/15 px-3 py-1 text-[11px] font-medium text-stone-300 border border-stone-500/20">
                            <UserCheck size={13} className="text-stone-400" />
                            <span>Admin Staf</span>
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={user.is_active}
                            disabled={isCurrent || togglingId === user.id}
                            onClick={() => handleToggleStatus(user)}
                            title={
                              isCurrent
                                ? 'Akun Anda sendiri (tidak dapat dinonaktifkan)'
                                : user.is_active
                                ? 'Klik untuk menonaktifkan akun'
                                : 'Klik untuk mengaktifkan akun'
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-35 disabled:cursor-not-allowed ${
                              user.is_active
                                ? 'bg-emerald-600'
                                : isDark
                                ? 'bg-[#381612]'
                                : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                user.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <div className="flex items-center gap-1.5 min-w-[75px]">
                            {togglingId === user.id ? (
                              <Loader2 size={13} className="animate-spin text-amber-500" />
                            ) : (
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  user.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-stone-400'
                                }`}
                              />
                            )}
                            <span
                              className={`text-xs font-bold ${
                                user.is_active
                                  ? 'text-emerald-400'
                                  : isDark
                                  ? 'text-stone-400'
                                  : 'text-stone-500'
                              }`}
                            >
                              {user.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(user)}
                            title="Ganti Password"
                            className="rounded-lg p-2 text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                          >
                            <KeyRound size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Data Admin"
                            className="rounded-lg p-2 text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleOpenDelete(user)}
                            title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Akun'}
                            className="rounded-lg p-2 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          MODAL TAMBAH ADMIN BARU
      ====================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#180A08] border-[#5E221C] text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tambah Admin Baru</h3>
                  <p className="text-xs text-stone-400">Buat akun untuk staf atau tim IT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Nama Lengkap Admin <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso (Admin Dapur)"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden ${
                    isDark
                      ? 'border-[#5E221C] bg-[#220E0B] text-white focus:border-amber-400'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Email Login <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@pawonhara.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden ${
                    isDark
                      ? 'border-[#5E221C] bg-[#220E0B] text-white focus:border-amber-400'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Password Awal <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter..."
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className={`w-full rounded-xl border py-2.5 pl-3.5 pr-10 text-xs transition focus:outline-hidden ${
                      isDark
                        ? 'border-[#5E221C] bg-[#220E0B] text-white focus:border-amber-400'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Role Hak Akses <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'admin' })}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                      createForm.role === 'admin'
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : isDark
                        ? 'border-[#441814] bg-[#220E0B] text-stone-400'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <UserCheck size={14} className="text-amber-500" />
                      Admin Staf
                    </span>
                    <span className="text-[10.5px] text-stone-400 mt-1">
                      Mengelola pesanan, katalog menu, dan kapasitas.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'super_admin' })}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer ${
                      createForm.role === 'super_admin'
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : isDark
                        ? 'border-[#441814] bg-[#220E0B] text-stone-400'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-amber-400" />
                      Super Admin
                    </span>
                    <span className="text-[10.5px] text-stone-400 mt-1">
                      Akses penuh termasuk membuat & kelola akun admin.
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Admin Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL EDIT ADMIN
      ====================================================== */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#180A08] border-[#5E221C] text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Akun Admin</h3>
                  <p className="text-xs text-stone-400">{selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden ${
                    isDark
                      ? 'border-[#5E221C] bg-[#220E0B] text-white focus:border-amber-400'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Email Login
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition focus:outline-hidden ${
                    isDark
                      ? 'border-[#5E221C] bg-[#220E0B] text-white focus:border-amber-400'
                      : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Role Hak Akses
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  disabled={currentUser?.id === selectedUser.id}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium transition focus:outline-hidden disabled:opacity-50 ${
                    isDark
                      ? 'border-[#5E221C] bg-[#220E0B] text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-900'
                  }`}
                >
                  <option value="admin">Admin Staf Operasional</option>
                  <option value="super_admin">Super Admin (Tim IT / Owner)</option>
                </select>
                {currentUser?.id === selectedUser.id && (
                  <p className="mt-1 text-[11px] text-stone-400">
                    Anda tidak dapat mengubah role akun yang sedang Anda gunakan saat ini.
                  </p>
                )}
              </div>

              {/* Status Akun Toggle in Edit Modal */}
              <div
                className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                  isDark ? 'border-[#5E221C] bg-[#220E0B]' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">Status Akun</h4>
                  <p className="text-[11px] text-stone-400">
                    {editForm.is_active
                      ? 'Akun aktif dan diizinkan login ke admin dashboard'
                      : 'Akun dinonaktifkan (tidak bisa login)'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-bold ${
                      editForm.is_active ? 'text-emerald-400' : 'text-stone-400'
                    }`}
                  >
                    {editForm.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editForm.is_active}
                    disabled={currentUser?.id === selectedUser.id}
                    onClick={() => setEditForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                    title={currentUser?.id === selectedUser.id ? 'Tidak dapat menonaktifkan akun sendiri' : undefined}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
                      editForm.is_active ? 'bg-emerald-600' : isDark ? 'bg-[#381612]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        editForm.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL GANTI PASSWORD
      ====================================================== */}
      {passwordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#180A08] border-[#5E221C] text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ganti Password</h3>
                  <p className="text-xs text-stone-400">{selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Password Baru <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full rounded-xl border py-2.5 pl-3.5 pr-10 text-xs transition focus:outline-hidden ${
                      isDark
                        ? 'border-[#5E221C] bg-[#220E0B] text-white focus:border-amber-400'
                        : 'border-stone-200 bg-stone-50 text-stone-900 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Perbarui Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL KONFIRMASI HAPUS
      ====================================================== */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#180A08] border-[#5E221C] text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Akun Admin?</h3>
                <p className="text-xs text-stone-400">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-xs text-stone-300">
              <p>
                Anda akan menghapus akun <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                Sesi login akun ini akan otomatis dicabut.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
